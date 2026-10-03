package com.screentranslate.app

import com.screentranslate.app.ocr.Box
import com.screentranslate.app.ocr.OcrLine
import com.screentranslate.app.ocr.TextBlockGrouper
import com.screentranslate.app.util.Script
import org.junit.Assert.assertEquals
import org.junit.Test

class TextBlockGrouperTest {
    private fun line(text: String, l: Int, t: Int, r: Int, b: Int, s: Script = Script.LATIN) =
        OcrLine(text, Box(l, t, r, b), 0.9f, s)

    @Test fun wrappedParagraphBecomesOneBlock() {
        val lines = listOf(
            line("The quick brown fox jumps over", 40, 100, 1000, 140),
            line("the lazy dog near the river bank", 40, 148, 980, 188),
            line("and runs away.", 40, 196, 420, 236),
        )
        val groups = TextBlockGrouper.group(lines)
        assertEquals(1, groups.size)
        assertEquals("The quick brown fox jumps over the lazy dog near the river bank and runs away.", groups[0].text)
    }

    @Test fun menuItemsStaySeparate() {
        val lines = listOf(
            line("Wi-Fi", 120, 300, 260, 340),
            line("Bluetooth", 120, 420, 380, 460),
            line("Notifications", 120, 540, 480, 580),
        )
        assertEquals(3, TextBlockGrouper.group(lines).size)
    }

    @Test fun differentScriptsStaySeparate() {
        val lines = listOf(
            line("Привет мир, это длинная строка", 40, 100, 1000, 140, Script.CYRILLIC),
            line("Hello world this is english", 40, 148, 980, 188, Script.LATIN),
        )
        assertEquals(2, TextBlockGrouper.group(lines).size)
    }

    @Test fun sameRowFragmentsAreJoined() {
        val lines = listOf(
            line("Hello", 40, 100, 200, 140),
            line("world", 220, 102, 380, 141),
        )
        val groups = TextBlockGrouper.group(lines)
        assertEquals(1, groups.size)
        assertEquals("Hello world", groups[0].text)
    }

    @Test fun arabicFragmentsJoinRightToLeft() {
        val lines = listOf(
            line("بالعالم", 40, 100, 200, 140, Script.ARABIC),
            line("مرحبا", 220, 100, 380, 140, Script.ARABIC),
        )
        assertEquals("مرحبا بالعالم", TextBlockGrouper.group(lines)[0].text)
    }

    @Test fun titleAndBodyStaySeparate() {
        val lines = listOf(
            line("News", 40, 100, 200, 160),
            line("Long body text that spans the full width of the screen", 40, 168, 1000, 200),
        )
        assertEquals(2, TextBlockGrouper.group(lines).size)
    }
}
