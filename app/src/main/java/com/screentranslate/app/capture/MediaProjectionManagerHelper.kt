package com.screentranslate.app.capture

import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionConfig
import android.media.projection.MediaProjectionManager
import android.os.Build

/** Wraps the official system screen-capture consent flow. */
object MediaProjectionManagerHelper {

    private fun manager(context: Context) = context.getSystemService(MediaProjectionManager::class.java)

    /**
     * Consent intent. On Android 14+ we ask for the whole default display so the
     * "single app" option (which would hide other apps' text) is not offered.
     */
    fun createConsentIntent(context: Context): Intent =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            manager(context).createScreenCaptureIntent(MediaProjectionConfig.createConfigForDefaultDisplay())
        } else {
            manager(context).createScreenCaptureIntent()
        }

    /**
     * Must be called from the running foreground service (Android 14 requires the
     * mediaProjection foreground service to be started before this call). A consent
     * result can be used exactly once.
     */
    fun getProjection(context: Context, resultCode: Int, data: Intent): MediaProjection? =
        manager(context).getMediaProjection(resultCode, data)
}
