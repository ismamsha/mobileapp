package com.screentranslate.app.overlay

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.view.MotionEvent
import android.view.View

/**
 * Full-screen view that paints translations at the original text positions.
 * Draws in absolute screen coordinates; compensates for wherever the system placed the window.
 */
@SuppressLint("ViewConstructor")
class TranslationOverlayView(
    context: Context,
    private val onBackgroundTap: () -> Unit,
) : View(context) {

    private var blocks: List<RenderBlock> = emptyList()
    private val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val shadowPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0x33000000 }
    private val loc = IntArray(2)
    private val radius = 4f * resources.displayMetrics.density

    fun setBlocks(newBlocks: List<RenderBlock>) {
        blocks = newBlocks
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        getLocationOnScreen(loc)
        canvas.save()
        canvas.translate(-loc[0].toFloat(), -loc[1].toFloat())
        for (b in blocks) {
            if (b.isCard) {
                canvas.drawRoundRect(b.background.left + 1, b.background.top + 2, b.background.right + 1, b.background.bottom + 2, radius, radius, shadowPaint)
            }
            bgPaint.color = b.backgroundColor
            canvas.drawRoundRect(b.background, radius, radius, bgPaint)
            canvas.save()
            canvas.translate(b.textLeft, b.textTop)
            b.layout.draw(canvas)
            canvas.restore()
        }
        canvas.restore()
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.actionMasked == MotionEvent.ACTION_UP) onBackgroundTap()
        return true
    }
}
