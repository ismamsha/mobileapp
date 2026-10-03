package com.screentranslate.app.ocr

import com.screentranslate.app.util.Script
import com.screentranslate.app.util.ScriptDetector

/**
 * Combines ML Kit (best for Latin) and Tesseract (Cyrillic/Arabic) results:
 * - Cyrillic/Arabic lines from Tesseract replace the overlapping ML Kit lines
 *   (ML Kit's Latin model turns Cyrillic into look-alike Latin garbage).
 * - Latin text is taken from ML Kit; Tesseract Latin lines are only kept where ML Kit found nothing.
 */
object OcrMerger {

    const val MIN_TESSERACT_CONFIDENCE = 0.45f
    const val MIN_TESSERACT_LATIN_CONFIDENCE = 0.65f
    private const val OVERLAP = 0.3f

    fun merge(mlKit: List<OcrLine>, tesseract: List<OcrLine>): List<OcrLine> {
        val cleanTess = tesseract.filter { isPlausible(it) }
        val nonLatinTess = cleanTess.filter {
            (it.script == Script.CYRILLIC || it.script == Script.ARABIC) &&
                (it.confidence ?: 1f) >= MIN_TESSERACT_CONFIDENCE
        }
        val keptMl = mlKit.filter { ml -> nonLatinTess.none { it.box.overlapRatio(ml.box) >= OVERLAP } }
        val extraLatinTess = cleanTess.filter { t ->
            t.script == Script.LATIN &&
                (t.confidence ?: 0f) >= MIN_TESSERACT_LATIN_CONFIDENCE &&
                mlKit.none { it.box.overlapRatio(t.box) >= OVERLAP } &&
                nonLatinTess.none { it.box.overlapRatio(t.box) >= OVERLAP }
        }
        return keptMl + nonLatinTess + extraLatinTess
    }

    /** Drops Tesseract noise produced by icons, images and separators. */
    fun isPlausible(line: OcrLine): Boolean {
        val text = line.text.trim()
        val letters = ScriptDetector.count(text).letters
        if (letters < 2) return false
        if (ScriptDetector.letterRatio(text) < 0.4f) return false
        // Very low-confidence short strings are almost always noise.
        if ((line.confidence ?: 1f) < 0.6f && letters < 4) return false
        return true
    }
}
