package com.screentranslate.app.ui

import android.app.Activity
import android.os.Bundle
import com.screentranslate.app.service.ScreenCaptureService

/**
 * Invisible trampoline for the notification's "Translate" action: launching an activity
 * collapses the notification shade, then the service captures the screen after a short delay.
 */
class TranslateNowActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ScreenCaptureService.translateNow(this, delayMs = 700)
        finish()
        @Suppress("DEPRECATION")
        overridePendingTransition(0, 0)
    }
}
