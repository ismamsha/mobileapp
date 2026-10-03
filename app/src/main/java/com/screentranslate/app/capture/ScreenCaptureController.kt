package com.screentranslate.app.capture

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.os.Handler
import android.os.HandlerThread
import com.screentranslate.app.util.Logx
import kotlinx.coroutines.delay
import java.util.concurrent.atomic.AtomicLong

/**
 * Owns the single VirtualDisplay of a MediaProjection session (Android 14+ allows only one
 * per consent) and hands out in-memory screenshots on demand. Nothing is written to disk.
 */
class ScreenCaptureController {

    private val thread = HandlerThread("ScreenCapture").apply { start() }
    private val handler = Handler(thread.looper)
    private val lock = Any()

    private var projection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var reader: ImageReader? = null
    private var latest: Image? = null
    private val frames = AtomicLong(0)

    var metrics: ScreenMetrics? = null
        private set

    private val callback = object : MediaProjection.Callback() {
        override fun onStop() {
            Logx.d("MediaProjection stopped by system/user")
            onStopped?.invoke()
        }

        // Android 14+: user-visible capture region changes are irrelevant here.
        override fun onCapturedContentResize(width: Int, height: Int) {}
        override fun onCapturedContentVisibilityChanged(isVisible: Boolean) {}
    }
    private var onStopped: (() -> Unit)? = null

    val isActive: Boolean get() = projection != null && virtualDisplay != null

    @SuppressLint("WrongConstant")
    fun start(projection: MediaProjection, metrics: ScreenMetrics, onStopped: () -> Unit) {
        this.projection = projection
        this.onStopped = onStopped
        this.metrics = metrics
        // Must be registered before createVirtualDisplay on Android 14+.
        projection.registerCallback(callback, handler)
        val r = newReader(metrics)
        reader = r
        virtualDisplay = projection.createVirtualDisplay(
            "ScreenTranslate",
            metrics.width, metrics.height, metrics.densityDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            r.surface, null, handler,
        )
    }

    @SuppressLint("WrongConstant")
    private fun newReader(m: ScreenMetrics): ImageReader =
        ImageReader.newInstance(m.width, m.height, PixelFormat.RGBA_8888, 3).apply {
            setOnImageAvailableListener({ rd ->
                synchronized(lock) {
                    val img = try {
                        rd.acquireLatestImage()
                    } catch (e: IllegalStateException) {
                        null
                    } ?: return@synchronized
                    latest?.close()
                    latest = img
                    frames.incrementAndGet()
                }
            }, handler)
        }

    /** Screen rotated or resolution changed: resize the existing virtual display (no new consent). */
    fun resize(newMetrics: ScreenMetrics) {
        val vd = virtualDisplay ?: return
        if (newMetrics == metrics) return
        val old = reader
        val r = newReader(newMetrics)
        synchronized(lock) {
            latest?.close()
            latest = null
            reader = r
            metrics = newMetrics
        }
        vd.resize(newMetrics.width, newMetrics.height, newMetrics.densityDpi)
        vd.surface = r.surface
        old?.setOnImageAvailableListener(null, null)
        old?.close()
    }

    /**
     * Returns a copy of the current screen. Waits briefly for a frame produced after the
     * call (so our own hidden bubble/overlay are not in the picture).
     */
    suspend fun capture(timeoutMs: Long = 500): Bitmap? {
        val startFrame = frames.get()
        delay(48)
        val deadline = System.currentTimeMillis() + timeoutMs
        while (frames.get() == startFrame && System.currentTimeMillis() < deadline) delay(16)
        synchronized(lock) {
            val img = latest ?: return null
            return imageToBitmap(img)
        }
    }

    private fun imageToBitmap(image: Image): Bitmap {
        val plane = image.planes[0]
        val pixelStride = plane.pixelStride
        val rowPadding = plane.rowStride - pixelStride * image.width
        val padded = Bitmap.createBitmap(image.width + rowPadding / pixelStride, image.height, Bitmap.Config.ARGB_8888)
        plane.buffer.rewind()
        padded.copyPixelsFromBuffer(plane.buffer)
        if (padded.width == image.width) return padded
        val cropped = Bitmap.createBitmap(padded, 0, 0, image.width, image.height)
        padded.recycle()
        return cropped
    }

    fun release() {
        synchronized(lock) {
            latest?.close()
            latest = null
        }
        virtualDisplay?.release()
        virtualDisplay = null
        reader?.setOnImageAvailableListener(null, null)
        reader?.close()
        reader = null
        projection?.let {
            it.unregisterCallback(callback)
            it.stop()
        }
        projection = null
        onStopped = null
        thread.quitSafely()
    }
}
