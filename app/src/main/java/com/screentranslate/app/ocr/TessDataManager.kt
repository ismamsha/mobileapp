package com.screentranslate.app.ocr

import android.content.Context
import com.screentranslate.app.model.AppLanguage
import com.screentranslate.app.util.Logx
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import kotlin.coroutines.coroutineContext

/**
 * Downloads and stores Tesseract "fast" traineddata files (eng/rus/ara, about 1-4 MB each)
 * on first use, so the APK stays small.
 */
class TessDataManager(context: Context) {

    /** Tesseract expects `<dataPath>/tessdata/<lang>.traineddata`. */
    val dataPath: File = File(context.filesDir, "tesseract")
    private val tessDir = File(dataPath, "tessdata")
    private val mutex = Mutex()

    data class Progress(val language: String, val bytesRead: Long, val totalBytes: Long) {
        val fraction: Float get() = if (totalBytes > 0) (bytesRead.toFloat() / totalBytes).coerceIn(0f, 1f) else 0f
    }

    private val _progress = MutableStateFlow<Progress?>(null)
    /** Current download, or null when idle. */
    val progress: StateFlow<Progress?> = _progress.asStateFlow()

    private val _installed = MutableStateFlow(scanInstalled())
    val installed: StateFlow<Set<String>> = _installed.asStateFlow()

    fun isInstalled(tessCode: String): Boolean = file(tessCode).let { it.exists() && it.length() > MIN_SIZE }

    fun fileSize(tessCode: String): Long = file(tessCode).takeIf { it.exists() }?.length() ?: 0L

    private fun file(tessCode: String) = File(tessDir, "$tessCode.traineddata")

    private fun scanInstalled(): Set<String> =
        AppLanguage.entries.map { it.tesseractCode }.filter { isInstalled(it) }.toSet()

    /** Downloads any missing languages. Throws IOException on network failure. */
    suspend fun ensure(codes: Collection<String>) {
        for (code in codes) {
            if (!isInstalled(code)) download(code)
        }
    }

    suspend fun download(tessCode: String) = mutex.withLock {
        if (isInstalled(tessCode)) return@withLock
        withContext(Dispatchers.IO) {
            tessDir.mkdirs()
            var lastError: IOException? = null
            for (base in MIRRORS) {
                try {
                    downloadFrom("$base$tessCode.traineddata", tessCode)
                    lastError = null
                    break
                } catch (e: IOException) {
                    Logx.w("traineddata download failed for $tessCode from mirror", e)
                    lastError = e
                }
            }
            _progress.value = null
            _installed.value = scanInstalled()
            lastError?.let { throw it }
        }
    }

    private suspend fun downloadFrom(url: String, tessCode: String) {
        val tmp = File(tessDir, "$tessCode.traineddata.part")
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 15_000
            readTimeout = 30_000
            instanceFollowRedirects = true
        }
        try {
            if (conn.responseCode !in 200..299) throw IOException("HTTP ${conn.responseCode}")
            val total = conn.contentLengthLong
            conn.inputStream.use { input ->
                tmp.outputStream().use { out ->
                    val buf = ByteArray(64 * 1024)
                    var read = 0L
                    while (true) {
                        coroutineContext.ensureActive()
                        val n = input.read(buf)
                        if (n < 0) break
                        out.write(buf, 0, n)
                        read += n
                        _progress.value = Progress(tessCode, read, total)
                    }
                }
            }
            if (tmp.length() < MIN_SIZE) throw IOException("File too small")
            if (!tmp.renameTo(file(tessCode))) throw IOException("Could not save language data")
        } finally {
            conn.disconnect()
            tmp.delete()
        }
    }

    fun delete(tessCode: String) {
        file(tessCode).delete()
        _installed.value = scanInstalled()
    }

    companion object {
        private const val MIN_SIZE = 100_000L
        private val MIRRORS = listOf(
            "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/main/",
            "https://github.com/tesseract-ocr/tessdata_fast/raw/main/",
            "https://cdn.jsdelivr.net/gh/tesseract-ocr/tessdata_fast@main/",
        )
    }
}
