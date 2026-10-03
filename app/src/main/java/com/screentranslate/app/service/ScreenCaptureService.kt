package com.screentranslate.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.display.DisplayManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.Display
import android.view.WindowManager
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import androidx.core.content.IntentCompat
import com.screentranslate.app.AppContainer
import com.screentranslate.app.R
import com.screentranslate.app.appContainer
import com.screentranslate.app.capture.MediaProjectionManagerHelper
import com.screentranslate.app.capture.ScreenCaptureController
import com.screentranslate.app.capture.ScreenMetrics
import com.screentranslate.app.model.AppLanguage
import com.screentranslate.app.model.BlockStyle
import com.screentranslate.app.model.OcrBlock
import com.screentranslate.app.overlay.BackgroundSampler
import com.screentranslate.app.overlay.FloatingBubbleController
import com.screentranslate.app.overlay.StatusMessageController
import com.screentranslate.app.overlay.TranslationOverlayController
import com.screentranslate.app.translation.ModelDownloadListener
import com.screentranslate.app.translation.TranslationException
import com.screentranslate.app.ui.MainActivity
import com.screentranslate.app.ui.TranslateNowActivity
import com.screentranslate.app.util.DeviceUtils
import com.screentranslate.app.util.Logx
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Foreground service (type mediaProjection) that holds the screen-capture session while the
 * screen translator is on, and runs the pipeline:
 * capture -> OCR -> group -> detect language -> translate -> overlay.
 */
class ScreenCaptureService : Service() {

