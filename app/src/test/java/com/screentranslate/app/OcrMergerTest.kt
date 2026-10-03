package com.screentranslate.app

import com.screentranslate.app.ocr.Box
import com.screentranslate.app.ocr.OcrLine
import com.screentranslate.app.ocr.OcrMerger
import com.screentranslate.app.util.Script
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class OcrMergerTest {
    @Test fun cyrillicFromTesseractReplacesGarbledMlKitLine() {
        val ml = listOf(OcrLine("Npnbet mnp", Box(10, 10, 300, 50), 0.4f, Script.LATIN))
        val tess = listOf(OcrLine("Привет мир", Box(12, 12, 298, 49), 0.88f, Script.CYRILLIC))
        val merged = OcrMerger.merge(ml, tess)
        assertEquals(1, merged.size)
        assertEquals("Привет мир", merged[0].text)
    }

    @Test fun latinPrefersMlKit() {
        val ml = listOf(OcrLine("Hello world", Box(10, 10, 300, 50), 0.95f, Script.LATIN))
        val tess = listOf(OcrLine("Hel1o world", Box(10, 10, 300, 50), 0.9f, Script.LATIN))
        val merged = OcrMerger.merge(ml, tess)
        assertEquals(listOf("Hello world"), merged.map { it.text })
    }

    @Test fun noiseIsDropped() {
        assertTrue(!OcrMerger.isPlausible(OcrLine("|| --", Box(0, 0, 10, 10), 0.3f, Script.NONE)))
        assertTrue(!OcrMerger.isPlausible(OcrLine("Ж", Box(0, 0, 10, 10), 0.9f, Script.CYRILLIC)))
        assertTrue(OcrMerger.isPlausible(OcrLine("Настройки", Box(0, 0, 10, 10), 0.9f, Script.CYRILLIC)))
    }

    @Test fun separateRegionsAreAllKept() {
        val ml = listOf(OcrLine("Settings", Box(10, 10, 300, 50), 0.95f, Script.LATIN))
        val tess = listOf(OcrLine("Настройки", Box(10, 200, 300, 240), 0.9f, Script.CYRILLIC))
        assertEquals(2, OcrMerger.merge(ml, tess).size)
    }
}
