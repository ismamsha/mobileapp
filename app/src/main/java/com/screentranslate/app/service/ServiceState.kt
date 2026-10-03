package com.screentranslate.app.service

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** Process-wide state of the screen translator, observed by the UI. */
object ServiceState {
    private val _running = MutableStateFlow(false)
    val running: StateFlow<Boolean> = _running.asStateFlow()

    /** Last problem the UI should explain (permission stopped, bubble blocked by MIUI, …). */
    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    private val _bubbleBlocked = MutableStateFlow(false)
    val bubbleBlocked: StateFlow<Boolean> = _bubbleBlocked.asStateFlow()

    internal fun setRunning(v: Boolean) { _running.value = v }
    internal fun setBubbleBlocked(v: Boolean) { _bubbleBlocked.value = v }
    fun setMessage(m: String?) { _message.value = m }
}
