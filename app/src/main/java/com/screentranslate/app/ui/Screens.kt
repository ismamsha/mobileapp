package com.screentranslate.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.screentranslate.app.BuildConfig
import com.screentranslate.app.model.AppLanguage
import com.screentranslate.app.service.ServiceState
import com.screentranslate.app.settings.FontSizeMode
import com.screentranslate.app.settings.OcrMode
import com.screentranslate.app.util.DeviceUtils

@Composable
fun AppScreens(
    screen: Screen,
    vm: AppViewModel,
    activity: MainActivity,
    navigate: (Screen) -> Unit,
    back: () -> Unit,
) {
    when (screen) {
        Screen.HOME -> HomeScreen(vm, activity, navigate)
        Screen.ONBOARDING_OVERLAY -> OverlayStepScreen(activity, navigate, back)
        Screen.ONBOARDING_CAPTURE -> CaptureStepScreen(activity, back)
        Screen.SETTINGS -> SettingsScreen(vm, navigate, back)
        Screen.MODELS -> ModelManagerScreen(vm, back)
        Screen.PRIVACY -> TextPage("Privacy", back, PRIVACY_TEXT)
        Screen.ABOUT -> TextPage("About", back, ABOUT_TEXT)
        Screen.XIAOMI_HELP -> XiaomiHelpScreen(activity, back)
    }
}

// ------------------------------------------------------------------ scaffolding

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun Page(
    title: String,
    back: (() -> Unit)?,
    actions: @Composable () -> Unit = {},
    content: @Composable () -> Unit,
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title, fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    if (back != null) {
                        IconButton(onClick = back) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                },
                actions = { actions() },
            )
        },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 8.dp),
        ) {
            content()
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(top = 20.dp, bottom = 6.dp),
    )
}

