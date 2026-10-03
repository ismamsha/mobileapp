package com.screentranslate.app.ocr

import android.graphics.Bitmap
import android.graphics.Rect
import com.screentranslate.app.model.OcrBlock
import com.screentranslate.app.util.ScriptDetector
import java.io.Closeable

/** Replaceable OCR backend. Implementations must be called off the main thread. */
interface OcrEngine : Closeable {
    suspend fun recognize(bitmap: Bitmap): List<OcrBlock>
    override fun close() {}
}

/** Line-level recognizer used by the hybrid engine before grouping. */
interface LineRecognizer {
    suspend fun recognizeLines(bitmap: Bitmap): List<OcrLine>
}

internal fun LineGroup.toOcrBlock(): OcrBlock {
    val b = box
    return OcrBlock(
        text = text,
        boundingBox = Rect(b.left, b.top, b.right, b.bottom),
        confidence = confidence,
        language = ScriptDetector.defaultLanguage(script),
        lineCount = lines.size,
    )
}
