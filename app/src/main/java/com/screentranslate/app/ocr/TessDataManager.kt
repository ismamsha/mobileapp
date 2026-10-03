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
import java.security.MessageDigest
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

    /** Installed means present with exactly the pinned size (the hash is checked when downloading). */
    fun isInstalled(tessCode: String): Boolean =
        file(tessCode).let { f -> f.exists() && PINNED[tessCode]?.let { f.length() == it.size } == true }

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
        val pinned = PINNED[tessCode] ?: throw IOException("Unsupported language")
        withContext(Dispatchers.IO) {
            tessDir.mkdirs()
            var lastError: IOException? = null
            for (base in MIRRORS) {
                try {
                    downloadFrom("$base$tessCode.traineddata", tessCode, pinned)
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

    private suspend fun downloadFrom(url: String, tessCode: String, pinned: Pinned) {
        val tmp = File(tessDir, "$tessCode.traineddata.part")
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = 15_000
            readTimeout = 30_000
            instanceFollowRedirects = true
        }
        try {
            if (conn.responseCode !in 200..299) throw IOException("HTTP ${conn.responseCode}")
            // Redirects must stay on HTTPS.
            if (conn.url.protocol != "https") throw IOException("Insecure redirect")
            val total = pinned.size
            val digest = MessageDigest.getInstance("SHA-256")
            conn.inputStream.use { input ->
                tmp.outputStream().use { out ->
                    val buf = ByteArray(64 * 1024)
                    var read = 0L
                    while (true) {
                        coroutineContext.ensureActive()
                        val n = input.read(buf)
                        if (n < 0) break
                        read += n
                        // Never write more than the expected file (protects storage from a bad mirror).
                        if (read > pinned.size) throw IOException("File too large")
                        out.write(buf, 0, n)
                        digest.update(buf, 0, n)
                        _progress.value = Progress(tessCode, read, total)
                    }
                }
            }
            // Tesseract parses this file in native code, so only the exact known file is accepted.
            val hash = digest.digest().joinToString("") { "%02x".format(it) }
            if (tmp.length() != pinned.size || hash != pinned.sha256) throw IOException("Language data failed verification")
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

    private class Pinned(val size: Long, val sha256: String)

    companion object {
        /** tessdata_fast commit the hashes below were taken from. */
        private const val COMMIT = "87416418657359cb625c412a48b6e1d6d41c29bd"
        private val MIRRORS = listOf(
            "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/$COMMIT/",
            "https://github.com/tesseract-ocr/tessdata_fast/raw/$COMMIT/",
            "https://cdn.jsdelivr.net/gh/tesseract-ocr/tessdata_fast@$COMMIT/",
        )
        private val PINNED = mapOf(
            "eng" to Pinned(4_113_088, "7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2"),
            "rus" to Pinned(3_861_738, "e16e5e036cce1d9ec2b00063cf8b54472625b9e14d893a169e2b0dedeb4df225"),
            "ara" to Pinned(1_432_056, "e3206d3dc87fd50c24a0fb9f01838615911d25168f4e64415244b67d2bb3e729"),
        )
    }
}