@Composable
private fun CheckLine(text: String) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
        Icon(Icons.Filled.Check, null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(10.dp))
        Text(text, style = MaterialTheme.typography.bodyMedium)
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun NavRow(icon: ImageVector, label: String, onClick: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.width(16.dp))
        Text(label, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun <T> RadioGroup(options: List<T>, selected: T, label: (T) -> String, enabled: Boolean = true, onSelect: (T) -> Unit) {
    Column {
        for (o in options) {
            Row(
                Modifier
                    .fillMaxWidth()
                    .selectable(selected = o == selected, enabled = enabled, role = Role.RadioButton) { onSelect(o) }
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                RadioButton(selected = o == selected, onClick = null, enabled = enabled)
                Spacer(Modifier.width(12.dp))
                Text(label(o), style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}

@Composable
private fun LanguagePicker(selected: AppLanguage, onSelect: (AppLanguage) -> Unit) {
    var open by remember { mutableStateOf(false) }
    Box {
        OutlinedButton(
            onClick = { open = true },
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(14.dp),
        ) {
            Text(
                "${selected.englishName}  ·  ${selected.nativeName}",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
            )
            Icon(Icons.Filled.ArrowDropDown, contentDescription = "Choose language")
        }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            for (lang in AppLanguage.entries) {
                DropdownMenuItem(
                    text = { Text("${lang.englishName}  ·  ${lang.nativeName}") },
                    onClick = {
                        open = false
                        onSelect(lang)
                    },
                )
            }
        }
    }
}

// ------------------------------------------------------------------ home

@Composable
private fun HomeScreen(vm: AppViewModel, activity: MainActivity, navigate: (Screen) -> Unit) {
    val settings by vm.settings.collectAsStateWithLifecycle()
    val running by ServiceState.running.collectAsStateWithLifecycle()
    val message by ServiceState.message.collectAsStateWithLifecycle()
    val bubbleBlocked by ServiceState.bubbleBlocked.collectAsStateWithLifecycle()
    val tessProgress by vm.tessProgress.collectAsStateWithLifecycle()

    Page(
        title = "MuinScreenTranslator",
        back = null,
        actions = {
            IconButton(onClick = { navigate(Screen.SETTINGS) }) { Icon(Icons.Filled.Settings, "Settings") }
        },
    ) {
        SectionTitle("Target language")
        LanguagePicker(settings.targetLanguage) { vm.setTarget(it) }

        Spacer(Modifier.height(12.dp))
        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)) {
            Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                InfoRow("OCR", if (settings.ocrMode == OcrMode.AUTOMATIC) "Automatic" else settings.ocrMode.label)
                InfoRow("Translation", "On-device")
                InfoRow("Source language", if (settings.autoDetectSource) "Auto detect" else settings.sourceLanguage.englishName)
            }
        }

        Spacer(Modifier.height(20.dp))
        if (running) {
            Button(
                onClick = { activity.onStopPressed() },
                modifier = Modifier.fillMaxWidth().height(64.dp),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
            ) { Text("STOP SCREEN TRANSLATOR", fontSize = 17.sp, fontWeight = FontWeight.Bold) }
            Text(
                if (settings.showBubble) "Running. Open any app and tap the floating bubble to translate."
                else "Running. Use \"Translate\" in the notification to translate the screen.",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 8.dp),
            )
        } else {
            Button(
                onClick = { activity.onStartPressed() },
                modifier = Modifier.fillMaxWidth().height(64.dp),
                shape = RoundedCornerShape(18.dp),
            ) { Text("START SCREEN TRANSLATOR", fontSize = 17.sp, fontWeight = FontWeight.Bold) }
        }

        message?.let { MessageCard(it) }
        if (bubbleBlocked && running) {
            MessageCard("The floating bubble was blocked by the system.", action = "How to fix") { navigate(Screen.XIAOMI_HELP) }
        }
        tessProgress?.let {
            Spacer(Modifier.height(12.dp))
            Text("Downloading text recognition data (${it.language})…", style = MaterialTheme.typography.bodySmall)
            LinearProgressIndicator(progress = { it.fraction }, modifier = Modifier.fillMaxWidth().padding(top = 4.dp))
        }

        Spacer(Modifier.height(20.dp))
        CheckLine("Private — screenshots are not saved")
        CheckLine("Works over other apps")
        CheckLine("Russian / English / Arabic")

        if (DeviceUtils.isXiaomiFamily) {
            Spacer(Modifier.height(12.dp))
            MessageCard(
                "Xiaomi / Redmi / POCO: MIUI needs a few extra switches so the bubble can appear and stay running.",
                action = "Show me how",
            ) { navigate(Screen.XIAOMI_HELP) }
        }

        Spacer(Modifier.height(12.dp))
        HorizontalDivider()
        NavRow(Icons.Filled.Settings, "Settings") { navigate(Screen.SETTINGS) }
        NavRow(Icons.Filled.Info, "Offline translation models") { navigate(Screen.MODELS) }
        NavRow(Icons.Filled.Lock, "Privacy") { navigate(Screen.PRIVACY) }
    }
}

@Composable
private fun MessageCard(text: String, action: String? = null, onAction: (() -> Unit)? = null) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
    ) {
        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
            Icon(Icons.Filled.Warning, null, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(text, style = MaterialTheme.typography.bodyMedium)
                if (action != null && onAction != null) {
                    TextButton(onClick = onAction, modifier = Modifier.padding(top = 2.dp)) { Text(action) }
                }
            }
        }
    }
}

// ------------------------------------------------------------------ onboarding

