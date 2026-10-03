package com.screentranslate.app.translation

import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.TranslateRemoteModel
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import com.screentranslate.app.language.LanguageDetector
import com.screentranslate.app.util.Logx
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.tasks.await
import java.io.Closeable
import java.util.concurrent.ConcurrentHashMap

/**
 * Google ML Kit on-device translation. Models (~30 MB per language) are downloaded once and
 * cached by ML Kit; translation itself runs fully offline.
 */
class MlKitTranslationEngine(
    private val detector: LanguageDetector,
    private val isOnline: () -> Boolean,
) : TranslationEngine, Closeable {

    private val modelManager = RemoteModelManager.getInstance()
    private val translators = ConcurrentHashMap<String, Translator>()
    private val downloadLock = Mutex()

    override suspend fun prepare(sourceLanguage: String, targetLanguage: String, listener: ModelDownloadListener?) {
        val src = TranslateLanguage.fromLanguageTag(sourceLanguage)
            ?: throw TranslationException(TranslationException.Reason.UNSUPPORTED_LANGUAGE, sourceLanguage)
        val tgt = TranslateLanguage.fromLanguageTag(targetLanguage)
            ?: throw TranslationException(TranslationException.Reason.UNSUPPORTED_LANGUAGE, targetLanguage)
        // Target first: that's the message users expect ("Downloading Arabic translation model...").
        for (lang in listOf(tgt, src).distinct()) ensureModel(lang, listener)
    }

    suspend fun isModelDownloaded(tag: String): Boolean {
        val lang = TranslateLanguage.fromLanguageTag(tag) ?: return false
        return modelManager.isModelDownloaded(TranslateRemoteModel.Builder(lang).build()).await()
    }

    suspend fun ensureModel(lang: String, listener: ModelDownloadListener? = null) = downloadLock.withLock {
        val model = TranslateRemoteModel.Builder(lang).build()
        val present = try {
            modelManager.isModelDownloaded(model).await()
        } catch (e: Exception) {
            false
        }
        if (present) return@withLock
        if (!isOnline()) throw TranslationException(TranslationException.Reason.MODEL_MISSING_OFFLINE, lang)
        listener?.onDownloadStarted(lang)
        try {
            modelManager.download(model, DownloadConditions.Builder().build()).await()
        } catch (e: Exception) {
            Logx.w("Model download failed for $lang", e)
            throw TranslationException(TranslationException.Reason.MODEL_DOWNLOAD_FAILED, lang, e)
        }
    }

    suspend fun deleteModel(tag: String) {
        val lang = TranslateLanguage.fromLanguageTag(tag) ?: return
        translators.entries.removeIf { (k, v) -> (k.startsWith("$lang>") || k.endsWith(">$lang")).also { if (it) v.close() } }
        modelManager.deleteDownloadedModel(TranslateRemoteModel.Builder(lang).build()).await()
    }

    override suspend fun translate(text: String, sourceLanguage: String?, targetLanguage: String): String {
        val source = sourceLanguage ?: detector.detect(text)
            ?: throw TranslationException(TranslationException.Reason.UNSUPPORTED_LANGUAGE)
        if (source == targetLanguage) return text
        val src = TranslateLanguage.fromLanguageTag(source)
            ?: throw TranslationException(TranslationException.Reason.UNSUPPORTED_LANGUAGE, source)
        val tgt = TranslateLanguage.fromLanguageTag(targetLanguage)
            ?: throw TranslationException(TranslationException.Reason.UNSUPPORTED_LANGUAGE, targetLanguage)
        val translator = translators.getOrPut("$src>$tgt") {
            Translation.getClient(TranslatorOptions.Builder().setSourceLanguage(src).setTargetLanguage(tgt).build())
        }
        return try {
            translator.translate(text).await()
        } catch (e: Exception) {
            Logx.w("Translation failed", e)
            throw TranslationException(TranslationException.Reason.TRANSLATION_FAILED, source, e)
        }
    }

    /** Frees translator instances (models stay on disk). */
    fun releaseTranslators() {
        translators.values.forEach { it.close() }
        translators.clear()
    }

    override fun close() = releaseTranslators()
}
