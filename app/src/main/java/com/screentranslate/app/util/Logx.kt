package com.screentranslate.app.util

import android.util.Log
import com.screentranslate.app.BuildConfig

/**
 * Logging that never receives recognized/translated text: callers pass counts,
 * timings and error types only. Disabled entirely in release builds.
 */
object Logx {
    private const val TAG = "ScreenTranslate"

    fun d(message: String) {
        if (BuildConfig.DEBUG) Log.d(TAG, message)
    }

    fun w(message: String, error: Throwable? = null) {
        // Only the exception class is logged: messages could contain screen text.
        if (BuildConfig.DEBUG) Log.w(TAG, message + (error?.let { " (${it.javaClass.simpleName})" } ?: ""))
    }
}