@Composable
private fun StepHeader(step: Int, title: String) {
    Text("Step $step of 2", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
    Spacer(Modifier.height(6.dp))
    Text(title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.SemiBold)
    Spacer(Modifier.height(14.dp))
}

@Composable
private fun OverlayStepScreen(activity: MainActivity, navigate: (Screen) -> Unit, back: () -> Unit) {
    val denied by activity.overlayDeniedOnce
    Page("Set up", back) {
        StepHeader(1, "Allow MuinScreenTranslator to appear over other apps")
        Text(
            "This lets the small translate bubble float above WhatsApp, Telegram, Chrome and other apps, " +
                "and lets MuinScreenTranslator draw translations on top of the original text.\n\n" +
                "MuinScreenTranslator never taps, types or changes anything inside other apps.",
            style = MaterialTheme.typography.bodyLarge,
        )
        Spacer(Modifier.height(24.dp))
        Button(onClick = { activity.openOverlaySettings() }, modifier = Modifier.fillMaxWidth().height(56.dp)) {
            Text("Open settings")
        }
        Spacer(Modifier.height(8.dp))
        Text(
            "In the list, find MuinScreenTranslator and turn on \"Allow display over other apps\", then press back.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        if (denied) {
            MessageCard(
                "The permission is still off. MuinScreenTranslator can't show the bubble or translations without it.",
                action = if (DeviceUtils.isXiaomiFamily) "Xiaomi help" else null,
                onAction = if (DeviceUtils.isXiaomiFamily) ({ navigate(Screen.XIAOMI_HELP) }) else null,
            )
        } else if (DeviceUtils.isXiaomiFamily) {
            TextButton(onClick = { navigate(Screen.XIAOMI_HELP) }) { Text("Using a Xiaomi phone? See extra steps") }
        }
    }
}

@Composable
private fun CaptureStepScreen(activity: MainActivity, back: () -> Unit) {
    Page("Set up", back) {
        StepHeader(2, "Allow screen capture")
        Text(
            "To find the text you want translated, MuinScreenTranslator takes a picture of the screen each time you tap the bubble.\n\n" +
                "Android will show its own screen-capture dialog. Choose \"Entire screen\" if you are asked, then tap \"Start now\".",
            style = MaterialTheme.typography.bodyLarge,
        )
        Spacer(Modifier.height(16.dp))
        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
            Row(Modifier.padding(14.dp)) {
                Icon(Icons.Filled.Lock, null)
                Spacer(Modifier.width(10.dp))
                Text(
                    "Screen images are processed locally and are not saved. They are never uploaded and are cleared from memory right after translation.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            }
        }
        Spacer(Modifier.height(24.dp))
        Button(onClick = { activity.beginCapture() }, modifier = Modifier.fillMaxWidth().height(56.dp)) {
            Text("Allow screen capture")
        }
        Spacer(Modifier.height(8.dp))
        Text(
            "Android shows a notification and a status-bar icon while capture is allowed. Tap Stop in the notification or in the app at any time.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

// ------------------------------------------------------------------ settings

@Composable
private fun SettingsScreen(vm: AppViewModel, navigate: (Screen) -> Unit, back: () -> Unit) {
    val s by vm.settings.collectAsStateWithLifecycle()
    Page("Settings", back) {
        SectionTitle("Target language")
        RadioGroup(AppLanguage.entries, s.targetLanguage, { "${it.englishName} · ${it.nativeName}" }) { vm.setTarget(it) }

        SectionTitle("Source language")
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Auto detect source language", style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
            Switch(checked = s.autoDetectSource, onCheckedChange = { vm.setAutoDetect(it) })
        }
        if (!s.autoDetectSource) {
            RadioGroup(AppLanguage.entries, s.sourceLanguage, { it.englishName }) { vm.setSource(it) }
        }

        SectionTitle("OCR language mode")
        RadioGroup(OcrMode.entries, s.ocrMode, { it.label }) { vm.setOcrMode(it) }
        Text(s.ocrMode.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)

        SectionTitle("Translation overlay opacity")
        var opacity by remember(s.overlayOpacity) { mutableFloatStateOf(s.overlayOpacity) }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Slider(
                value = opacity,
                onValueChange = { opacity = it },
                onValueChangeFinished = { vm.setOpacity(opacity) },
                valueRange = 0.5f..1f,
                modifier = Modifier.weight(1f),
            )
            Text("${(opacity * 100).toInt()}%", modifier = Modifier.width(48.dp), textAlign = TextAlign.End)
        }

        SectionTitle("Translation font size")
        RadioGroup(FontSizeMode.entries, s.fontSize, { it.label }) { vm.setFontSize(it) }

        SectionTitle("Floating bubble")
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("Show floating bubble", style = MaterialTheme.typography.bodyLarge)
                Text(
                    "When off, use \"Translate\" in the notification.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Switch(checked = s.showBubble, onCheckedChange = { vm.setShowBubble(it) })
        }

        Spacer(Modifier.height(12.dp))
        HorizontalDivider()
        NavRow(Icons.Filled.Info, "Offline translation model manager") { navigate(Screen.MODELS) }
        NavRow(Icons.Filled.Lock, "Privacy") { navigate(Screen.PRIVACY) }
        NavRow(Icons.Filled.Warning, "Xiaomi / MIUI help") { navigate(Screen.XIAOMI_HELP) }
        NavRow(Icons.Filled.Info, "About") { navigate(Screen.ABOUT) }
    }
}

// ------------------------------------------------------------------ models

@Composable
private fun ModelManagerScreen(vm: AppViewModel, back: () -> Unit) {
    val models by vm.translationModels.collectAsStateWithLifecycle()
    val installed by vm.tessInstalled.collectAsStateWithLifecycle()
    val progress by vm.tessProgress.collectAsStateWithLifecycle()
    val message by vm.message.collectAsStateWithLifecycle()
    LaunchedEffect(Unit) { vm.refreshModels() }

    Page("Offline models", back) {
        Text(
            "Everything runs on this phone. Each language is downloaded once (Wi-Fi recommended) and then works offline.",
            style = MaterialTheme.typography.bodyMedium,
        )
        message?.let { MessageCard(it, "OK") { vm.clearMessage() } }

        SectionTitle("Translation models (about 30 MB each)")
        for (lang in AppLanguage.entries) {
            val state = models[lang.code] ?: ModelState.UNKNOWN
            ModelRow(
                title = lang.englishName,
                subtitle = when (state) {
                    ModelState.DOWNLOADED -> "Downloaded"
                    ModelState.DOWNLOADING -> "Downloading…"
                    ModelState.NOT_DOWNLOADED -> "Not downloaded"
                    ModelState.UNKNOWN -> "Checking…"
                },
                busy = state == ModelState.DOWNLOADING,
                progress = null,
                downloaded = state == ModelState.DOWNLOADED,
                // ML Kit keeps English permanently as the pivot language.
                canDelete = lang != AppLanguage.ENGLISH,
                onDownload = { vm.downloadModel(lang) },
                onDelete = { vm.deleteModel(lang) },
            )
        }

        SectionTitle("Text recognition data (Tesseract, 1–4 MB each)")
        Text(
            "English text is read by ML Kit (built in). These files improve Russian and Arabic recognition; " +
                "they are downloaded automatically when needed.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        for (lang in AppLanguage.entries) {
            val code = lang.tesseractCode
            val isInstalled = code in installed
            val p = progress?.takeIf { it.language == code }
            ModelRow(
                title = lang.englishName,
                subtitle = when {
                    p != null -> "Downloading… ${(p.fraction * 100).toInt()}%"
                    isInstalled -> "Downloaded (${vm.ocrFileSize(lang) / 1024} KB)"
                    else -> "Not downloaded"
                },
                busy = p != null,
                progress = p?.fraction,
                downloaded = isInstalled,
                canDelete = true,
                onDownload = { vm.downloadOcr(lang) },
                onDelete = { vm.deleteOcr(lang) },
            )
        }
    }
}

@Composable
private fun ModelRow(
    title: String,
    subtitle: String,
    busy: Boolean,
    progress: Float?,
    downloaded: Boolean,
    canDelete: Boolean,
    onDownload: () -> Unit,
    onDelete: () -> Unit,
) {
    Column(Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Medium)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            when {
                busy -> CircularProgressIndicator(Modifier.size(24.dp), strokeWidth = 2.5.dp)
                downloaded && canDelete -> TextButton(onClick = onDelete) { Text("Delete") }
                downloaded -> Icon(Icons.Filled.Check, "Downloaded", tint = MaterialTheme.colorScheme.secondary)
                else -> OutlinedButton(onClick = onDownload) { Text("Download") }
            }
        }
        if (progress != null) {
            LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth().padding(top = 6.dp))
        }
    }
}

