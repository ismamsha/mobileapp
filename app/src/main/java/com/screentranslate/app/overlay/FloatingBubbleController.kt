package com.screentranslate.app.overlay

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.ProgressBar
import android.content.res.ColorStateList
import com.screentranslate.app.R
import com.screentranslate.app.util.Logx
import kotlin.math.abs
import kotlin.math.hypot

/** Draggable floating translate button. Single tap = translate the current screen. */
class FloatingBubbleController(
    private val context: Context,
    private val windowManager: WindowManager,
    private val onTap: () -> Unit,
) {
    private val density = context.resources.displayMetrics.density
    private val sizePx = (56 * density).toInt()
    private val prefs = context.getSharedPreferences("bubble", Context.MODE_PRIVATE)

    private var root: FrameLayout? = null
    private var icon: ImageView? = null
    private var progress: ProgressBar? = null
    private var params: WindowManager.LayoutParams? = null
    private var screenW = 0
    private var screenH = 0

    val isShowing: Boolean get() = root != null

    /** Returns false if the system refused the window (e.g. MIUI pop-up permission missing). */
    @SuppressLint("ClickableViewAccessibility")
    fun show(screenWidth: Int, screenHeight: Int): Boolean {
        if (root != null) return true
        screenW = screenWidth
        screenH = screenHeight
        val frame = FrameLayout(context).apply {
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(0xFF1A73E8.toInt())
                setStroke((2 * density).toInt(), 0xFFFFFFFF.toInt())
            }
            elevation = 8 * density
            contentDescription = "Translate screen"
        }
        val img = ImageView(context).apply {
            setImageResource(R.drawable.ic_translate)
            val p = (14 * density).toInt()
            setPadding(p, p, p, p)
        }
        val bar = ProgressBar(context).apply {
            isIndeterminate = true
            indeterminateTintList = ColorStateList.valueOf(0xFFFFFFFF.toInt())
            visibility = View.GONE
            val p = (10 * density).toInt()
            setPadding(p, p, p, p)
        }
        frame.addView(img, FrameLayout.LayoutParams(sizePx, sizePx))
        frame.addView(bar, FrameLayout.LayoutParams(sizePx, sizePx))

        val lp = OverlayWindows.params(sizePx, sizePx, touchable = true, gravity = Gravity.TOP or Gravity.START).apply {
            x = prefs.getInt("x_$orientationKey", screenWidth - sizePx - (8 * density).toInt())
            y = prefs.getInt("y_$orientationKey", (screenHeight * 0.35f).toInt())
        }
        clamp(lp)
        frame.setOnTouchListener(DragListener(lp))
        return try {
            windowManager.addView(frame, lp)
            root = frame
            icon = img
            progress = bar
            params = lp
            frame.post { logBounds() }
            true
        } catch (e: Exception) {
            Logx.w("Could not add bubble", e)
            false
        }
    }

    /** Debug builds only (Logx): lets automated UI tests find the bubble. */
    private fun logBounds() {
        val r = root ?: return
        val loc = IntArray(2)
        r.getLocationOnScreen(loc)
        Logx.d("UI_BOUNDS bubble ${loc[0] + r.width / 2} ${loc[1] + r.height / 2}")
    }

    private val orientationKey: String get() = if (screenW > screenH) "land" else "port"

    fun hide() {
        root?.let { runCatching { windowManager.removeViewImmediate(it) } }
        root = null
        icon = null
        progress = null
    }

    fun setLoading(loading: Boolean) {
        progress?.visibility = if (loading) View.VISIBLE else View.GONE
        icon?.visibility = if (loading) View.INVISIBLE else View.VISIBLE
    }

    /** Hidden (not removed) while the screen is captured, so it is not recognized as text. */
    fun setHiddenForCapture(hidden: Boolean) {
        root?.visibility = if (hidden) View.INVISIBLE else View.VISIBLE
    }

    /** Re-adds the bubble so it stays above a newly shown translation overlay. */
    fun bringToFront() {
        val r = root ?: return
        val lp = params ?: return
        runCatching {
            windowManager.removeViewImmediate(r)
            windowManager.addView(r, lp)
        }
    }

    fun onScreenChanged(width: Int, height: Int) {
        screenW = width
        screenH = height
        val lp = params ?: return
        lp.x = prefs.getInt("x_$orientationKey", width - sizePx - (8 * density).toInt())
        lp.y = prefs.getInt("y_$orientationKey", (height * 0.35f).toInt())
        clamp(lp)
        root?.let { runCatching { windowManager.updateViewLayout(it, lp) } }
        root?.postDelayed({ logBounds() }, 300)
    }

    private fun clamp(lp: WindowManager.LayoutParams) {
        lp.x = lp.x.coerceIn(0, (screenW - sizePx).coerceAtLeast(0))
        lp.y = lp.y.coerceIn(0, (screenH - sizePx).coerceAtLeast(0))
    }

    private inner class DragListener(private val lp: WindowManager.LayoutParams) : View.OnTouchListener {
        private val slop = ViewConfiguration.get(context).scaledTouchSlop
        private var downX = 0f
        private var downY = 0f
        private var startX = 0
        private var startY = 0
        private var dragging = false

        @SuppressLint("ClickableViewAccessibility")
        override fun onTouch(v: View, e: MotionEvent): Boolean {
            when (e.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    downX = e.rawX; downY = e.rawY
                    startX = lp.x; startY = lp.y
                    dragging = false
                    v.animate().scaleX(0.92f).scaleY(0.92f).setDuration(80).start()
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = e.rawX - downX
                    val dy = e.rawY - downY
                    if (!dragging && hypot(dx, dy) > slop) dragging = true
                    if (dragging) {
                        lp.x = (startX + dx).toInt()
                        lp.y = (startY + dy).toInt()
                        clamp(lp)
                        runCatching { windowManager.updateViewLayout(v, lp) }
                    }
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    v.animate().scaleX(1f).scaleY(1f).setDuration(80).start()
                    if (!dragging && e.actionMasked == MotionEvent.ACTION_UP) {
                        v.performClick()
                        onTap()
                    } else if (dragging) {
                        snapToEdge(v)
                    }
                }
            }
            return true
        }

        private fun snapToEdge(v: View) {
            val targetX = if (lp.x + sizePx / 2 < screenW / 2) 0 else screenW - sizePx
            ValueAnimator.ofInt(lp.x, targetX).apply {
                duration = 180
                interpolator = DecelerateInterpolator()
                addUpdateListener {
                    lp.x = it.animatedValue as Int
                    if (root != null) runCatching { windowManager.updateViewLayout(v, lp) }
                }
                start()
            }
            prefs.edit().putInt("x_$orientationKey", targetX).putInt("y_$orientationKey", lp.y).apply()
            v.postDelayed({ logBounds() }, 250)
        }
    }
}
