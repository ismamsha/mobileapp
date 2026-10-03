package com.screentranslate.app.model

/** The three primary languages of the app. Codes are BCP-47 / ML Kit tags. */
enum class AppLanguage(
    val code: String,
    val englishName: String,
    val nativeName: String,
    val tesseractCode: String,
    val isRtl: Boolean,
) {
    ARABIC("ar", "Arabic", "العربية", "ara", true),
    RUSSIAN("ru", "Russian", "Русский", "rus", false),
    ENGLISH("en", "English", "English", "eng", false);

    val shortLabel: String get() = code.uppercase()

    companion object {
        fun fromCode(code: String?): AppLanguage? = entries.firstOrNull { it.code == code }

        /** Human readable name for any ML Kit language tag (falls back to the tag). */
        fun displayName(code: String): String =
            fromCode(code)?.englishName
                ?: java.util.Locale.forLanguageTag(code).getDisplayLanguage(java.util.Locale.ENGLISH)
                    .ifBlank { code }

        fun isRtlLanguage(code: String): Boolean =
            code in setOf("ar", "fa", "ur", "he", "iw")
    }
}
