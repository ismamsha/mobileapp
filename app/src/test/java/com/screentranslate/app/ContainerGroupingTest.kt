package com.screentranslate.app

import com.screentranslate.app.ocr.Box
import com.screentranslate.app.ocr.ContainerDetector
import com.screentranslate.app.ocr.OcrLine
import com.screentranslate.app.ocr.PixelSource
import com.screentranslate.app.ocr.TextBlockGrouper
import com.screentranslate.app.util.Script
import org.junit.Assert.assertEquals
import org.junit.Test

class ContainerGroupingTest {

    private class Canvas(override val width: Int, override val height: Int, bg: Int) : PixelSource {
        val px = IntArray(width * height) { bg }
        fun fill(b: Box, c: Int) {
            for (y in b.top until b.bottom) for (x in b.left until b.right) px[y * width + x] = c
        }
        /** Fake glyphs: vertical strokes across the line box. */
        fun text(b: Box) {
            var x = b.left
            while (x < b.right) {
                fill(Box(x, b.top, minOf(x + 6, b.right), b.bottom), INK)
                x += 14
            }
        }
        override fun pixel(x: Int, y: Int) = px[y * width + x]
    }

    private fun line(c: Canvas, text: String, l: Int, t: Int, r: Int, b: Int): OcrLine {
        val box = Box(l, t, r, b)
        c.text(box)
        return OcrLine(text, box, 0.9f, Script.CYRILLIC)
    }

    private fun group(c: Canvas, lines: List<OcrLine>) =
        ContainerDetector(c).let { d -> TextBlockGrouper.group(lines, container = d::classify) }

    @Test fun sentencesInsideOneBubbleAreOneParagraph() {
        val c = Canvas(1080, 1400, BEIGE)
        c.fill(Box(120, 200, 900, 560), WHITE)
        val lines = listOf(
            line(c, "Хочу оставить отзыв о занятии.", 150, 230, 860, 264),
            line(c, "Я в полном восторге! Урок", 150, 290, 700, 324),
            line(c, "пролетел совершенно незаметно.", 150, 350, 840, 384),
            line(c, "Всем рекомендую.", 150, 410, 520, 444),
        )
        assertEquals(1, group(c, lines).size)
    }

    @Test fun twoBubblesStaySeparate() {
        val c = Canvas(1080, 1400, BEIGE)
        c.fill(Box(120, 200, 900, 300), WHITE)
        c.fill(Box(120, 312, 900, 412), WHITE)
        val lines = listOf(
            line(c, "Привет, как у тебя дела сегодня", 150, 230, 860, 264),
            line(c, "Нормально, спасибо что спросил", 150, 342, 840, 376),
        )
        assertEquals(2, group(c, lines).size)
    }

    @Test fun plainPageSentencesAreSeparate() {
        val c = Canvas(1080, 1400, WHITE)
        val lines = listOf(
            line(c, "Сегодня в Москве будет солнечно.", 40, 230, 1000, 264),
            line(c, "Температура поднимется до двадцати", 40, 290, 980, 324),
            line(c, "градусов к вечеру.", 40, 350, 500, 384),
        )
        val groups = group(c, lines)
        assertEquals(2, groups.size)
        assertEquals("Температура поднимется до двадцати градусов к вечеру.", groups[1].text)
    }

    @Test fun colouredCardIsABox() {
        val c = Canvas(1080, 1400, WHITE)
        c.fill(Box(30, 200, 1050, 460), LIGHT_BLUE)
        val lines = listOf(
            line(c, "Внимание! Сервис будет недоступен.", 60, 230, 1000, 264),
            line(c, "Приносим извинения за неудобства.", 60, 290, 980, 324),
        )
        assertEquals(1, group(c, lines).size)
    }

    private companion object {
        const val BEIGE = 0xFFEFE7DE.toInt()
        const val WHITE = 0xFFFFFFFF.toInt()
        const val LIGHT_BLUE = 0xFFDCEBFF.toInt()
        const val INK = 0xFF111111.toInt()
    }
}
