package com.screentranslate.app.language

import com.screentranslate.app.util.Script

/**
 * Pure decision logic combining the script of a text with ML Kit language-ID candidates.
 * Script evidence wins for short or low-confidence texts.
 */
object LanguageDecision {

    const val MIN_CONFIDENCE = 0.5f
    private const val MIN_LENGTH_FOR_ID = 12

    private val cyrillicLanguages = setOf("ru", "uk", "be", "bg", "mk", "sr")
    private val arabicScriptLanguages = setOf("ar", "fa", "ur")

    fun decide(
        script: Script,
        textLength: Int,
        candidates: List<Pair<String, Float>>,
        isTranslatable: (String) -> Boolean,
    ): String? {
        val best = candidates
            .filter { it.first != "und" && it.second >= MIN_CONFIDENCE && isTranslatable(it.first) }
            .maxByOrNull { it.second }
        val longEnough = textLength >= MIN_LENGTH_FOR_ID
        return when (script) {
            Script.NONE -> null
            Script.CYRILLIC ->
                best?.first?.takeIf { longEnough && it in cyrillicLanguages && best.second >= 0.7f } ?: "ru"
            Script.ARABIC ->
                best?.first?.takeIf { longEnough && it in arabicScriptLanguages && best.second >= 0.7f } ?: "ar"
            // Short or noisy Latin text (often misread Cyrillic) gets odd guesses, so only a
            // confident guess on a longer text beats English.
            Script.LATIN ->
                best?.first?.takeIf {
                    (it == "en" || (textLength >= 20 && best.second >= 0.8f)) &&
                        it !in cyrillicLanguages && it !in arabicScriptLanguages
                } ?: "en"
            Script.OTHER -> best?.first
        }
    }
}
