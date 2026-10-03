package com.screentranslate.app

import com.screentranslate.app.language.LanguageDecision
import com.screentranslate.app.util.Script
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class LanguageDecisionTest {
    private val any: (String) -> Boolean = { true }

    @Test fun cyrillicDefaultsToRussian() =
        assertEquals("ru", LanguageDecision.decide(Script.CYRILLIC, 5, emptyList(), any))

    @Test fun cyrillicAcceptsConfidentUkrainian() =
        assertEquals("uk", LanguageDecision.decide(Script.CYRILLIC, 40, listOf("uk" to 0.9f), any))

    @Test fun arabicScriptIsArabic() =
        assertEquals("ar", LanguageDecision.decide(Script.ARABIC, 20, listOf("en" to 0.9f), any))

    @Test fun shortLatinFallsBackToEnglish() =
        assertEquals("en", LanguageDecision.decide(Script.LATIN, 4, listOf("fr" to 0.9f), any))

    @Test fun longLatinUsesIdentifiedLanguage() =
        assertEquals("fr", LanguageDecision.decide(Script.LATIN, 50, listOf("fr" to 0.8f, "en" to 0.1f), any))

    @Test fun lowConfidenceLatinIsEnglish() =
        assertEquals("en", LanguageDecision.decide(Script.LATIN, 50, listOf("fr" to 0.3f), any))

    @Test fun noLettersIsNull() =
        assertNull(LanguageDecision.decide(Script.NONE, 5, emptyList(), any))
}
