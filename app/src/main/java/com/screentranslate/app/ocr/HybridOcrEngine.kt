package com.screentranslate.app.ocr

import android.graphics.Bitmap
import com.screentranslate.app.model.OcrBlock
import com.screentranslate.app.util.Logx
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope

/**
 * Default engine: ML Kit (Latin) and Tesseract (Cyrillic/Arabic) run in parallel
 * on the same screenshot; results are merged and grouped into blocks.
 */
class HybridOcrEngine(
    private val mlKit: MlKitOcrEngine,
    private val tesseract: TesseractOcrEngine,
    private val useTesseract: () -> Boolean,
) : OcrEngine {

    override suspend fun recognize(bitmap: Bitmap): List<OcrBlock> = coroutineScope {
        val start = System.currentTimeMillis()
        val ml = async { runCatching { mlKit.recognizeLines(bitmap) } }
        val tess = if (useTesseract()) async { runCatching { tesseract.recognizeLines(bitmap) } } else null
        val mlLines = ml.await().onFailure { Logx.w("ML Kit OCR failed", it) }.getOrDefault(emptyList())
        val tessLines = tess?.await()?.onFailure { Logx.w("Tesseract OCR failed", it) }?.getOrDefault(emptyList()).orEmpty()
        val merged = OcrMerger.merge(mlLines, tessLines)
        val blocks = TextBlockGrouper.group(merged).map { it.toOcrBlock() }
        Logx.d("OCR: ml=${mlLines.size} tess=${tessLines.size} blocks=${blocks.size} in ${System.currentTimeMillis() - start}ms")
        blocks
    }
}
