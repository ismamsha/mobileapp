package com.screentranslate.app.ui

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.core.content.ContextCompat
import com.screentranslate.app.capture.MediaProjectionManagerHelper
import com.screentranslate.app.service.ScreenCaptureService
import com.screentranslate.app.service.ServiceState
import com.screentranslate.app.ui.theme.ScreenTranslateTheme
import com.screentranslate.app.util.DeviceUtils

enum class Screen { HOME, ONBOARDING_OVERLAY, ONBOARDING_CAPTURE, SETTINGS, MODELS, PRIVACY, ABOUT, XIAOMI_HELP }

class MainActivity : ComponentActivity() {

    private val vm: AppViewModel by viewModels()
    private val backStack = mutableStateListOf(Screen.HOME)
    val overlayGranted = mutableStateOf(false)
    /** True after the user came back from overlay settings without granting it. */
    val overlayDeniedOnce = mutableStateOf(false)
    private var waitingForOverlay = false

    private val consentLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        val data = res.data
        if (res.resultCode == RESULT_OK && data != null) {
            vm.markCaptureExplained()
            ScreenCaptureService.start(this, res.resultCode, data)
            backStack.clear()
            backStack.add(Screen.HOME)
            // Get out of the way so the user can open the app they want to translate.
            moveTaskToBack(true)
        } else {
            ServiceState.setMessage(
                "Screen capture permission was denied. Muin Screen Translator needs it to read the text on your screen. Tap Start to try again."
            )
            backStack.clear()
            backStack.add(Screen.HOME)
        }
    }

    private val notificationLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { requestCaptureConsent() }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            ScreenTranslateTheme {
                val current = backStack.last()
                BackHandler(enabled = backStack.size > 1) { backStack.removeAt(backStack.lastIndex) }
                AppScreens(
                    screen = current,
                    vm = vm,
                    activity = this,
                    navigate = { backStack.add(it) },
                    back = { if (backStack.size > 1) backStack.removeAt(backStack.lastIndex) },
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        overlayGranted.value = Settings.canDrawOverlays(this)
        if (waitingForOverlay) {
            waitingForOverlay = false
            if (overlayGranted.value) {
                if (backStack.last() == Screen.ONBOARDING_OVERLAY) {
                    backStack.removeAt(backStack.lastIndex)
                    backStack.add(Screen.ONBOARDING_CAPTURE)
                }
            } else {
                overlayDeniedOnce.value = true
            }
        }
        vm.refreshModels()
    }

    fun onStartPressed() {
        ServiceState.setMessage(null)
        when {
            !Settings.canDrawOverlays(this) -> backStack.add(Screen.ONBOARDING_OVERLAY)
            !vm.settings.value.captureExplained -> backStack.add(Screen.ONBOARDING_CAPTURE)
            else -> beginCapture()
        }
    }

    fun onStopPressed() = ScreenCaptureService.stop(this)

    fun openOverlaySettings() {
        waitingForOverlay = true
        try {
            startActivity(DeviceUtils.overlaySettingsIntent(this))
        } catch (e: ActivityNotFoundException) {
            // Some ROMs lack the per-app page; fall back to app details.
            runCatching { startActivity(DeviceUtils.appDetailsIntent(this)) }
        }
    }

    /** Step 2: optional notification permission (Android 13+), then the system capture dialog. */
    fun beginCapture() {
        if (!Settings.canDrawOverlays(this)) {
            backStack.add(Screen.ONBOARDING_OVERLAY)
            return
        }
        val prefs = getSharedPreferences("onboarding", Context.MODE_PRIVATE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED &&
            !prefs.getBoolean("asked_notifications", false)
        ) {
            prefs.edit().putBoolean("asked_notifications", true).apply()
            notificationLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            return
        }
        requestCaptureConsent()
    }

    private fun requestCaptureConsent() {
        try {
            consentLauncher.launch(MediaProjectionManagerHelper.createConsentIntent(this))
        } catch (e: Exception) {
            ServiceState.setMessage("This device doesn't allow screen capture.")
        }
    }
}
