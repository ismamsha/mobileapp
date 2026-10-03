package com.screentranslate.app.util

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.provider.Settings

object DeviceUtils {

    val isXiaomiFamily: Boolean
        get() {
            val m = (Build.MANUFACTURER + " " + Build.BRAND).lowercase()
            return listOf("xiaomi", "redmi", "poco").any { it in m }
        }

    fun isOnline(context: Context): Boolean {
        val cm = context.getSystemService(ConnectivityManager::class.java) ?: return false
        val caps = cm.getNetworkCapabilities(cm.activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun overlaySettingsIntent(context: Context): Intent =
        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

    fun appDetailsIntent(context: Context): Intent =
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}"))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

    /**
     * Opens MIUI's "Other permissions" page when it exists, otherwise the standard
     * app details page. Nothing depends on MIUI being present.
     */
    fun openXiaomiPermissions(context: Context) {
        val miui = Intent("miui.intent.action.APP_PERM_EDITOR")
            .putExtra("extra_pkgname", context.packageName)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            context.startActivity(miui)
        } catch (_: Exception) {
            try {
                context.startActivity(appDetailsIntent(context))
            } catch (_: Exception) {
            }
        }
    }
}
