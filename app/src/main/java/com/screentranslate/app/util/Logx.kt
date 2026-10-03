package com.screentranslate.app.util

import android.util.Log
import com.screentranslate.app.BuildConfig

/**
 * Logging that never receives recognized/translated text: callers pass counts,
 * timings and error types only. Disabled entirely in release builds.
 */
object Logx {
    private const val TAG = "ScreenTranslate"
    private val ENABLED = BuildConfig.DEBUG || BuildConfig.TEST_LOGS

    fun d(message: String) {
        if (ENABLED) Log.d(TAG, message)
    }

    fun w(message: String, error: Throwable? = null) {
        // Only the exception class is logged: messages could contain screen text.
        if (ENABLED) Log.w(TAG, message + (error?.let { " (${it.javaClass.simpleName})" } ?: ""))
    }
}
