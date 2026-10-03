package com.screentranslate.app

import android.app.Application
import android.content.ComponentCallbacks2
import com.screentranslate.app.language.LanguageDetector
import com.screentranslate.app.ocr.HybridOcrEngine
import com.screentranslate.app.ocr.MlKitOcrEngine
import com.screentranslate.app.ocr.TessDataManager
import com.screentranslate.app.ocr.TesseractOcrEngine
import com.screentranslate.app.settings.SettingsRepository
import com.screentranslate.app.translation.MlKitTranslationEngine
import com.screentranslate.app.translation.TranslationCache
import com.screentranslate.app.translation.TranslationRepository
import com.screentranslate.app.util.DeviceUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class ScreenTranslateApplication : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }

    @Suppress("DEPRECATION")
    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        if (level >= ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW) container.trimMemory()
    }
}

/** Simple manual dependency container (no DI framework needed for an app this size). */
class AppContainer(app: Application) {
    val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    val settings = SettingsRepository(app, appScope)
    val tessData = TessDataManager(app)
    val languageDetector by lazy { LanguageDetector() }
    val translationCache = TranslationCache()
    val translationEngine by lazy { MlKitTranslationEngine(languageDetector) { DeviceUtils.isOnline(app) } }
    val translationRepository by lazy { TranslationRepository(translationEngine, translationCache, languageDetector) }

    val mlKitOcr by lazy { MlKitOcrEngine() }
    val tesseractOcr by lazy { TesseractOcrEngine(tessData) { settings.current.tesseractLanguages() } }
    val ocrEngine by lazy {
        HybridOcrEngine(mlKitOcr, tesseractOcr) { settings.current.tesseractLanguages().isNotEmpty() }
    }

    fun trimMemory() {
        translationCache.clear()
        appScope.launch { tesseractOcr.releaseSafely() }
    }
}

val android.content.Context.appContainer: AppContainer
    get() = (applicationContext as ScreenTranslateApplication).container
