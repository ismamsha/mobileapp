package com.screentranslate.app.ocr

import android.content.SharedPreferences
import android.graphics.Bitmap
import com.screentranslate.app.model.OcrBlock
import com.screentranslate.app.util.Logx
import com.screentranslate.app.util.Script

/**
 * Default engine, tuned for speed on mid-range phones:
 * 1. ML Kit reads the whole screen (fast, accurate for English) and finds where text is.
 * 2. Tesseract re-reads only the text blocks ML Kit was unsure about (Cyrillic shows up as
 *    low-confidence look-alike Latin), instead of the whole screenshot.
 * 3. Arabic, which ML Kit's Latin detector may miss entirely, gets one downscaled full-screen pass.
 */
class HybridOcrEngine(
    private val mlKit: MlKitOcrEngine,
    private val tesseract: TesseractOcrEngine,
    private val tesseractLanguages: () -> String,
    private val prefs: SharedPreferences,
) : OcrEngine {

    /** Rolling average of ML Kit's time on this phone; on slow devices Tesseract alone is faster. */
    private var mlKitAvgMs = prefs.getLong(KEY_ML_AVG, 0L)
    private var taps = 0

    override suspend fun recognize(bitmap: Bitmap): List<OcrBlock> {
        val start = System.currentTimeMillis()
        val langs = tesseractLanguages()
        taps++
        // Re-measure ML Kit now and then in case the phone was just busy.
        if (langs.isNotEmpty() && mlKitAvgMs > SLOW_ML_KIT_MS && taps % 15 != 0 && tesseract.hasData(langs)) {
            val tessLines = runCatching { tesseract.recognizeFullPage(bitmap, langs) }
                .onFailure { Logx.w("Tesseract OCR failed", it) }.getOrDefault(emptyList())
            val blocks = TextBlockGrouper.group(OcrMerger.merge(emptyList(), tessLines)).map { it.toOcrBlock() }
            Logx.d("OCR (Tesseract only, ML Kit avg ${mlKitAvgMs}ms): tess=${tessLines.size} blocks=${blocks.size} in ${System.currentTimeMillis() - start}ms")
            // Nothing found (e.g. text in the target language's script, which Tesseract isn't
            // loaded for): let ML Kit have a look too.
            if (blocks.isNotEmpty()) return blocks
        }

        val mlLines = runCatching { mlKit.recognizeLines(bitmap) }
            .onFailure { Logx.w("ML Kit OCR failed", it) }.getOrDefault(emptyList())
        val mlTime = System.currentTimeMillis() - start
        // The first call after the app starts includes loading the model, so it doesn't count.
        if (taps > 1) {
            mlKitAvgMs = if (mlKitAvgMs == 0L) mlTime else (mlKitAvgMs * 2 + mlTime) / 3
            prefs.edit().putLong(KEY_ML_AVG, mlKitAvgMs).apply()
        }

        var tessLines = emptyList<OcrLine>()
        if (langs.isNotEmpty()) {
            val t = System.currentTimeMillis()
            tessLines = runCatching {
                if ("ara" in langs) {
                    tesseract.recognizeFullPage(bitmap, langs)
                } else {
                    val regions = uncertainRegions(mlLines, bitmap.width, bitmap.height)
                    if (regions.isEmpty()) emptyList() else tesseract.recognizeRegions(bitmap, regions, langs)
                }
            }.onFailure { Logx.w("Tesseract OCR failed", it) }.getOrDefault(emptyList())
            Logx.d("Tesseract OCR ${System.currentTimeMillis() - t}ms")
        }
        val merged = OcrMerger.merge(mlLines, tessLines)
        val blocks = TextBlockGrouper.group(merged).map { it.toOcrBlock() }
        Logx.d("OCR: ml=${mlLines.size} (${mlTime}ms) tess=${tessLines.size} blocks=${blocks.size} in ${System.currentTimeMillis() - start}ms")
        return blocks
    }

    companion object {
        private const val KEY_ML_AVG = "mlkit_warm_avg_ms"
        private const val SLOW_ML_KIT_MS = 3000L

        /** ML Kit blocks that probably aren't really Latin text, padded a little. */
        fun uncertainRegions(lines: List<OcrLine>, width: Int, height: Int): List<Box> =
            lines.groupBy { it.group }.flatMap { (group, ls) ->
                val uncertain = ls.any { isUncertain(it) }
                if (!uncertain) emptyList()
                else if (group < 0) ls.map { pad(it.box, it.box.height, width, height) }
                else {
                    val box = ls.map { it.box }.reduce { a, b -> a.union(b) }
                    val lineH = ls.map { it.box.height }.average().toInt()
                    listOf(pad(box, lineH, width, height))
                }
            }

        internal fun isUncertain(line: OcrLine): Boolean {
            val conf = line.confidence ?: 0f
            if (line.script != Script.LATIN) return true
            if (conf < 0.8f) return true
            val hint = line.languageHint
            return hint != null && hint != "en" && hint != "und" && hint.isNotEmpty()
        }

        private fun pad(b: Box, lineH: Int, w: Int, h: Int): Box {
            val p = (lineH * 0.35f).toInt().coerceAtLeast(4)
            return Box((b.left - p).coerceAtLeast(0), (b.top - p).coerceAtLeast(0), (b.right + p).coerceAtMost(w), (b.bottom + p).coerceAtMost(h))
        }
    }
}
