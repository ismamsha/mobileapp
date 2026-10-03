#!/usr/bin/env bash
# End-to-end smoke test on an emulator: onboarding, screen capture, OCR, translation overlay.
set -x
A=com.screentranslate.app
OUT=ci-output/emulator
mkdir -p $OUT
shot() { adb exec-out screencap -p > "$OUT/$1.png"; }

tap_text() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb pull /sdcard/ui.xml /tmp/ui.xml >/dev/null 2>&1
  xy=$(python3 - "$1" <<'PY'
import re, sys, xml.etree.ElementTree as ET
want = sys.argv[1]
try:
    root = ET.parse('/tmp/ui.xml').getroot()
except Exception:
    sys.exit(0)
for n in root.iter('node'):
    t = (n.get('text') or '') + '|' + (n.get('content-desc') or '')
    if want in t:
        x1, y1, x2, y2 = map(int, re.findall(r'\d+', n.get('bounds')))
        print((x1 + x2) // 2, (y1 + y2) // 2)
        break
PY
)
  if [ -n "$xy" ]; then adb shell input tap $xy; echo "tapped '$1' at $xy"; return 0; fi
  echo "text '$1' not found"; return 1
}

W=$(adb shell wm size | grep -o '[0-9]*x[0-9]*' | tail -1 | cut -dx -f1)
H=$(adb shell wm size | grep -o '[0-9]*x[0-9]*' | tail -1 | cut -dx -f2)
D=$(adb shell wm density | grep -o '[0-9]*' | tail -1)
BX=$(( W - (36 * D / 160) ))
BY=$(( H * 35 / 100 + (28 * D / 160) ))
tap_bubble() { adb shell input tap $BX $BY; }

wait_shots() { # name: screenshots while OCR/translation/model download runs
  sleep 8; shot "$1-a"; sleep 15; shot "$1-b"; sleep 25; shot "$1-c"; sleep 30; shot "$1-d"
}

adb install -r -g app/build/outputs/apk/debug/app-debug.apk || exit 1
adb shell appops set $A SYSTEM_ALERT_WINDOW allow
adb shell appops set $A PROJECT_MEDIA allow
adb logcat -c

adb shell am start -n $A/.ui.MainActivity; sleep 8; shot 01-home
tap_text "START SCREEN TRANSLATOR"; sleep 3; shot 02-onboarding-capture
tap_text "Allow screen capture"; sleep 5; shot 03-consent
tap_text "Start now" || tap_text "Start"; sleep 6; shot 04-running
adb shell dumpsys activity services $A | grep -i -E "ServiceRecord|isForeground|foregroundServiceType" | head > $OUT/service.txt

# 1) Russian screen -> Arabic (default target)
adb shell cmd locale set-app-locales com.android.settings --locales ru-RU
adb shell am force-stop com.android.settings
adb shell am start -a android.settings.SETTINGS; sleep 5; shot 10-settings-ru
tap_bubble; wait_shots 11-ru-to-ar
# Toggle Original
tap_text "Original"; sleep 2; shot 12-original-toggle
tap_text "Translation"; sleep 2
tap_text "Close translation" || tap_text "✕"; sleep 2

# 2) Arabic screen -> English (change target in the app)
adb shell am start -n $A/.ui.MainActivity; sleep 4
tap_text "Arabic  ·  العربية"; sleep 2; tap_text "English  ·  English"; sleep 2; shot 20-target-english
adb shell cmd locale set-app-locales com.android.settings --locales ar
adb shell am force-stop com.android.settings
adb shell am start -a android.settings.SETTINGS; sleep 5; shot 21-settings-ar
tap_bubble; wait_shots 22-ar-to-en
tap_text "Close translation"; sleep 1

# 3) English screen -> Russian
adb shell am start -n $A/.ui.MainActivity; sleep 4
tap_text "English  ·  English"; sleep 2; tap_text "Russian  ·  Русский"; sleep 2
adb shell cmd locale set-app-locales com.android.settings --locales en-US
adb shell am force-stop com.android.settings
adb shell am start -a android.settings.SETTINGS; sleep 5; shot 30-settings-en
tap_bubble; wait_shots 31-en-to-ru

# 4) Rotation
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 1; sleep 4
tap_text "Close translation"; sleep 1
tap_bubble; sleep 20; shot 40-landscape
adb shell settings put system user_rotation 0; sleep 3

adb logcat -d -s ScreenTranslate:* AndroidRuntime:E > $OUT/logcat.txt
adb logcat -d | grep -E "FATAL|$A|MediaProjection" | tail -400 > $OUT/logcat-filtered.txt
adb shell pidof $A > $OUT/pid.txt
exit 0
