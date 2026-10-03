package com.screentranslate.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.screentranslate.app.appContainer
import com.screentranslate.app.model.AppLanguage
import com.screentranslate.app.settings.FontSizeMode
import com.screentranslate.app.settings.OcrMode
import com.screentranslate.app.translation.TranslationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class ModelState { UNKNOWN, NOT_DOWNLOADED, DOWNLOADING, DOWNLOADED }

class AppViewModel(app: Application) : AndroidViewModel(app) {

    private val container = app.appContainer
    val settings = container.settings.settings
    val tessInstalled = container.tessData.installed
    val tessProgress = container.tessData.progress

    private val _models = MutableStateFlow(AppLanguage.entries.associate { it.code to ModelState.UNKNOWN })
    val translationModels: StateFlow<Map<String, ModelState>> = _models.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    /** One-off message for the model manager screen. */
    val message: StateFlow<String?> = _message.asStateFlow()

    fun clearMessage() { _message.value = null }

    fun refreshModels() {
        viewModelScope.launch {
            for (lang in AppLanguage.entries) {
                if (_models.value[lang.code] == ModelState.DOWNLOADING) continue
                val downloaded = runCatching { container.translationEngine.isModelDownloaded(lang.code) }.getOrDefault(false)
                _models.update { it + (lang.code to if (downloaded) ModelState.DOWNLOADED else ModelState.NOT_DOWNLOADED) }
            }
        }
    }

    fun downloadModel(lang: AppLanguage) {
        _models.update { it + (lang.code to ModelState.DOWNLOADING) }
        viewModelScope.launch {
            try {
                container.translationEngine.ensureModel(lang.code)
                _models.update { it + (lang.code to ModelState.DOWNLOADED) }
            } catch (e: TranslationException) {
                _models.update { it + (lang.code to ModelState.NOT_DOWNLOADED) }
                _message.value = if (e.reason == TranslationException.Reason.MODEL_MISSING_OFFLINE)
                    "No internet connection. ${lang.englishName} model must be downloaded once."
                else "Couldn't download the ${lang.englishName} model. Try again."
            }
        }
    }

    fun deleteModel(lang: AppLanguage) {
        viewModelScope.launch {
            runCatching { container.translationEngine.deleteModel(lang.code) }
            refreshModels()
        }
    }

    fun downloadOcr(lang: AppLanguage) {
        viewModelScope.launch {
            try {
                container.tessData.download(lang.tesseractCode)
            } catch (e: Exception) {
                _message.value = "Couldn't download ${lang.englishName} text recognition data. Check your connection."
            }
        }
    }

    fun deleteOcr(lang: AppLanguage) {
        viewModelScope.launch {
            container.tesseractOcr.releaseSafely()
            container.tessData.delete(lang.tesseractCode)
        }
    }

    fun ocrFileSize(lang: AppLanguage): Long = container.tessData.fileSize(lang.tesseractCode)

    fun setTarget(l: AppLanguage) = viewModelScope.launch { container.settings.setTargetLanguage(l) }
    fun setAutoDetect(v: Boolean) = viewModelScope.launch { container.settings.setAutoDetect(v) }
    fun setSource(l: AppLanguage) = viewModelScope.launch { container.settings.setSourceLanguage(l) }
    fun setOcrMode(m: OcrMode) = viewModelScope.launch { container.settings.setOcrMode(m) }
    fun setOpacity(v: Float) = viewModelScope.launch { container.settings.setOverlayOpacity(v) }
    fun setFontSize(m: FontSizeMode) = viewModelScope.launch { container.settings.setFontSize(m) }
    fun setShowBubble(v: Boolean) = viewModelScope.launch { container.settings.setShowBubble(v) }
    fun markCaptureExplained() = viewModelScope.launch { container.settings.setCaptureExplained() }
}
