package com.screentranslate.app.overlay

import android.graphics.Rect
import android.graphics.RectF
import android.text.Layout
import android.text.StaticLayout
import android.text.TextDirectionHeuristics
import android.text.TextPaint
import com.screentranslate.app.settings.FontSizeMode
import kotlin.math.max
import kotlin.math.min

/** A translated block laid out and ready to draw at screen coordinates. */
class RenderBlock(
    val background: RectF,
    val layout: StaticLayout,
    val textLeft: Float,
    val textTop: Float,
    val backgroundColor: Int,
    val isCard: Boolean,
)

/**
 * Chooses font size and wrapping so the translation fits (approximately) over the original
 * text; Arabic is laid out RTL and right-aligned, Russian/English LTR.
 */
class BlockLayoutCalculator(private val density: Float, private val scaledDensity: Float) {

    private val padH = 3f * density
    private val padV = 1.5f * density
    private val minTextPx = 9f * scaledDensity
    private val maxTextPx = 30f * scaledDensity

    fun layout(
        text: String,
        original: Rect,
        lineCount: Int,
        rtl: Boolean,
        fontMode: FontSizeMode,
        paintTemplate: TextPaint,
        textColor: Int,
        screenWidth: Int,
        screenHeight: Int,
    ): Pair<StaticLayout, RectF> {
        val paint = TextPaint(paintTemplate).apply { color = textColor }
        val margin = 4f * density

        // Allow widening so a single long word is not broken mid-word.
        fun widthFor(sizePx: Float): Int {
            paint.textSize = sizePx
            val longestWord = text.split(' ').maxOfOrNull { paint.measureText(it) } ?: 0f
            val wanted = max(original.width().toFloat(), longestWord + 2 * padH)
            return min(wanted, screenWidth - 2 * margin).toInt().coerceAtLeast(1)
        }

        fun build(sizePx: Float): StaticLayout {
            val w = widthFor(sizePx)
            paint.textSize = sizePx
            val inner = (w - 2 * padH).toInt().coerceAtLeast(1)
            return StaticLayout.Builder.obtain(text, 0, text.length, paint, inner)
                .setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setTextDirection(if (rtl) TextDirectionHeuristics.RTL else TextDirectionHeuristics.LTR)
                .setIncludePad(false)
                .setLineSpacing(0f, 1f)
                .build()
        }

        val boxHeight = original.height().toFloat()
        val layout: StaticLayout = when (val fixed = fontMode.sp) {
            null -> {
                // Start from the original line height, shrink until it fits.
                val lineH = boxHeight / lineCount.coerceAtLeast(1)
                var size = (lineH * 0.78f).coerceIn(minTextPx, maxTextPx)
                var l = build(size)
                while (size > minTextPx && l.height > boxHeight * 1.1f) {
                    size = max(minTextPx, size - max(0.5f * scaledDensity, size * 0.08f))
                    l = build(size)
                }
                l
            }
            else -> build(fixed * scaledDensity)
        }

        // The OCR box hugs the glyphs; grow it so ascenders/descenders of the original are covered.
        val growX = 5f * density
        val growY = 2f * density
        val origW = original.width() + 2 * growX
        val w = layout.width + 2 * padH
        val h = max(boxHeight + 2 * growY, layout.height + 2 * padV)
        var left = if (rtl) original.right + growX - max(w, origW) else original.left - growX
        var right = left + max(w, origW)
        if (right > screenWidth - margin) {
            left -= right - (screenWidth - margin); right = screenWidth - margin
        }
        if (left < margin && original.left >= margin) {
            right += margin - left; left = margin
        }
        var top = original.top - growY
        if (top + h > screenHeight) top = max(0f, screenHeight - h)
        return layout to RectF(left, top, right, top + h)
    }
}
