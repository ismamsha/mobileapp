package com.screentranslate.app.capture

import android.content.Context
import android.hardware.display.DisplayManager
import android.util.DisplayMetrics
import android.view.Display

/** Full physical screen size (including status/navigation bars) in the current rotation. */
data class ScreenMetrics(val width: Int, val height: Int, val densityDpi: Int) {
    companion object {
        /**
         * Read from the Display itself: it is already updated when DisplayListener.onDisplayChanged
         * fires, while window/context metrics can still report the previous rotation.
         */
        fun current(context: Context): ScreenMetrics {
            val display = context.getSystemService(DisplayManager::class.java).getDisplay(Display.DEFAULT_DISPLAY)
            val dm = DisplayMetrics()
            @Suppress("DEPRECATION")
            display.getRealMetrics(dm)
            return ScreenMetrics(dm.widthPixels, dm.heightPixels, dm.densityDpi)
        }
    }
}
