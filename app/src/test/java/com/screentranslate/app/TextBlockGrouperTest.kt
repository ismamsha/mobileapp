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

    /** Chat bubble like the user's WhatsApp screenshot: uneven glyph heights, sentence ends mid-paragraph. */
    @Test fun chatParagraphWithSentenceEndsStaysOneBlock() {
        val c = Script.CYRILLIC
        val texts = listOf(
            "Ассаламу Алейкум!" to 34, "оставить отзыв о пробном" to 26, "занятии с устазой Валой." to 34,
            "Я в полном восторге! Урок" to 34, "пролетел совершенно" to 26, "незаметно. У устазы очень" to 34,
            "приятная манера общения, и" to 34, "она объясняет весь материал" to 34, "максимально доходчиво." to 34,
            "Всем, кто искренне желает" to 34,
        )
        val lines = texts.mapIndexed { i, (t, h) ->
            val top = 230 + i * 48 + (34 - h)
            line(t, 135, top, 135 + t.length * 19, top + h, c)
        } + line("Хочу", 530, 230, 610, 264, c) // after an emoji gap on the first row
        val groups = TextBlockGrouper.group(lines)
        assertEquals(1, groups.size)
        assert(groups[0].text.startsWith("Ассаламу Алейкум! Хочу оставить"))
    }

    @Test fun separateMessagesStaySeparate() {
        val c = Script.CYRILLIC
        val lines = listOf(
            line("Привет! Как у тебя дела сегодня?", 40, 100, 900, 134, c),
            line("Всё хорошо, спасибо большое.", 40, 200, 860, 234, c),
        )
        assertEquals(2, TextBlockGrouper.group(lines).size)
    }

    /** Lower-case-only Cyrillic lines have short boxes; they must not break the paragraph. */
    @Test fun shortLowercaseLinesStayInParagraph() {
        val c = Script.CYRILLIC
        // (text, glyph top offset within the 34 px line, glyph height)
        val rows = listOf(
            Triple("каждый языковой нюанс.", 0, 34), Triple("До этого я пробовала", 0, 34),
            Triple("заниматься с другими", 6, 28), Triple("учителями и могу с", 10, 20),
            Triple("уверенностью сказать: разница", 10, 24), Triple("огромнейшая. Если вы еще", 0, 34),
        )
        val lines = rows.mapIndexed { i, (t, off, h) ->
            val top = 100 + i * 48 + off
            line(t, 135, top, 135 + t.length * 19, top + h, c)
        }
        assertEquals(1, TextBlockGrouper.group(lines).size)
    }

    @Test fun bigTitleStaysApartFromBody() {
        val lines = listOf(
            line("Weather report for today", 40, 100, 700, 160),
            line("The weather will be sunny with light wind and", 40, 176, 1000, 210),
            line("temperatures rising to twenty degrees.", 40, 224, 900, 258),
        )
        assertEquals(2, TextBlockGrouper.group(lines).size)
    }
}
