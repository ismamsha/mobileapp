package com.screentranslate.app.translation

/** In-memory LRU cache: (source text + source language + target language) -> translation. */
class TranslationCache(private val maxEntries: Int = 600) {

    private val map = object : LinkedHashMap<String, String>(64, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, String>?): Boolean =
            size > maxEntries
    }

    private fun key(text: String, source: String?, target: String) = "${source ?: "auto"}\u0000$target\u0000$text"

    @Synchronized
    fun get(text: String, source: String?, target: String): String? = map[key(text, source, target)]

    @Synchronized
    fun put(text: String, source: String?, target: String, translation: String) {
        map[key(text, source, target)] = translation
    }

    @Synchronized
    fun clear() = map.clear()

    @get:Synchronized
    val size: Int get() = map.size
}
