package com.screentranslate.app.translation

import com.screentranslate.app.language.LanguageDetector
import com.screentranslate.app.model.BlockStyle
import com.screentranslate.app.model.OcrBlock
import com.screentranslate.app.model.TranslatedBlock
import com.screentranslate.app.util.ScriptDetector
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit

/** Detects the source language of each block, prepares models and translates with an LRU cache. */
class TranslationRepository(
    private val engine: TranslationEngine,
    private val cache: TranslationCache,
    private val detector: LanguageDetector,
) {

    data class Result(
        val blocks: List<TranslatedBlock>,
        /** First error hit for some source language, when nothing could be translated for it. */
        val error: TranslationException?,
    )

    suspend fun translateBlocks(
        blocks: List<Pair<OcrBlock, BlockStyle>>,
        targetLanguage: String,
        fixedSourceLanguage: String?,
        listener: ModelDownloadListener?,
    ): Result = coroutineScope {
        // 1. Source language per block.
        val sources = blocks.map { (block, _) ->
            async {
                when {
                    ScriptDetector.count(block.text).letters == 0 -> null
                    fixedSourceLanguage != null -> fixedSourceLanguage
                    else -> detector.detect(block.text) ?: block.language
                }
            }
        }.awaitAll()

        // 2. Models for every distinct source language (sequential: one download at a time).
        var firstError: TranslationException? = null
        val usable = mutableSetOf<String>()
        for (src in sources.filterNotNull().distinct()) {
            if (src == targetLanguage) continue
            try {
                engine.prepare(src, targetLanguage, listener)
                usable += src
            } catch (e: TranslationException) {
                if (firstError == null || firstError.reason == TranslationException.Reason.UNSUPPORTED_LANGUAGE) {
                    firstError = e
                }
            }
        }

        // 3. Translate (a few at a time; identical texts are served from the cache).
        val permits = Semaphore(4)
        val result = blocks.mapIndexed { i, (block, style) ->
            async {
                val src = sources[i]
                val translated = if (src == null || src == targetLanguage || src !in usable) {
                    null
                } else {
                    permits.withPermit { translateCached(block.text, src, targetLanguage) }
                }
                TranslatedBlock(block, src, targetLanguage, translated, style)
            }
        }.awaitAll()
        Result(result, firstError)
    }

    private suspend fun translateCached(text: String, source: String, target: String): String? {
        cache.get(text, source, target)?.let { return it }
        return try {
            engine.translate(text, source, target).also { cache.put(text, source, target, it) }
        } catch (e: TranslationException) {
            null
        }
    }
}
