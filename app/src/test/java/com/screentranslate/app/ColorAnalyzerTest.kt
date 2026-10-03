package com.screentranslate.app

import com.screentranslate.app.util.ColorAnalyzer
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ColorAnalyzerTest {
    private val white = 0xFFFFFFFF.toInt()
    private val black = 0xFF000000.toInt()

    @Test fun whiteBackgroundGetsBlackText() {
        val s = ColorAnalyzer.analyze(IntArray(50) { 0xFFFAFAFA.toInt() })
        assertTrue(s.sampledReliably)
        assertEquals(black, s.textColor)
    }

    @Test fun darkBackgroundGetsWhiteText() {
        val s = ColorAnalyzer.analyze(IntArray(50) { 0xFF121212.toInt() })
        assertEquals(0xFF121212.toInt(), s.backgroundColor)
        assertEquals(white, s.textColor)
    }

    @Test fun busyBackgroundFallsBackToCard() {
        val s = ColorAnalyzer.analyze(IntArray(50) { if (it % 2 == 0) white else 0xFFFF0000.toInt() + it * 997 })
        assertFalse(s.sampledReliably)
        assertEquals(white, s.textColor)
    }
}
