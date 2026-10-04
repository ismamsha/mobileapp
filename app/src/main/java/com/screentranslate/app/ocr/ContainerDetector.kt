package com.screentranslate.app.ocr

import android.graphics.Bitmap
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/** Read-only pixel access, so the detector is JVM-testable without android.graphics. */
interface PixelSource {
    val width: Int
    val height: Int
    /** ARGB color at (x, y); callers keep coordinates in range. */
    fun pixel(x: Int, y: Int): Int
}

class BitmapPixels(private val bitmap: Bitmap) : PixelSource {
    override val width: Int get() = bitmap.width
    override val height: Int get() = bitmap.height
    override fun pixel(x: Int, y: Int): Int = bitmap.getPixel(x, y)
}

/** How two vertically neighbouring lines sit relative to the screen's boxes (chat bubbles, cards). */
enum class Container {
    /** Both lines are inside the same box: one message, one paragraph. */
    SAME_BOX,
    /** Both lines are on the plain page background: separate sentences stay separate. */
    PLAIN,
    /** Something else lies between them (another box's border, an image, a separator). */
    DIFFERENT,
}

/**
 * Looks at the pixels around text lines to tell whether they share a box. A box is an area filled
 * with one color that differs from the page background, or that has visible edges on both sides
 * (e.g. a white WhatsApp bubble on a patterned wallpaper).
 */
class ContainerDetector(private val px: PixelSource) {

    /** Most common color of the screen, from a coarse grid. */
    private val pageColor: Int by lazy {
        val samples = ArrayList<Int>(36 * 64)
        val stepX = max(1, px.width / 36)
        val stepY = max(1, px.height / 64)
        var y = stepY / 2
        while (y < px.height) {
            var x = stepX / 2
            while (x < px.width) {
                samples += px.pixel(x, y)
                x += stepX
            }
            y += stepY
        }
        dominantColor(samples) ?: 0
    }

    /** [upper] is the line above [lower]. */
    fun classify(upper: Box, lower: Box): Container {
        val left = max(upper.left, lower.left)
        val right = min(upper.right, lower.right)
        if (right - left < 8) return Container.DIFFERENT
        val lineH = max(4, min(upper.height, lower.height))

        // The band between the two lines must be one plain color.
        val y0 = upper.bottom + 2
        val y1 = lower.top - 2
        val fill: Int = if (y1 > y0) {
            plainColor(left, y0, right, y1) ?: return Container.DIFFERENT
        } else {
            // Lines touch: use the margin just left of the text instead.
            plainColor(max(0, left - lineH / 2), upper.top, max(1, left - 1), lower.bottom) ?: return Container.DIFFERENT
        }

        // The margin beside the text (left of the lines) must have the same fill: inside one box.
        val mx0 = (min(upper.left, lower.left) - lineH / 2).coerceAtLeast(0)
        val mx1 = (min(upper.left, lower.left) - 2).coerceAtLeast(mx0 + 1)
        val side = plainColor(mx0, upper.top, mx1, lower.bottom)
        if (side != null && !similar(side, fill)) return Container.DIFFERENT

        return if (isBox(fill, upper, lower)) Container.SAME_BOX else Container.PLAIN
    }

    private fun isBox(fill: Int, upper: Box, lower: Box): Boolean {
        if (!similar(fill, pageColor, 20)) return true
        // Same color as the page: still a box if it has edges on both sides (bubble on a pattern).
        val y = ((upper.bottom + lower.top) / 2).coerceIn(0, px.height - 1)
        val border = max(4, px.width / 40)
        val leftEdge = findEdge(fill, min(upper.left, lower.left), y, -1)
        val rightEdge = findEdge(fill, max(upper.right, lower.right), y, +1)
        return leftEdge != null && rightEdge != null &&
            leftEdge > border && rightEdge < px.width - border
    }

    /** First x moving from [startX] in [dir] where the color stops being [fill], or null at the screen edge. */
    private fun findEdge(fill: Int, startX: Int, y: Int, dir: Int): Int? {
        var x = startX.coerceIn(0, px.width - 1)
        var misses = 0
        while (x in 0 until px.width) {
            if (!similar(px.pixel(x, y), fill, 14)) {
                // Require a few different pixels in a row: ignores a stray glyph pixel.
                if (++misses >= 3) return x
            } else {
                misses = 0
            }
            x += dir
        }
        return null
    }

    /** The color filling the rectangle if at least 90% of sampled pixels match it, else null. */
    private fun plainColor(l: Int, t: Int, r: Int, b: Int): Int? {
        val x0 = l.coerceIn(0, px.width - 1)
        val x1 = r.coerceIn(x0 + 1, px.width)
        val y0 = t.coerceIn(0, px.height - 1)
        val y1 = b.coerceIn(y0 + 1, px.height)
        val samples = ArrayList<Int>(96)
        val stepX = max(1, (x1 - x0) / 16)
        val stepY = max(1, (y1 - y0) / 6)
        var y = y0
        while (y < y1) {
            var x = x0
            while (x < x1) {
                samples += px.pixel(x, y)
                x += stepX
            }
            y += stepY
        }
        val dominant = dominantColor(samples) ?: return null
        val matching = samples.count { similar(it, dominant) }
        return if (matching >= samples.size * 0.9f) dominant else null
    }

    companion object {
        /**
         * Average of the most common color bucket. Averaging the real pixels (not the bucket) keeps
         * close colors apart, like a white bubble on WhatsApp's light beige wallpaper.
         */
        internal fun dominantColor(samples: List<Int>): Int? {
            if (samples.isEmpty()) return null
            val buckets = samples.groupBy { quantize(it) }
            val top = buckets.maxByOrNull { it.value.size }!!.value
            val r = top.sumOf { (it shr 16) and 0xFF } / top.size
            val g = top.sumOf { (it shr 8) and 0xFF } / top.size
            val b = top.sumOf { it and 0xFF } / top.size
            return (0xFF shl 24) or (r shl 16) or (g shl 8) or b
        }

        private fun quantize(c: Int): Int =
            (((c shr 16) and 0xF0) shl 16) or (((c shr 8) and 0xF0) shl 8) or (c and 0xF0) or (0xFF shl 24)

        fun similar(a: Int, b: Int, tolerance: Int = 28): Boolean =
            abs(((a shr 16) and 0xFF) - ((b shr 16) and 0xFF)) +
                abs(((a shr 8) and 0xFF) - ((b shr 8) and 0xFF)) +
                abs((a and 0xFF) - (b and 0xFF)) <= tolerance * 2
    }
}
