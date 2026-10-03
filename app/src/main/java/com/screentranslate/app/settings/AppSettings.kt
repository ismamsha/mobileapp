package com.screentranslate.app.settings

import com.screentranslate.app.model.AppLanguage

enum class OcrMode(val label: String, val description: String) {
    AUTOMATIC("Automatic", "English via ML Kit, Russian/Arabic via Tesseract (only scripts that need translating)"),
    ALL_SCRIPTS("All scripts", "Always look for English, Russian and Arabic text (slower)"),
    LATIN_ONLY("English / Latin only", "Fastest; Russian and Arabic text is not recognized"),
}

enum class FontSizeMode(val label: String, val sp: Float?) {
    AUTO("Auto", null),
    SMALL("Small", 12f),
    MEDIUM("Medium", 15f),
    LARGE("Large", 18f),
}

data class AppSettings(
    val targetLanguage: AppLanguage = AppLanguage.ARABIC,
    val autoDetectSource: Boolean = true,
    val sourceLanguage: AppLanguage = AppLanguage.ENGLISH,
    val ocrMode: OcrMode = OcrMode.AUTOMATIC,
    val overlayOpacity: Float = 1f,
    val fontSize: FontSizeMode = FontSizeMode.AUTO,
    val showBubble: Boolean = true,
    val captureExplained: Boolean = false,
) {
    /** Source language fixed by the user, or null for automatic detection. */
    val fixedSource: String? get() = if (autoDetectSource) null else sourceLanguage.code

    /** Tesseract languages needed for the current settings ("" when ML Kit alone is enough). */
    fun tesseractLanguages(): String {
        val nonLatin = when (ocrMode) {
            OcrMode.LATIN_ONLY -> emptyList()
            OcrMode.ALL_SCRIPTS -> listOf(AppLanguage.RUSSIAN, AppLanguage.ARABIC)
            OcrMode.AUTOMATIC ->
                if (!autoDetectSource) listOf(sourceLanguage).filter { it != AppLanguage.ENGLISH }
                // Text already in the target language is never translated, so its script is not needed.
                else listOf(AppLanguage.RUSSIAN, AppLanguage.ARABIC).filter { it != targetLanguage }
        }
        if (nonLatin.isEmpty()) return ""
        // eng lets Tesseract label Latin words correctly instead of forcing them into Cyrillic/Arabic.
        return (nonLatin.map { it.tesseractCode } + "eng").joinToString("+")
    }
}
