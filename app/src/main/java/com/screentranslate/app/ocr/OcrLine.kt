package com.screentranslate.app.ocr

import com.screentranslate.app.util.Script
import kotlin.math.max
import kotlin.math.min

/** Integer rectangle independent of android.graphics so grouping logic is JVM-testable. */
data class Box(val left: Int, val top: Int, val right: Int, val bottom: Int) {
    val width: Int get() = right - left
    val height: Int get() = bottom - top
    val area: Long get() = width.toLong().coerceAtLeast(0) * height.toLong().coerceAtLeast(0)

    fun union(o: Box) = Box(min(left, o.left), min(top, o.top), max(right, o.right), max(bottom, o.bottom))

    fun horizontalOverlap(o: Box): Int = (min(right, o.right) - max(left, o.left)).coerceAtLeast(0)
    fun verticalOverlap(o: Box): Int = (min(bottom, o.bottom) - max(top, o.top)).coerceAtLeast(0)

    fun intersectionArea(o: Box): Long = horizontalOverlap(o).toLong() * verticalOverlap(o).toLong()

    /** Intersection divided by the smaller box's area. */
    fun overlapRatio(o: Box): Float {
        val smaller = min(area, o.area)
        if (smaller <= 0) return 0f
        return intersectionArea(o).toFloat() / smaller
    }

    fun scaled(factor: Float): Box =
        if (factor == 1f) this
        else Box((left * factor).toInt(), (top * factor).toInt(), (right * factor).toInt(), (bottom * factor).toInt())
}

/** A single recognized text line straight from an OCR engine. */
data class OcrLine(
    val text: String,
    val box: Box,
    /** 0..1, null if the engine does not report one. */
    val confidence: Float?,
    val script: Script,
    /** Engine-specific block id (ML Kit text block), -1 if unknown. */
    val group: Int = -1,
    /** Language the engine itself guessed, if any. */
    val languageHint: String? = null,
)

/** Lines grouped into one translatable block. */
data class LineGroup(val lines: List<OcrLine>) {
    val box: Box get() = lines.map { it.box }.reduce { a, b -> a.union(b) }
    val script: Script get() = lines.first().script
    val confidence: Float?
        get() = lines.mapNotNull { it.confidence }.takeIf { it.isNotEmpty() }?.average()?.toFloat()

    val text: String
        get() = buildString {
            for (line in lines) {
                val t = line.text.trim()
                if (isEmpty()) {
                    append(t)
                } else if (endsWith("-") && t.firstOrNull()?.isLowerCase() == true) {
                    // Word hyphenated across a line break.
                    deleteCharAt(length - 1)
                    append(t)
                } else {
                    append(' ').append(t)
                }
            }
        }
}
