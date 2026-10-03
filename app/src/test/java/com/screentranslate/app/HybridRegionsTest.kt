package com.screentranslate.app

import com.screentranslate.app.ocr.Box
import com.screentranslate.app.ocr.HybridOcrEngine
import com.screentranslate.app.ocr.OcrLine
import com.screentranslate.app.util.Script
import org.junit.Assert.assertEquals
import org.junit.Test

class HybridRegionsTest {
    @Test fun confidentEnglishNeedsNoTesseract() {
        val lines = listOf(OcrLine("Settings", Box(10, 10, 200, 50), 0.95f, Script.LATIN, group = 0, languageHint = "en"))
        assertEquals(0, HybridOcrEngine.uncertainRegions(lines, 1080, 2400).size)
    }

    @Test fun garbledCyrillicBlockIsReRead() {
        val lines = listOf(
            OcrLine("Npnbet mnp", Box(10, 10, 300, 50), 0.45f, Script.LATIN, group = 1),
            OcrLine("Kak gena", Box(10, 60, 250, 100), 0.5f, Script.LATIN, group = 1),
            OcrLine("Chrome", Box(10, 300, 200, 340), 0.97f, Script.LATIN, group = 2, languageHint = "en"),
        )
        val regions = HybridOcrEngine.uncertainRegions(lines, 1080, 2400)
        assertEquals(1, regions.size)
        val r = regions[0]
        assert(r.top <= 10 && r.bottom >= 100 && r.left == 0)
    }
}
