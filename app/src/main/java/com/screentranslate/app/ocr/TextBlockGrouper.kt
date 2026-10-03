package com.screentranslate.app.ocr

import com.screentranslate.app.util.Script
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Groups OCR lines into blocks so that wrapped sentences/paragraphs are translated
 * as a whole, while separate UI labels (menu rows, buttons) stay separate.
 */
object TextBlockGrouper {

    fun group(lines: List<OcrLine>, maxLinesPerBlock: Int = 40): List<LineGroup> {
        val rows = mergeSameRow(lines.filter { it.text.isNotBlank() && it.box.width > 0 && it.box.height > 0 })
        val sorted = rows.sortedWith(compareBy<OcrLine> { it.box.top }.thenBy { it.box.left })
        val groups = mutableListOf<MutableList<OcrLine>>()
        for (line in sorted) {
            var best: MutableList<OcrLine>? = null
            var bestGap = Int.MAX_VALUE
            for (g in groups) {
                if (g.size >= maxLinesPerBlock) continue
                val last = g.last()
                if (!continuesParagraph(last, line, g)) continue
                val gap = line.box.top - last.box.bottom
                if (gap < bestGap) {
                    bestGap = gap
                    best = g
                }
            }
            if (best != null) best.add(line) else groups.add(mutableListOf(line))
        }
        return groups.map { LineGroup(it) }
    }

    /** Joins fragments that sit on the same baseline next to each other (engines sometimes split lines). */
    internal fun mergeSameRow(lines: List<OcrLine>): List<OcrLine> {
        val result = mutableListOf<OcrLine>()
        val pending = lines.sortedWith(compareBy<OcrLine> { it.box.top }.thenBy { it.box.left }).toMutableList()
        while (pending.isNotEmpty()) {
            var current = pending.removeAt(0)
            var merged = true
            while (merged) {
                merged = false
                val it = pending.iterator()
                while (it.hasNext()) {
                    val other = it.next()
                    if (sameRow(current, other)) {
                        current = joinRow(current, other)
                        it.remove()
                        merged = true
                    }
                }
            }
            result.add(current)
        }
        return result
    }

    private fun sameRow(a: OcrLine, b: OcrLine): Boolean {
        if (!compatibleScripts(a.script, b.script)) return false
        val minH = min(a.box.height, b.box.height)
        val maxH = max(a.box.height, b.box.height)
        if (maxH > minH * 1.5f) return false
        if (a.box.verticalOverlap(b.box) < minH * 0.7f) return false
        val gap = if (a.box.left <= b.box.left) b.box.left - a.box.right else a.box.left - b.box.right
        // Wide enough for an emoji or icon between words ("Привет! 🌹 Хочу"), but not for separate columns.
        return gap <= maxH * 2.5f
    }

    private fun joinRow(a: OcrLine, b: OcrLine): OcrLine {
        val rtl = a.script == Script.ARABIC || b.script == Script.ARABIC
        // Visual left-to-right order; for RTL text the reading order is right-to-left.
        val (first, second) = if ((a.box.left <= b.box.left) != rtl) a to b else b to a
        val conf = listOfNotNull(a.confidence, b.confidence).takeIf { it.isNotEmpty() }?.average()?.toFloat()
        return OcrLine(
            text = first.text.trim() + " " + second.text.trim(),
            box = a.box.union(b.box),
            confidence = conf,
            script = if (a.script == Script.NONE) b.script else a.script,
        )
    }

    private fun continuesParagraph(last: OcrLine, line: OcrLine, group: List<OcrLine>): Boolean {
        if (!compatibleScripts(last.script, line.script)) return false
        val h1 = last.box.height.toFloat()
        val h2 = line.box.height.toFloat()
        // Glyph boxes vary with ascenders/descenders (Cyrillic lower case is short), so allow some spread.
        if (max(h1, h2) > min(h1, h2) * 1.5f) return false
        val avgH = (h1 + h2) / 2f
        val gap = line.box.top - last.box.bottom
        // Spacing the paragraph has used so far: a wrapped line repeats it, a new item does not.
        val typicalGap = group.zipWithNext { a, b -> b.box.top - a.box.bottom }.sorted().let { g ->
            if (g.isEmpty()) null else g[g.size / 2]
        }
        // Arabic fonts use taller line spacing (dots and marks above/below the letters).
        val maxGap = if (line.script == Script.ARABIC) 0.95f else 0.85f
        val allowed = max(avgH * maxGap, typicalGap?.let { it * 1.25f + 2f } ?: 0f).coerceAtMost(avgH * 1.3f)
        if (gap < -avgH * 0.3f || gap > allowed) return false
        // A short line followed by a much longer one is not a wrapped sentence (e.g. title + body).
        if (group.size == 1 && last.box.width < line.box.width * 0.5f) return false
        // Previous line ended a sentence: inside a paragraph the next line keeps the same spacing;
        // a separate item usually sits further away.
        val end = last.text.trimEnd().lastOrNull()
        if (end != null && end in ".!?:;…") {
            val separate = if (typicalGap != null) gap > typicalGap * 1.3f + 2f else gap > avgH * 0.6f
            if (separate) return false
        }
        val groupBox = group.map { it.box }.reduce { a, b -> a.union(b) }
        val overlap = groupBox.horizontalOverlap(line.box)
        val leftAligned = abs(groupBox.left - line.box.left) <= avgH * 1.2f
        val rightAligned = abs(groupBox.right - line.box.right) <= avgH * 1.2f
        val rtl = line.script == Script.ARABIC
        return overlap >= min(groupBox.width, line.box.width) * 0.6f &&
            (leftAligned || (rtl && rightAligned) || overlap >= line.box.width * 0.9f)
    }

    private fun compatibleScripts(a: Script, b: Script): Boolean =
        a == b || a == Script.NONE || b == Script.NONE
}
