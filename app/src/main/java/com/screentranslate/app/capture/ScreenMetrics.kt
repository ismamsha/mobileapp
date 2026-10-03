package com.screentranslate.app.capture

import android.content.Context
import android.os.Build
import android.util.DisplayMetrics
import android.view.WindowManager

/** Full physical screen size (including status/navigation bars) in the current rotation. */
data class ScreenMetrics(val width: Int, val height: Int, val densityDpi: Int) {
    companion object {
        fun current(context: Context): ScreenMetrics {
            val wm = context.getSystemService(WindowManager::class.java)
            val dpi = context.resources.configuration.densityDpi
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val b = wm.maximumWindowMetrics.bounds
                ScreenMetrics(b.width(), b.height(), dpi)
            } else {
                val dm = DisplayMetrics()
                @Suppress("DEPRECATION")
                wm.defaultDisplay.getRealMetrics(dm)
                ScreenMetrics(dm.widthPixels, dm.heightPixels, dm.densityDpi)
            }
        }
    }
}
