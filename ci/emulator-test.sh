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
hit = None
for n in root.iter('node'):
    t = (n.get('text') or '') + '|' + (n.get('content-desc') or '')
    if want in t:
        hit = n  # last match: buttons sit below headings with the same text
if hit is not None:
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', hit.get('bounds')))
    print((x1 + x2) // 2, (y1 + y2) // 2)
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

# Test pages served from the runner (Android Settings hides third-party overlays, so use Chrome).
(cd ci/pages && python3 -m http.server 8000 >/dev/null 2>&1 &)
adb reverse tcp:8000 tcp:8000
adb root >/dev/null 2>&1; sleep 3
adb shell 'echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line'
adb shell am set-debug-app --persistent com.android.chrome
open_page() {
  adb shell am start -a android.intent.action.VIEW -d "http://localhost:8000/$1" com.android.chrome >/dev/null
  sleep 8
  tap_text "No thanks" ; tap_text "Use without an account"; tap_text "Got it"; sleep 2
}
set_target() { # from current label to new label in the app's dropdown
  adb shell am start -n $A/.ui.MainActivity; sleep 4
  tap_text "$1"; sleep 2; tap_text "$2"; sleep 2
}

# 1) Russian page -> Arabic (default target)
open_page ru.html; shot 10-page-ru
tap_bubble; wait_shots 11-ru-to-ar
tap_text "Original"; sleep 2; shot 12-original-toggle
tap_text "Translation"; sleep 2; shot 13-translation-again
tap_text "Close translation"; sleep 2

# 2) Arabic page -> English
set_target "Arabic  ·  العربية" "English  ·  English"; shot 20-target-english
open_page ar.html; shot 21-page-ar
tap_bubble; wait_shots 22-ar-to-en
tap_text "Close translation"; sleep 1

# 3) English page (dark) -> Russian
set_target "English  ·  English" "Russian  ·  Русский"
open_page en.html; shot 30-page-en
tap_bubble; wait_shots 31-en-to-ru
# change language from the overlay bar
tap_text "Change target language"; sleep 2; shot 32-language-bar
tap_text "العربية"; sleep 20; shot 33-en-to-ar
tap_text "Close translation"; sleep 1

# 4) Rotation
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 1; sleep 5; shot 40-landscape-page
BX2=$(( H - (36 * D / 160) )); BY2=$(( W * 35 / 100 + (28 * D / 160) ))
adb shell input tap $BX2 $BY2; sleep 25; shot 41-landscape-translated
tap_text "Close translation"; sleep 1
adb shell settings put system user_rotation 0; sleep 4; shot 42-back-portrait

# 5) Stop from the app
adb shell am start -n $A/.ui.MainActivity; sleep 4
tap_text "STOP SCREEN TRANSLATOR"; sleep 3; shot 50-stopped
adb shell dumpsys activity services $A | grep -c ServiceRecord > $OUT/services-after-stop.txt

adb logcat -d -s ScreenTranslate:* AndroidRuntime:E > $OUT/logcat.txt
adb logcat -d | grep -E "FATAL|$A|MediaProjection" | tail -400 > $OUT/logcat-filtered.txt
adb shell pidof $A > $OUT/pid.txt
exit 0
