package com.screentranslate.app.util

enum class Script { LATIN, CYRILLIC, ARABIC, OTHER, NONE }

/** Pure-Kotlin script analysis used for OCR merging and language-detection fallback. */
object ScriptDetector {

    data class Counts(val latin: Int, val cyrillic: Int, val arabic: Int, val other: Int) {
        val letters: Int get() = latin + cyrillic + arabic + other
    }

    fun count(text: CharSequence): Counts {
        var latin = 0
        var cyrillic = 0
        var arabic = 0
        var other = 0
        var i = 0
        while (i < text.length) {
            val cp = Character.codePointAt(text, i)
            i += Character.charCount(cp)
            if (!Character.isLetter(cp)) continue
            when (Character.UnicodeScript.of(cp)) {
                Character.UnicodeScript.LATIN -> latin++
                Character.UnicodeScript.CYRILLIC -> cyrillic++
                Character.UnicodeScript.ARABIC -> arabic++
                else -> other++
            }
        }
        return Counts(latin, cyrillic, arabic, other)
    }

    /** Script of the majority of letters, or [Script.NONE] when there are no letters. */
    fun dominant(text: CharSequence): Script {
        val c = count(text)
        if (c.letters == 0) return Script.NONE
        val max = maxOf(c.latin, c.cyrillic, c.arabic, c.other)
        return when (max) {
            c.arabic -> Script.ARABIC
            c.cyrillic -> Script.CYRILLIC
            c.latin -> Script.LATIN
            else -> Script.OTHER
        }
    }

    fun letterRatio(text: CharSequence): Float {
        val nonSpace = text.count { !it.isWhitespace() }
        if (nonSpace == 0) return 0f
        return count(text).letters.toFloat() / nonSpace
    }

    /** Most likely language for a script when nothing better is known. */
    fun defaultLanguage(script: Script): String? = when (script) {
        Script.CYRILLIC -> "ru"
        Script.ARABIC -> "ar"
        Script.LATIN -> "en"
        else -> null
    }
}
