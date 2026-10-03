package com.screentranslate.app.ocr

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import com.googlecode.tesseract.android.TessBaseAPI
import com.screentranslate.app.model.OcrBlock
import com.screentranslate.app.util.Logx
import com.screentranslate.app.util.ScriptDetector
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlin.coroutines.coroutineContext
import kotlin.math.max
import kotlin.math.min

/**
 * Offline Tesseract OCR (LSTM "fast" models) for Cyrillic and Arabic script.
 * The native engine is kept initialized between taps; it is not thread-safe, hence the mutex.
 */
class TesseractOcrEngine(
    private val dataManager: TessDataManager,
    /** Default Tesseract language string, e.g. "rus+eng"; empty = nothing to do. */
    private val languages: () -> String,
) : OcrEngine, LineRecognizer {

    private val mutex = Mutex()
    private var api: TessBaseAPI? = null
    private var loadedLanguages: String? = null

    private fun installed(langs: String) = langs.split('+').filter { it.isNotEmpty() && dataManager.isInstalled(it) }.joinToString("+")

    /** True when every language in [langs] is downloaded. */
    fun hasData(langs: String): Boolean =
        langs.split('+').filter { it.isNotEmpty() }.let { l -> l.isNotEmpty() && l.all { dataManager.isInstalled(it) } }

    override suspend fun recognizeLines(bitmap: Bitmap): List<OcrLine> = recognizeFullPage(bitmap, languages())

    /**
     * Whole screen, downscaled so text is ~20-30 px tall (Tesseract's sweet spot); roughly
     * 2-3x faster than full resolution on 1080p screens.
     */
    suspend fun recognizeFullPage(bitmap: Bitmap, langs: String): List<OcrLine> = mutex.withLock {
        withContext(Dispatchers.Default) {
            val tess = obtain(installed(langs)) ?: return@withContext emptyList()
            val scale = when {
                // Arabic dots and joins need more pixels than Cyrillic/Latin.
                bitmap.width >= 1000 -> if ("ara" in langs) 0.85f else 0.65f
                bitmap.width < 700 -> 1.4f
                else -> 1f
            }
            val src = Rect(0, 0, bitmap.width, bitmap.height)
            val img = prepare(bitmap, src, scale)
            try {
                tess.pageSegMode = TessBaseAPI.PageSegMode.PSM_SPARSE_TEXT
                readLines(tess, img, src.left, src.top, scale)
            } finally {
                img.recycle()
            }
        }
    }

    /** Only the given screen regions (text blocks ML Kit was unsure about). */
    suspend fun recognizeRegions(bitmap: Bitmap, regions: List<Box>, langs: String): List<OcrLine> = mutex.withLock {
        withContext(Dispatchers.Default) {
            val tess = obtain(installed(langs)) ?: return@withContext emptyList()
            tess.pageSegMode = TessBaseAPI.PageSegMode.PSM_SINGLE_BLOCK
            val out = ArrayList<OcrLine>()
            for (r in regions) {
                coroutineContext.ensureActive()
                val src = Rect(r.left, r.top, r.right, r.bottom)
                if (src.width() < 8 || src.height() < 8) continue
                // Small text reads better slightly enlarged; very tall regions are shrunk.
                val estLineH = min(src.height(), 120)
                val scale = when {
                    estLineH < 28 -> 1.5f
                    else -> 1f
                }
                val img = prepare(bitmap, src, scale)
                try {
                    out += readLines(tess, img, src.left, src.top, scale)
                } finally {
                    img.recycle()
                }
            }
            out
        }
    }

    private fun readLines(tess: TessBaseAPI, img: Bitmap, offX: Int, offY: Int, scale: Float): List<OcrLine> {
        tess.setImage(img)
        tess.getUTF8Text() // runs recognition
        val out = ArrayList<OcrLine>()
        val it = tess.resultIterator ?: return out
        try {
            it.begin()
            do {
                val text = it.getUTF8Text(TessBaseAPI.PageIteratorLevel.RIL_TEXTLINE)?.trim()
                if (text.isNullOrEmpty()) continue
                val r = it.getBoundingRect(TessBaseAPI.PageIteratorLevel.RIL_TEXTLINE)
                val conf = it.confidence(TessBaseAPI.PageIteratorLevel.RIL_TEXTLINE) / 100f
                out += OcrLine(
                    text = text.replace('\n', ' '),
                    box = Box(
                        offX + (r.left / scale).toInt(), offY + (r.top / scale).toInt(),
                        offX + (r.right / scale).toInt(), offY + (r.bottom / scale).toInt(),
                    ),
                    confidence = conf,
                    script = ScriptDetector.dominant(text),
                )
            } while (it.next(TessBaseAPI.PageIteratorLevel.RIL_TEXTLINE))
        } finally {
            it.delete()
            tess.clear()
        }
        return out
    }

    private fun obtain(langs: String): TessBaseAPI? {
        if (langs.isEmpty()) return null
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
        tess.setVariable("user_defined_dpi", "300")
        api = tess
        loadedLanguages = langs
        return tess
    }

    /** Pre-loads the engine so the first tap is not slowed by model loading. */
    suspend fun warmUp() = mutex.withLock {
        withContext(Dispatchers.Default) { obtain(installed(languages())) }
        Unit
    }

    /**
     * Grayscale crop, inverted for dark backgrounds (Tesseract prefers dark text on light),
     * scaled by [scale].
     */
    private fun prepare(src: Bitmap, region: Rect, scale: Float): Bitmap {
        val dark = meanLuminance(src, region) < 110
        val w = max(1, (region.width() * scale).toInt())
        val h = max(1, (region.height() * scale).toInt())
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
        Canvas(out).drawBitmap(src, region, RectF(0f, 0f, w.toFloat(), h.toFloat()), paint)
        return out
    }

    private fun meanLuminance(bmp: Bitmap, region: Rect): Int {
        val step = max(4, min(region.width(), region.height()) / 12)
        var sum = 0L
        var n = 0
        var y = region.top
        while (y < region.bottom) {
            var x = region.left
            while (x < region.right) {
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
