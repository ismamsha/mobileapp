package com.screentranslate.app.settings

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.screentranslate.app.model.AppLanguage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

private val Context.dataStore by preferencesDataStore(name = "settings")

class SettingsRepository(private val context: Context, scope: CoroutineScope) {

    private object Keys {
        val TARGET = stringPreferencesKey("target_language")
        val AUTO_DETECT = booleanPreferencesKey("auto_detect")
        val SOURCE = stringPreferencesKey("source_language")
        val OCR_MODE = stringPreferencesKey("ocr_mode")
        val OPACITY = floatPreferencesKey("overlay_opacity")
        val FONT = stringPreferencesKey("font_size")
        val BUBBLE = booleanPreferencesKey("show_bubble")
        val CAPTURE_EXPLAINED = booleanPreferencesKey("capture_explained")
    }

    val settings: StateFlow<AppSettings> = context.dataStore.data
        .map { it.toSettings() }
        .stateIn(scope, SharingStarted.Eagerly, AppSettings())

    val current: AppSettings get() = settings.value

    private fun Preferences.toSettings(): AppSettings {
        val d = AppSettings()
        return AppSettings(
            targetLanguage = AppLanguage.fromCode(this[Keys.TARGET]) ?: d.targetLanguage,
            autoDetectSource = this[Keys.AUTO_DETECT] ?: d.autoDetectSource,
            sourceLanguage = AppLanguage.fromCode(this[Keys.SOURCE]) ?: d.sourceLanguage,
            ocrMode = this[Keys.OCR_MODE]?.let { runCatching { OcrMode.valueOf(it) }.getOrNull() } ?: d.ocrMode,
            overlayOpacity = this[Keys.OPACITY] ?: d.overlayOpacity,
            fontSize = this[Keys.FONT]?.let { runCatching { FontSizeMode.valueOf(it) }.getOrNull() } ?: d.fontSize,
            showBubble = this[Keys.BUBBLE] ?: d.showBubble,
            captureExplained = this[Keys.CAPTURE_EXPLAINED] ?: d.captureExplained,
        )
    }

    suspend fun setTargetLanguage(lang: AppLanguage) = context.dataStore.edit { it[Keys.TARGET] = lang.code }
    suspend fun setAutoDetect(v: Boolean) = context.dataStore.edit { it[Keys.AUTO_DETECT] = v }
    suspend fun setSourceLanguage(lang: AppLanguage) = context.dataStore.edit { it[Keys.SOURCE] = lang.code }
    suspend fun setOcrMode(mode: OcrMode) = context.dataStore.edit { it[Keys.OCR_MODE] = mode.name }
    suspend fun setOverlayOpacity(v: Float) = context.dataStore.edit { it[Keys.OPACITY] = v.coerceIn(0.5f, 1f) }
    suspend fun setFontSize(mode: FontSizeMode) = context.dataStore.edit { it[Keys.FONT] = mode.name }
    suspend fun setShowBubble(v: Boolean) = context.dataStore.edit { it[Keys.BUBBLE] = v }
    suspend fun setCaptureExplained() = context.dataStore.edit { it[Keys.CAPTURE_EXPLAINED] = true }
}
