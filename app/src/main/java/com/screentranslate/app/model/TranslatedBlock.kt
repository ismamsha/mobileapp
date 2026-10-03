package com.screentranslate.app.model

/**
 * An OCR block plus its translation and the colors used to paint it over the screen.
 * [translatedText] is null when the block is not translated (already in the target
 * language, no letters, unsupported language).
 */
data class TranslatedBlock(
    val block: OcrBlock,
    val sourceLanguage: String?,
    val targetLanguage: String,
    val translatedText: String?,
    val style: BlockStyle,
)

/** Colors sampled from the screenshot around a block. */
data class BlockStyle(
    val backgroundColor: Int,
    val textColor: Int,
    /** False when the background was too busy to sample: draw a card instead. */
    val sampledReliably: Boolean,
)
