package com.screentranslate.app.overlay

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.graphics.RectF
import android.text.TextPaint
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import com.screentranslate.app.model.AppLanguage
import com.screentranslate.app.model.TranslatedBlock
import com.screentranslate.app.settings.FontSizeMode
import com.screentranslate.app.util.ColorAnalyzer
import com.screentranslate.app.util.Logx

/**
 * Shows translated blocks over the current app plus a small control bar:
 * [✕] close, [↻] translate again, [🌐] target language, [Original/Translation] toggle.
 * The underlying app is never modified; while translations are visible, taps on them close them.
 */
class TranslationOverlayController(
    private val context: Context,
    private val windowManager: WindowManager,
    private val callbacks: Callbacks,
) {

    interface Callbacks {
        fun onClose()
        fun onRetranslate()
        fun onTargetLanguageSelected(language: AppLanguage)
        /** Overlay windows were (re)added: the bubble should be brought back on top. */
        fun onOverlayShown()
    }

    private val density = context.resources.displayMetrics.density
    private val calculator = BlockLayoutCalculator(density, density * context.resources.configuration.fontScale)

    private var overlayView: TranslationOverlayView? = null
    private var toolbar: LinearLayout? = null
    private var showingOriginal = false
    private var renderBlocks: List<RenderBlock> = emptyList()
    private var currentTarget: AppLanguage = AppLanguage.ARABIC

    val isShowing: Boolean get() = toolbar != null

    fun show(
        blocks: List<TranslatedBlock>,
        target: AppLanguage,
        screenWidth: Int,
        screenHeight: Int,
        opacity: Float,
        fontMode: FontSizeMode,
    ) {
        hide()
        currentTarget = target
        showingOriginal = false
        lastW = screenWidth
        lastH = screenHeight
        renderBlocks = buildRenderBlocks(blocks, screenWidth, screenHeight, opacity, fontMode)
        addOverlay(screenWidth, screenHeight)
        addToolbar()
        callbacks.onOverlayShown()
    }

    private fun buildRenderBlocks(
        blocks: List<TranslatedBlock>,
        screenWidth: Int,
        screenHeight: Int,
        opacity: Float,
        fontMode: FontSizeMode,
    ): List<RenderBlock> {
        val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG or TextPaint.SUBPIXEL_TEXT_FLAG).apply {
            // System sans-serif: on all Android versions it falls back to Noto Arabic/Cyrillic glyphs
            // with correct Arabic shaping.
            typeface = Typeface.create("sans-serif", Typeface.NORMAL)
        }
        val padH = 3f * density
        val lineHeights = BlockLayoutCalculator.harmonizedLineHeights(
            blocks.map { it.block.boundingBox.height().toFloat() }, blocks.map { it.block.lineCount },
        )
        return blocks.mapIndexedNotNull { i, tb ->
            val text = tb.translatedText?.takeIf { it.isNotBlank() } ?: return@mapIndexedNotNull null
            val rtl = AppLanguage.isRtlLanguage(tb.targetLanguage)
            val card = !tb.style.sampledReliably
            val bgOpaque = tb.style.backgroundColor
            val bg = ColorAnalyzer.withAlpha(bgOpaque, if (card) minOf(opacity, 0.92f) else opacity)
            val (layout, rect) = calculator.layout(
                text, tb.block.boundingBox, tb.block.lineCount, rtl, fontMode, paint,
                tb.style.textColor, screenWidth, screenHeight, lineHeights[i],
            )
            val textLeft = if (rtl) rect.right - padH - layout.width else rect.left + padH
            val textTop = rect.top + (rect.height() - layout.height) / 2f
            RenderBlock(RectF(rect), layout, textLeft, textTop, bg, card)
        }
    }

    private fun addOverlay(w: Int, h: Int) {
        val view = TranslationOverlayView(context) { callbacks.onClose() }
        view.setBlocks(renderBlocks)
        try {
            windowManager.addView(view, OverlayWindows.params(w, h, touchable = true))
            overlayView = view
        } catch (e: Exception) {
            Logx.w("Could not add translation overlay", e)
        }
    }

    private fun removeOverlay() {
        overlayView?.let { runCatching { windowManager.removeViewImmediate(it) } }
        overlayView = null
    }

    // ---- control bar ----

    private fun addToolbar() {
        val bar = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            val pad = (6 * density).toInt()
            setPadding(pad, pad, pad, pad)
            background = GradientDrawable().apply {
                cornerRadius = 24 * density
                setColor(0xEE202124.toInt())
            }
            elevation = 6 * density
        }
        fillMainButtons(bar)
        val params = OverlayWindows.params(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT,
            touchable = true, gravity = Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL,
        ).apply { y = (72 * density).toInt() }
        try {
            windowManager.addView(bar, params)
            toolbar = bar
        } catch (e: Exception) {
            Logx.w("Could not add toolbar", e)
        }
    }

    private fun fillMainButtons(bar: LinearLayout) {
        bar.removeAllViews()
        bar.addView(button("✕", "Close translation") { callbacks.onClose() })
        bar.addView(button("↻", "Translate again") { callbacks.onRetranslate() })
        bar.addView(button("🌐 ${currentTarget.shortLabel}", "Change target language") { fillLanguageButtons(bar) })
        bar.addView(
            button(if (showingOriginal) "Translation" else "Original", "Show original or translation") {
                toggleOriginal()
                toolbar?.let { fillMainButtons(it) }
            }
        )
    }

    private fun fillLanguageButtons(bar: LinearLayout) {
        bar.removeAllViews()
        bar.addView(button("‹", "Back") { fillMainButtons(bar) })
        for (lang in AppLanguage.entries) {
            bar.addView(button(lang.nativeName, lang.englishName, selected = lang == currentTarget) {
                currentTarget = lang
                fillMainButtons(bar)
                callbacks.onTargetLanguageSelected(lang)
            })
        }
    }

    private fun button(label: String, description: String, selected: Boolean = false, onClick: () -> Unit) =
        TextView(context).apply {
            text = label
            contentDescription = description
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            minWidth = (44 * density).toInt()
            minHeight = (40 * density).toInt()
            val p = (10 * density).toInt()
            setPadding(p, 0, p, 0)
            background = GradientDrawable().apply {
                cornerRadius = 20 * density
                setColor(if (selected) 0xFF1A73E8.toInt() else Color.TRANSPARENT)
            }
            isClickable = true
            setOnClickListener { onClick() }
            post { logBounds(this, description) }
            layoutParams = LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT,
            ).apply { marginStart = (2 * density).toInt(); marginEnd = (2 * density).toInt() }
        }

    private fun logBounds(v: View, name: String) {
        val loc = IntArray(2)
        v.getLocationOnScreen(loc)
        Logx.d("UI_BOUNDS $name ${loc[0] + v.width / 2} ${loc[1] + v.height / 2}")
    }

    /** "Original" removes the painted translations (and lets touches reach the app again). */
    private fun toggleOriginal() {
        showingOriginal = !showingOriginal
        if (showingOriginal) {
            removeOverlay()
        } else {
            // Re-add in z-order: translations, control bar, then the bubble on top.
            removeToolbar()
            addOverlay(lastW, lastH)
            addToolbar()
            callbacks.onOverlayShown()
        }
    }

    private var lastW = 0
    private var lastH = 0

    private fun removeToolbar() {
        toolbar?.let { runCatching { windowManager.removeViewImmediate(it) } }
        toolbar = null
    }

    /** Removes everything (used before capturing so our windows are not in the screenshot). */
    fun hide() {
        removeOverlay()
        removeToolbar()
    }
}
