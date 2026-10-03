package com.screentranslate.app.overlay

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.content.res.ColorStateList
import com.screentranslate.app.util.Logx

/** Small non-touchable message pill at the top of the screen ("No text was detected…"). */
class StatusMessageController(
    private val context: Context,
    private val windowManager: WindowManager,
) {
    private val density = context.resources.displayMetrics.density
    private val handler = Handler(Looper.getMainLooper())
    private var view: LinearLayout? = null
    private var text: TextView? = null
    private var spinner: ProgressBar? = null
    private val hideRunnable = Runnable { hide() }

    fun show(message: String, busy: Boolean = false, durationMs: Long = 3500) {
        handler.removeCallbacks(hideRunnable)
        if (view == null) create()
        text?.text = message
        spinner?.visibility = if (busy) View.VISIBLE else View.GONE
        if (!busy) handler.postDelayed(hideRunnable, durationMs)
    }

    private fun create() {
        val row = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val p = (12 * density).toInt()
            setPadding(p, (8 * density).toInt(), p, (8 * density).toInt())
            background = GradientDrawable().apply {
                cornerRadius = 20 * density
                setColor(0xF0202124.toInt())
            }
        }
        val sp = ProgressBar(context).apply {
            isIndeterminate = true
            indeterminateTintList = ColorStateList.valueOf(Color.WHITE)
        }
        val size = (18 * density).toInt()
        row.addView(sp, LinearLayout.LayoutParams(size, size).apply { marginEnd = (8 * density).toInt() })
        val tv = TextView(context).apply {
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            maxWidth = (300 * density).toInt()
        }
        row.addView(tv)
        val lp = OverlayWindows.params(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT,
            touchable = false, gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL,
        ).apply { y = (56 * density).toInt() }
        try {
            windowManager.addView(row, lp)
            view = row
            text = tv
            spinner = sp
        } catch (e: Exception) {
            Logx.w("Could not show status", e)
        }
    }

    fun hide() {
        handler.removeCallbacks(hideRunnable)
        view?.let { runCatching { windowManager.removeViewImmediate(it) } }
        view = null
        text = null
        spinner = null
    }

    /** Temporarily hide for capture; returns whether it was showing. */
    fun setHiddenForCapture(hidden: Boolean) {
        view?.visibility = if (hidden) View.INVISIBLE else View.VISIBLE
    }
}
