package com.screentranslate.app

import com.screentranslate.app.util.Script
import com.screentranslate.app.util.ScriptDetector
import org.junit.Assert.assertEquals
import org.junit.Test

class ScriptDetectorTest {
    @Test fun detectsCyrillic() = assertEquals(Script.CYRILLIC, ScriptDetector.dominant("Привет, как дела?"))
    @Test fun detectsArabic() = assertEquals(Script.ARABIC, ScriptDetector.dominant("مرحبا بالعالم"))
    @Test fun detectsLatin() = assertEquals(Script.LATIN, ScriptDetector.dominant("Hello world"))
    @Test fun numbersHaveNoScript() = assertEquals(Script.NONE, ScriptDetector.dominant("12:45 100%"))
    @Test fun mixedUsesMajority() = assertEquals(Script.CYRILLIC, ScriptDetector.dominant("Скачать PDF файл сейчас"))
    @Test fun defaultLanguages() {
        assertEquals("ru", ScriptDetector.defaultLanguage(Script.CYRILLIC))
        assertEquals("ar", ScriptDetector.defaultLanguage(Script.ARABIC))
        assertEquals("en", ScriptDetector.defaultLanguage(Script.LATIN))
    }
}
