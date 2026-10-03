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
        val result = recognizer.process(InputImage.fromBitmap(bitmap, 0)).await()
        val lines = ArrayList<OcrLine>()
        for ((index, block) in result.textBlocks.withIndex()) {
            for (line in block.lines) {
                val r = line.boundingBox ?: continue
                lines += OcrLine(
                    text = line.text,
                    box = Box(r.left, r.top, r.right, r.bottom),
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
