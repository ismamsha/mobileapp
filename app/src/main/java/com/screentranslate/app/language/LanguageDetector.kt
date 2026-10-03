package com.screentranslate.app.language

import com.google.mlkit.nl.languageid.LanguageIdentification
import com.google.mlkit.nl.languageid.LanguageIdentificationOptions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.screentranslate.app.util.Logx
import com.screentranslate.app.util.ScriptDetector
import kotlinx.coroutines.tasks.await
import java.io.Closeable

/** On-device language identification (ML Kit) with a script-based fallback. */
class LanguageDetector : Closeable {

    private val identifier = LanguageIdentification.getClient(
        LanguageIdentificationOptions.Builder().setConfidenceThreshold(0.2f).build()
    )

    /** Returns an ML Kit language tag, or null if the text has no letters / unknown script. */
    suspend fun detect(text: String): String? {
        val script = ScriptDetector.dominant(text)
        val candidates = try {
            identifier.identifyPossibleLanguages(text).await().map { it.languageTag to it.confidence }
        } catch (e: Exception) {
            Logx.w("Language identification failed", e)
            emptyList()
        }
        return LanguageDecision.decide(script, text.length, candidates, ::isTranslatable)
    }

    override fun close() = identifier.close()

    companion object {
        fun isTranslatable(tag: String): Boolean = TranslateLanguage.fromLanguageTag(tag) != null
    }
}