    companion object {
        private const val ACTION_START = "com.screentranslate.app.START"
        private const val ACTION_STOP = "com.screentranslate.app.STOP"
        private const val ACTION_TRANSLATE = "com.screentranslate.app.TRANSLATE"
        private const val EXTRA_RESULT_CODE = "result_code"
        private const val EXTRA_DATA = "data"
        private const val EXTRA_DELAY = "delay"
        private const val CHANNEL_ID = "screen_translator"
        private const val NOTIFICATION_ID = 42

        fun start(context: Context, resultCode: Int, data: Intent) {
            val i = Intent(context, ScreenCaptureService::class.java)
                .setAction(ACTION_START)
                .putExtra(EXTRA_RESULT_CODE, resultCode)
                .putExtra(EXTRA_DATA, data)
            ContextCompat.startForegroundService(context, i)
        }

        fun stop(context: Context) {
            if (!ServiceState.running.value) return
            context.startService(Intent(context, ScreenCaptureService::class.java).setAction(ACTION_STOP))
        }

        fun translateNow(context: Context, delayMs: Long) {
            if (!ServiceState.running.value) return
            context.startService(
                Intent(context, ScreenCaptureService::class.java).setAction(ACTION_TRANSLATE).putExtra(EXTRA_DELAY, delayMs)
            )
        }
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val mainHandler = Handler(Looper.getMainLooper())
    private lateinit var container: AppContainer
    private lateinit var uiContext: Context
    private lateinit var windowManager: WindowManager

    private var capture: ScreenCaptureController? = null
    private var bubble: FloatingBubbleController? = null
    private var overlay: TranslationOverlayController? = null
    private var status: StatusMessageController? = null
    private var translateJob: Job? = null
    private var displayListenerRegistered = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        container = appContainer
        // Android 11+: overlays should be added from a window context bound to the display.
        uiContext = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val display = getSystemService(DisplayManager::class.java).getDisplay(Display.DEFAULT_DISPLAY)
            createDisplayContext(display).createWindowContext(WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, null)
        } else {
            this
        }
        windowManager = uiContext.getSystemService(WindowManager::class.java)
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> handleStart(intent)
            ACTION_STOP -> shutdown(null)
            ACTION_TRANSLATE -> {
                if (capture?.isActive == true) translate(intent.getLongExtra(EXTRA_DELAY, 0))
                else if (!ServiceState.running.value) stopSelf()
            }
            // Restarted by the system after being killed: the capture token cannot be reused.
            else -> if (capture == null) stopSelf()
        }
        return START_NOT_STICKY
    }

    // ---------------------------------------------------------------- start / stop

    private fun handleStart(intent: Intent) {
        // Android 14+: the mediaProjection foreground service must be running before getMediaProjection().
        try {
            ServiceCompat.startForeground(
                this, NOTIFICATION_ID, buildNotification(),
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION else 0,
            )
        } catch (e: Exception) {
            Logx.w("startForeground failed", e)
            shutdown("Screen capture could not start. Tap Start to try again.")
            return
        }
        if (capture?.isActive == true) {
            showBubbleIfEnabled()
            return
        }
        if (!Settings.canDrawOverlays(this)) {
            shutdown("MuinScreenTranslator needs permission to appear over other apps.")
            return
        }
        val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
        val data = IntentCompat.getParcelableExtra(intent, EXTRA_DATA, Intent::class.java)
        val projection = try {
            data?.let { MediaProjectionManagerHelper.getProjection(this, resultCode, it) }
        } catch (e: Exception) {
            Logx.w("getMediaProjection failed", e)
            null
        }
        if (projection == null) {
            shutdown("Screen capture permission was not granted. Tap Start to try again.")
            return
        }
        val metrics = ScreenMetrics.current(uiContext)
        val controller = ScreenCaptureController()
        try {
            controller.start(projection, metrics) {
                mainHandler.post { onProjectionStopped() }
            }
        } catch (e: Exception) {
            Logx.w("createVirtualDisplay failed", e)
            controller.release()
            shutdown("Screen capture could not start. Tap Start to try again.")
            return
        }
        capture = controller

        status = StatusMessageController(uiContext, windowManager)
        overlay = TranslationOverlayController(uiContext, windowManager, overlayCallbacks)
        bubble = FloatingBubbleController(uiContext, windowManager) { translate(0) }
        showBubbleIfEnabled()
        registerDisplayListener()
        ServiceState.setMessage(null)
        ServiceState.setRunning(true)

        observeSettings()
        prefetchModels()
    }

    private fun showBubbleIfEnabled() {
        val b = bubble ?: return
        val m = capture?.metrics ?: return
        if (!container.settings.current.showBubble) {
            b.hide()
            return
        }
        val ok = b.show(m.width, m.height)
        ServiceState.setBubbleBlocked(!ok)
        if (!ok) {
            val msg = if (DeviceUtils.isXiaomiFamily) {
                "The bubble was blocked. On Xiaomi, allow \"Display pop-up windows while running in the background\"."
            } else {
                "The bubble could not be shown. Allow MuinScreenTranslator to appear over other apps."
            }
            Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
        }
    }

    private fun observeSettings() {
        scope.launch {
            container.settings.settings.map { it.showBubble to it.targetLanguage }.distinctUntilChanged().collect {
                showBubbleIfEnabled()
                notificationManager().notify(NOTIFICATION_ID, buildNotification())
            }
        }
    }

    /** Downloads the target-language model and OCR data in the background on first start. */
    private fun prefetchModels() {
        scope.launch {
            val s = container.settings.current
            ensureOcrData()
            // Load the OCR engine now so the first tap is fast.
            container.appScope.launch {
                runCatching { container.tesseractOcr.warmUp() }
                runCatching {
                    val tiny = android.graphics.Bitmap.createBitmap(64, 32, android.graphics.Bitmap.Config.ARGB_8888)
                    container.mlKitOcr.recognizeLines(tiny)
                    tiny.recycle()
                }
            }
            try {
                container.translationEngine.ensureModel(s.targetLanguage.code, downloadListener)
                status?.hide()
            } catch (e: TranslationException) {
                status?.show(messageFor(e), durationMs = 6000)
            }
        }
    }

    private fun onProjectionStopped() {
        if (capture == null) return
        val msg = "Screen capture permission was stopped. Tap Start to enable it again."
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
        shutdown(msg)
    }

    private fun shutdown(message: String?) {
        message?.let { ServiceState.setMessage(it) }
        translateJob?.cancel()
        overlay?.hide()
        bubble?.hide()
        status?.hide()
        overlay = null
        bubble = null
        status = null
        capture?.release()
        capture = null
        unregisterDisplayListener()
        ServiceState.setRunning(false)
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        if (capture != null) shutdown(null)
        scope.cancel()
        container.appScope.launch { container.tesseractOcr.releaseSafely() }
        container.translationEngine.releaseTranslators()
        ServiceState.setRunning(false)
        super.onDestroy()
    }

    // ---------------------------------------------------------------- pipeline

    private val downloadListener = ModelDownloadListener { lang ->
        mainHandler.post {
            status?.show("Downloading ${AppLanguage.displayName(lang)} translation model…", busy = true)
        }
    }

    private suspend fun ensureOcrData() {
        val codes = container.settings.current.tesseractLanguages().split('+').filter { it.isNotEmpty() }
        val missing = codes.filter { !container.tessData.isInstalled(it) }
        if (missing.isEmpty()) return
        if (!DeviceUtils.isOnline(this)) {
            status?.show("Russian/Arabic text recognition data must be downloaded once. Connect to the internet.", durationMs = 5000)
            return
        }
        status?.show("Downloading text recognition data…", busy = true)
        try {
            container.tessData.ensure(missing)
            status?.hide()
        } catch (e: Exception) {
            if (e is CancellationException) throw e
            status?.show("Couldn't download text recognition data. Only English text will be recognized.", durationMs = 5000)
        }
    }

    private fun translate(delayMs: Long, targetOverride: AppLanguage? = null) {
        if (translateJob?.isActive == true) return
        val cap = capture ?: return
        translateJob = scope.launch {
            val b = bubble
            try {
                if (delayMs > 0) delay(delayMs)
                ensureOcrData()
                overlay?.hide()
                status?.hide()
                b?.setLoading(true)
                b?.setHiddenForCapture(true)
                val metrics = cap.metrics ?: return@launch
                val bitmap = try {
                    withContext(Dispatchers.Default) { cap.capture() }
                } finally {
                    b?.setHiddenForCapture(false)
                }
                if (bitmap == null) {
                    status?.show("Couldn't read the screen. Tap the bubble to try again.")
                    return@launch
                }
                // Screenshot lives only in RAM and is recycled right after OCR + color sampling.
                val styled: List<Pair<OcrBlock, BlockStyle>> = try {
                    val statusBar = statusBarHeight()
                    withContext(Dispatchers.Default) {
                        container.ocrEngine.recognize(bitmap)
                            // Clock/notification icons in the status bar are not content.
                            .filter { it.boundingBox.bottom > statusBar }
                            .map { it to BackgroundSampler.sample(bitmap, it.boundingBox) }
                    }
                } finally {
                    bitmap.recycle()
                }
                if (styled.isEmpty()) {
                    status?.show("No text was detected on this screen.")
                    return@launch
                }
                translateAndShow(styled, metrics, targetOverride ?: container.settings.current.targetLanguage)
            } catch (e: CancellationException) {
                throw e
            } catch (e: OutOfMemoryError) {
                container.trimMemory()
                status?.show("Not enough memory to translate this screen. Close some apps and try again.")
            } catch (e: Exception) {
                Logx.w("Translate failed", e)
                status?.show("Something went wrong. Tap the bubble to try again.")
            } finally {
                b?.setLoading(false)
            }
        }
    }

    @android.annotation.SuppressLint("DiscouragedApi", "InternalInsetResource")
    private fun statusBarHeight(): Int {
        val id = resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (id > 0) resources.getDimensionPixelSize(id) else (24 * resources.displayMetrics.density).toInt()
    }

    private suspend fun translateAndShow(
        styled: List<Pair<OcrBlock, BlockStyle>>,
        metrics: ScreenMetrics,
        target: AppLanguage,
    ) {
        val s = container.settings.current
        val result = withContext(Dispatchers.Default) {
            container.translationRepository.translateBlocks(styled, target.code, s.fixedSource, downloadListener)
        }
        status?.hide()
        val translated = result.blocks.count { it.translatedText != null }
        if (translated == 0) {
            val err = result.error
            status?.show(
                when {
                    err != null -> messageFor(err)
                    result.blocks.any { it.sourceLanguage == target.code } -> "This screen is already in ${target.englishName}."
                    else -> "The text on this screen is in a language that isn't supported yet."
                },
                durationMs = 5000,
            )
            return
        }
        if (capture?.metrics != metrics) {
            status?.show("The screen rotated. Tap the bubble to translate again.")
            return
        }
        overlay?.show(result.blocks, target, metrics.width, metrics.height, s.overlayOpacity, s.fontSize)
        result.error?.let { status?.show(messageFor(it), durationMs = 5000) }
        Logx.d("Shown $translated translated blocks")
    }

    private fun messageFor(e: TranslationException): String {
        val lang = e.languageTag?.let { AppLanguage.displayName(it) } ?: "This language"
        return when (e.reason) {
            TranslationException.Reason.MODEL_MISSING_OFFLINE ->
                "$lang translation model must be downloaded once. Connect to the internet and try again."
            TranslationException.Reason.MODEL_DOWNLOAD_FAILED ->
                "Couldn't download the $lang translation model. Check your connection and try again."
            TranslationException.Reason.UNSUPPORTED_LANGUAGE ->
                "$lang can't be translated yet."
            TranslationException.Reason.TRANSLATION_FAILED ->
                "Translation failed. Tap ↻ to try again."
        }
    }

    private val overlayCallbacks = object : TranslationOverlayController.Callbacks {
        override fun onClose() {
            overlay?.hide()
        }

        override fun onRetranslate() = translate(0)

        override fun onTargetLanguageSelected(language: AppLanguage) {
            scope.launch {
                container.settings.setTargetLanguage(language)
                container.settings.settings.first { it.targetLanguage == language }
                translate(0, language)
            }
        }

        override fun onOverlayShown() {
            bubble?.bringToFront()
        }
    }

    // ---------------------------------------------------------------- rotation

    private val displayListener = object : DisplayManager.DisplayListener {
        override fun onDisplayAdded(displayId: Int) {}
        override fun onDisplayRemoved(displayId: Int) {}
        override fun onDisplayChanged(displayId: Int) {
            if (displayId != Display.DEFAULT_DISPLAY) return
            checkScreenSize()
            // Some devices report the new size slightly later: check again.
            mainHandler.removeCallbacks(recheckSize)
            mainHandler.postDelayed(recheckSize, 400)
        }
    }

    private val recheckSize = Runnable { checkScreenSize() }

    override fun onConfigurationChanged(newConfig: android.content.res.Configuration) {
        super.onConfigurationChanged(newConfig)
        checkScreenSize()
    }

    private fun checkScreenSize() {
        val cap = capture ?: return
        val m = ScreenMetrics.current(uiContext)
        if (m.width == cap.metrics?.width && m.height == cap.metrics?.height) return
        Logx.d("Screen size changed: ${m.width}x${m.height}")
        translateJob?.cancel()
        overlay?.hide()
        bubble?.setLoading(false)
        bubble?.setHiddenForCapture(false)
        try {
            cap.resize(m)
        } catch (e: Exception) {
            Logx.w("resize failed", e)
        }
        bubble?.onScreenChanged(m.width, m.height)
    }

    private fun registerDisplayListener() {
        if (displayListenerRegistered) return
        getSystemService(DisplayManager::class.java).registerDisplayListener(displayListener, mainHandler)
        displayListenerRegistered = true
    }

    private fun unregisterDisplayListener() {
        if (!displayListenerRegistered) return
        mainHandler.removeCallbacks(recheckSize)
        getSystemService(DisplayManager::class.java).unregisterDisplayListener(displayListener)
        displayListenerRegistered = false
    }

    // ---------------------------------------------------------------- notification

    private fun notificationManager() = getSystemService(NotificationManager::class.java)

    private fun createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID, getString(R.string.notification_channel_name), NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = getString(R.string.notification_channel_desc)
            setShowBadge(false)
        }
        notificationManager().createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        val flags = PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        val open = PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), flags)
        val translate = PendingIntent.getActivity(
            this, 1, Intent(this, TranslateNowActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK), flags,
        )
        val stop = PendingIntent.getService(
            this, 2, Intent(this, ScreenCaptureService::class.java).setAction(ACTION_STOP), flags,
        )
        val target = if (::container.isInitialized) container.settings.current.targetLanguage.englishName else "Arabic"
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_translate)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(getString(R.string.notification_text, target))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setContentIntent(open)
            .addAction(0, getString(R.string.action_translate), translate)
            .addAction(0, getString(R.string.action_stop), stop)
            .build()
    }
}
