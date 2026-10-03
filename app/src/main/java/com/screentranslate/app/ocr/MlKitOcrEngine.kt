package com.screentranslate.app.ocr

import android.graphics.Bitmap
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import com.screentranslate.app.model.OcrBlock
import com.screentranslate.app.util.ScriptDetector
import kotlinx.coroutines.tasks.await

/** Google ML Kit on-device text recognition (bundled Latin model): fast and accurate for English. */
class MlKitOcrEngine : OcrEngine, LineRecognizer {

    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    override suspend fun recognizeLines(bitmap: Bitmap): List<OcrLine> {
        // Screen text is large enough that a 3/4-size image reads just as well, and much faster.
        val scale = if (bitmap.width >= 1000) 0.75f else 1f
        val input = if (scale == 1f) bitmap
        else Bitmap.createScaledBitmap(bitmap, (bitmap.width * scale).toInt(), (bitmap.height * scale).toInt(), true)
        val result = try {
            recognizer.process(InputImage.fromBitmap(input, 0)).await()
        } finally {
            if (input !== bitmap) input.recycle()
        }
        val lines = ArrayList<OcrLine>()
        for ((index, block) in result.textBlocks.withIndex()) {
            for (line in block.lines) {
                val r = line.boundingBox ?: continue
                lines += OcrLine(
                    text = line.text,
                    box = Box(r.left, r.top, r.right, r.bottom).scaled(1f / scale),
                    confidence = line.confidence,
                    script = ScriptDetector.dominant(line.text),
                    group = index,
                    languageHint = line.recognizedLanguage,
                )
            }
        }
        return lines
    }

    override suspend fun recognize(bitmap: Bitmap): List<OcrBlock> =
        TextBlockGrouper.group(recognizeLines(bitmap)).map { it.toOcrBlock() }

    override fun close() = recognizer.close()
}
