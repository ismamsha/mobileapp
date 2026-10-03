package com.screentranslate.app.util

import com.screentranslate.app.model.BlockStyle
import kotlin.math.pow
import kotlin.math.sqrt

/**
 * Picks an overlay background and text color from pixels sampled around a text block.
 * Pure Kotlin (ARGB ints), so it is unit tested on the JVM.
 */
object ColorAnalyzer {

    private const val CARD_COLOR = 0xFF202124.toInt()
    private const val WHITE = 0xFFFFFFFF.toInt()
    private const val BLACK = 0xFF000000.toInt()

    fun analyze(pixels: IntArray): BlockStyle {
        if (pixels.isEmpty()) return BlockStyle(CARD_COLOR, WHITE, sampledReliably = false)
        val r = IntArray(pixels.size) { (pixels[it] shr 16) and 0xFF }
        val g = IntArray(pixels.size) { (pixels[it] shr 8) and 0xFF }
        val b = IntArray(pixels.size) { pixels[it] and 0xFF }
        val mr = median(r)
        val mg = median(g)
        val mb = median(b)
        // Share of samples close to the median color: low share = busy background (photo, gradient).
        var close = 0
        for (i in pixels.indices) {
            val d = sqrt(((r[i] - mr) * (r[i] - mr) + (g[i] - mg) * (g[i] - mg) + (b[i] - mb) * (b[i] - mb)).toDouble())
            if (d < 40.0) close++
        }
        val reliable = close >= pixels.size * 0.6
        val bg = if (reliable) (0xFF shl 24) or (mr shl 16) or (mg shl 8) or mb else CARD_COLOR
        return BlockStyle(bg, bestTextColor(bg), reliable)
    }

    fun bestTextColor(background: Int): Int {
        val l = relativeLuminance(background)
        val contrastWhite = 1.05 / (l + 0.05)
        val contrastBlack = (l + 0.05) / 0.05
        return if (contrastWhite >= contrastBlack) WHITE else BLACK
    }

    fun relativeLuminance(color: Int): Double {
        fun channel(c: Int): Double {
            val s = c / 255.0
            return if (s <= 0.03928) s / 12.92 else ((s + 0.055) / 1.055).pow(2.4)
        }
        return 0.2126 * channel((color shr 16) and 0xFF) +
            0.7152 * channel((color shr 8) and 0xFF) +
            0.0722 * channel(color and 0xFF)
    }

    fun withAlpha(color: Int, alpha: Float): Int {
        val a = (alpha.coerceIn(0f, 1f) * 255).toInt()
        return (a shl 24) or (color and 0x00FFFFFF)
    }

    private fun median(values: IntArray): Int {
        val sorted = values.copyOf().also { it.sort() }
        return sorted[sorted.size / 2]
    }
}
