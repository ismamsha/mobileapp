package com.screentranslate.app.model

import android.graphics.Rect

/**
 * One block of recognized text (a line or a group of lines that belong together),
 * in screen pixel coordinates.
 */
data class OcrBlock(
    val text: String,
    val boundingBox: Rect,
    val confidence: Float?,
    val language: String?,
    val lineCount: Int = 1,
)
