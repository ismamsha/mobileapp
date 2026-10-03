package com.screentranslate.app.translation

/** Replaceable translation backend (on-device ML Kit now; a cloud engine could be added later). */
interface TranslationEngine {
    suspend fun translate(
        text: String,
        sourceLanguage: String?,
        targetLanguage: String,
    ): String

    /** Makes sure everything needed for this pair is available (e.g. downloads models). */
    suspend fun prepare(
        sourceLanguage: String,
        targetLanguage: String,
        listener: ModelDownloadListener? = null,
    ) {}
}

fun interface ModelDownloadListener {
    /** Called before a model for [languageTag] starts downloading. */
    fun onDownloadStarted(languageTag: String)
}

class TranslationException(
    val reason: Reason,
    val languageTag: String? = null,
    cause: Throwable? = null,
) : Exception(reason.name, cause) {
    enum class Reason { MODEL_MISSING_OFFLINE, MODEL_DOWNLOAD_FAILED, UNSUPPORTED_LANGUAGE, TRANSLATION_FAILED }
}
