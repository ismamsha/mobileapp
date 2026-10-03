package com.screentranslate.app

import com.screentranslate.app.translation.TranslationCache
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class TranslationCacheTest {
    @Test fun keyIncludesLanguages() {
        val c = TranslationCache()
        c.put("Hello", "en", "ar", "مرحبا")
        assertEquals("مرحبا", c.get("Hello", "en", "ar"))
        assertNull(c.get("Hello", "en", "ru"))
        assertNull(c.get("Hello", "de", "ar"))
    }

    @Test fun evictsLeastRecentlyUsed() {
        val c = TranslationCache(maxEntries = 2)
        c.put("a", "en", "ar", "1")
        c.put("b", "en", "ar", "2")
        c.get("a", "en", "ar")
        c.put("c", "en", "ar", "3")
        assertEquals("1", c.get("a", "en", "ar"))
        assertNull(c.get("b", "en", "ar"))
        assertEquals(2, c.size)
    }
}
