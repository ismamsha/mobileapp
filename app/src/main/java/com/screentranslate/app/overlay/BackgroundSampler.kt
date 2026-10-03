package com.screentranslate.app.overlay

import android.graphics.Bitmap
import android.graphics.Rect
import com.screentranslate.app.model.BlockStyle
import com.screentranslate.app.util.ColorAnalyzer

/** Samples the screenshot just outside a text block to pick a matching background color. */
object BackgroundSampler {

    fun sample(bitmap: Bitmap, box: Rect): BlockStyle {
        val w = bitmap.width
        val h = bitmap.height
        val pixels = ArrayList<Int>(160)
        for (ring in intArrayOf(2, 5)) {
            val l = (box.left - ring).coerceIn(0, w - 1)
            val r = (box.right + ring).coerceIn(0, w - 1)
            val t = (box.top - ring).coerceIn(0, h - 1)
            val b = (box.bottom + ring).coerceIn(0, h - 1)
            val stepX = ((r - l) / 24).coerceAtLeast(1)
            val stepY = ((b - t) / 8).coerceAtLeast(1)
            var x = l
            while (x <= r) {
                pixels += bitmap.getPixel(x, t)
                pixels += bitmap.getPixel(x, b)
                x += stepX
            }
            var y = t
            while (y <= b) {
                pixels += bitmap.getPixel(l, y)
                pixels += bitmap.getPixel(r, y)
                y += stepY
            }
        }
        return ColorAnalyzer.analyze(pixels.toIntArray())
    }
}
