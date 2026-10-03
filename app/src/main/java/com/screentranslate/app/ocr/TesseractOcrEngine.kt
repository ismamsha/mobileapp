package com.screentranslate.app.ocr

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import com.googlecode.tesseract.android.TessBaseAPI
import com.screentranslate.app.model.OcrBlock
import com.screentranslate.app.util.Logx
import com.screentranslate.app.util.ScriptDetector
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext

/**
 * Offline Tesseract OCR (LSTM "fast" models) for Cyrillic and Arabic script.
 * The native engine is kept initialized between taps; it is not thread-safe, hence the mutex.
 */
class TesseractOcrEngine(
    private val dataManager: TessDataManager,
    /** Tesseract language string, e.g. "rus+eng"; empty = nothing to do. */
    private val languages: () -> String,
) : OcrEngine, LineRecognizer {

    private val mutex = Mutex()
    private var api: TessBaseAPI? = null
    private var loadedLanguages: String? = null

    override suspend fun recognizeLines(bitmap: Bitmap): List<OcrLine> = mutex.withLock {
        withContext(Dispatchers.Default) {
            val langs = languages().split('+').filter { dataManager.isInstalled(it) }.joinToString("+")
            if (langs.isEmpty()) return@withContext emptyList()
            val tess = obtain(langs) ?: return@withContext emptyList()

            val input = prepare(bitmap)
            try {
                tess.setImage(input.bitmap)
                tess.getUTF8Text() // runs recognition
                val out = ArrayList<OcrLine>()
                val it = tess.resultIterator ?: return@withContext emptyList()
                try {
                    it.begin()
                    do {
                        val text = it.getUTF8Text(TessBaseAPI.PageIteratorLevel.RIL_TEXTLINE)?.trim()
                        if (text.isNullOrEmpty()) continue
                        val r = it.getBoundingRect(TessBaseAPI.PageIteratorLevel.RIL_TEXTLINE)
                        val conf = it.confidence(TessBaseAPI.PageIteratorLevel.RIL_TEXTLINE) / 100f
                        out += OcrLine(
                            text = text.replace('\n', ' '),
                            box = Box(r.left, r.top, r.right, r.bottom).scaled(1f / input.scale),
                            confidence = conf,
                            script = ScriptDetector.dominant(text),
                        )
                    } while (it.next(TessBaseAPI.PageIteratorLevel.RIL_TEXTLINE))
                } finally {
                    it.delete()
                }
                tess.clear()
                out
            } finally {
                if (input.bitmap !== bitmap) input.bitmap.recycle()
            }
        }
    }

    private fun obtain(langs: String): TessBaseAPI? {
        api?.let { if (loadedLanguages == langs) return it }
        release()
        val tess = TessBaseAPI()
        val ok = try {
            tess.init(dataManager.dataPath.absolutePath, langs, TessBaseAPI.OEM_LSTM_ONLY)
        } catch (e: Exception) {
            Logx.w("Tesseract init failed", e)
            false
        }
        if (!ok) {
            tess.recycle()
            return null
        }
        // Sparse text suits UI screenshots with scattered labels.
        tess.pageSegMode = TessBaseAPI.PageSegMode.PSM_SPARSE_TEXT
        tess.setVariable("user_defined_dpi", "300")
        api = tess
        loadedLanguages = langs
        return tess
    }

    private class Prepared(val bitmap: Bitmap, val scale: Float)

    /**
     * Grayscale, inverted for dark themes (Tesseract prefers dark text on light background),
     * upscaled slightly on low-resolution screens.
     */
    private fun prepare(src: Bitmap): Prepared {
        val dark = meanLuminance(src) < 110
        val scale = if (src.width < 900) 1.5f else 1f
        val w = (src.width * scale).toInt()
        val h = (src.height * scale).toInt()
        val out = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val cm = ColorMatrix().apply { setSaturation(0f) }
        if (dark) {
            cm.postConcat(
                ColorMatrix(
                    floatArrayOf(
                        -1f, 0f, 0f, 0f, 255f,
                        0f, -1f, 0f, 0f, 255f,
                        0f, 0f, -1f, 0f, 255f,
                        0f, 0f, 0f, 1f, 0f,
                    )
                )
            )
        }
        val paint = Paint(Paint.FILTER_BITMAP_FLAG).apply { colorFilter = ColorMatrixColorFilter(cm) }
        Canvas(out).apply {
            if (scale != 1f) scale(scale, scale)
            drawBitmap(src, 0f, 0f, paint)
        }
        return Prepared(out, scale)
    }

    private fun meanLuminance(bmp: Bitmap): Int {
        val step = 24
        var sum = 0L
        var n = 0
        var y = 0
        while (y < bmp.height) {
            var x = 0
            while (x < bmp.width) {
                val c = bmp.getPixel(x, y)
                sum += (((c shr 16) and 0xFF) * 299 + ((c shr 8) and 0xFF) * 587 + (c and 0xFF) * 114) / 1000
                n++
                x += step
            }
            y += step
        }
        return if (n == 0) 255 else (sum / n).toInt()
    }

    override suspend fun recognize(bitmap: Bitmap): List<OcrBlock> =
        TextBlockGrouper.group(recognizeLines(bitmap).filter { OcrMerger.isPlausible(it) }).map { it.toOcrBlock() }

    /** Frees the native engine (tens of MB). Re-created on next use. */
    fun release() {
        api?.recycle()
        api = null
        loadedLanguages = null
    }

    suspend fun releaseSafely() = mutex.withLock { release() }

    override fun close() = release()
}