// ------------------------------------------------------------------ static pages

@Composable
private fun TextPage(title: String, back: () -> Unit, body: String) {
    Page(title, back) {
        Text(body, style = MaterialTheme.typography.bodyLarge)
    }
}

@Composable
private fun XiaomiHelpScreen(activity: MainActivity, back: () -> Unit) {
    Page("Xiaomi / MIUI help", back) {
        Text(
            "MIUI and HyperOS (Xiaomi, Redmi, POCO) add their own permission switches on top of Android. " +
                "If the bubble does not appear, or MuinScreenTranslator stops by itself, check these:",
            style = MaterialTheme.typography.bodyLarge,
        )
        SectionTitle("1. Display over other apps")
        Text(
            "Settings → Apps → Manage apps → MuinScreenTranslator → Other permissions →\n" +
                "• Display pop-up windows while running in the background → Allow\n" +
                "• Display pop-up windows / Display over other apps → Allow",
            style = MaterialTheme.typography.bodyMedium,
        )
        SectionTitle("2. Keep it running")
        Text(
            "Settings → Apps → Manage apps → MuinScreenTranslator →\n" +
                "• Autostart → On\n" +
                "• Battery saver → No restrictions\n\n" +
                "Optionally lock the app in Recents (swipe down on its card) so MIUI doesn't close it.",
            style = MaterialTheme.typography.bodyMedium,
        )
        SectionTitle("3. Notifications")
        Text(
            "Allow notifications for MuinScreenTranslator so you can see that it is running and use the Translate / Stop buttons.",
            style = MaterialTheme.typography.bodyMedium,
        )
        Spacer(Modifier.height(20.dp))
        Button(onClick = { DeviceUtils.openXiaomiPermissions(activity) }, modifier = Modifier.fillMaxWidth()) {
            Text("Open app permissions")
        }
        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = { activity.openOverlaySettings() }, modifier = Modifier.fillMaxWidth()) {
            Text("Open \"Display over other apps\"")
        }
        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = { runCatching { activity.startActivity(DeviceUtils.appDetailsIntent(activity)) } }, modifier = Modifier.fillMaxWidth()) {
            Text("Open app info (Autostart, Battery saver)")
        }
    }
}

private const val PRIVACY_TEXT = """Screen images are processed locally and are not saved.

• A screenshot is taken only when you tap the bubble (or "Translate" in the notification).
• It is kept in memory only while text is being recognized, then cleared.
• Screenshots are never written to the Gallery or to storage, and never uploaded.
• Text recognition (ML Kit, Tesseract) and translation (ML Kit) run on this phone.
• Recognized text is never logged. Translations are kept in a small in-memory cache that is cleared when the app closes.
• The internet is used only to download translation models and text-recognition language data once.
• You can stop screen capture at any time from the app or the notification."""

private val ABOUT_TEXT = """MuinScreenTranslator ${BuildConfig.VERSION_NAME}

Translates the text on your screen in place, over any app: tap the floating bubble and translations appear on top of the original text.

Languages: Russian, English and Arabic (target), plus automatic detection of other Latin-script languages as source.

Built with:
• Google ML Kit Text Recognition, Language Identification and on-device Translation
• Tesseract OCR (via Tesseract4Android) with tessdata_fast language data
• Jetpack Compose

Translations are machine generated and may contain mistakes."""
