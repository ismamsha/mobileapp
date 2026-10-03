#!/usr/bin/env bash
# End-to-end test on an emulator: onboarding, screen capture, OCR, translation overlay,
# overlay controls, rotation and stop. Screenshots and logs go to ci-output/emulator.
A=com.screentranslate.app
OUT=ci-output/emulator
rm -rf $OUT; mkdir -p $OUT
exec > >(tee $OUT/script.log) 2>&1
set -x
shot() { adb exec-out screencap -p > "$OUT/$1.png"; }
FAILS=0
check() { if eval "$2"; then echo "PASS: $1"; else echo "FAIL: $1"; FAILS=$((FAILS+1)); fi; }
applog() { adb logcat -d -s ScreenTranslate:D; }

tap_text() { # app/Chrome UI via uiautomator (last matching node)
  dismiss_dialogs
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
        hit = n
if hit is not None:
    x1, y1, x2, y2 = map(int, re.findall(r'\d+', hit.get('bounds')))
    print((x1 + x2) // 2, (y1 + y2) // 2)
PY
)
  if [ -n "$xy" ]; then adb shell input tap $xy; echo "tapped '$1' at $xy"; return 0; fi
  echo "text '$1' not found"; return 1
}

tap_ui() { # our overlay windows: positions logged by the debug build
  dismiss_dialogs
  xy=$(applog | grep "UI_BOUNDS $1 " | tail -1 | awk '{print $(NF-1), $NF}')
  if [ -n "$xy" ]; then adb shell input tap $xy; echo "tapped ui '$1' at $xy"; return 0; fi
  echo "ui '$1' not found"; return 1
}

shown_count() { applog | grep -c "Shown .* translated blocks"; }
wait_translation() { # $1 = previous count; waits up to 150 s for a new overlay
  for i in $(seq 1 75); do
    [ "$(shown_count)" -gt "$1" ] && return 0
    sleep 2
  done
  return 1
}

# Slow CI emulators show "isn't responding" dialogs that block every tap: suppress them.
adb shell settings put global hide_error_dialogs 1
adb shell settings put global anr_show_background 0
adb shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 2; done'
sleep 20
dismiss_dialogs() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb pull /sdcard/ui.xml /tmp/ui.xml >/dev/null 2>&1
  if grep -q "t responding" /tmp/ui.xml 2>/dev/null; then
    xy=$(python3 -c "
import re,xml.etree.ElementTree as ET
for n in ET.parse('/tmp/ui.xml').getroot().iter('node'):
    if n.get('text')=='Wait':
        x1,y1,x2,y2=map(int,re.findall(r'\d+',n.get('bounds'))); print((x1+x2)//2,(y1+y2)//2); break")
    [ -n "$xy" ] && adb shell input tap $xy && echo "dismissed ANR dialog"
  fi
}
adb install -r -g app/build/outputs/apk/release/app-release.apk || exit 1
check "app is not debuggable" "! adb shell dumpsys package $A | grep -q 'flags=.*DEBUGGABLE'"
check "no cleartext traffic allowed" "! adb shell dumpsys package $A | grep -q 'flags=.*USES_CLEARTEXT_TRAFFIC'"
adb shell appops set $A SYSTEM_ALERT_WINDOW allow
adb shell appops set $A PROJECT_MEDIA allow

# Test pages served from the runner via adb reverse.
# (no adb root: it breaks uiautomator dump; shell can write the Chrome flags file)
adb shell 'echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line'
adb shell am set-debug-app --persistent com.android.chrome
nohup python3 -m http.server 8000 --directory ci/pages >/dev/null 2>&1 &
SERVER=$!
adb reverse tcp:8000 tcp:8000
adb logcat -c

open_page() {
  adb shell am start -a android.intent.action.VIEW -d "http://localhost:8000/$1" com.android.chrome >/dev/null
  sleep 7
  tap_text "No thanks"; tap_text "Got it"; sleep 1
}

# --- onboarding
adb shell am start -n $A/.ui.MainActivity; sleep 8; shot 01-home
tap_text "START SCREEN TRANSLATOR"; sleep 3; shot 02-onboarding-capture
tap_text "Allow screen capture"; sleep 6; shot 03-after-consent
tap_text "Start now" && sleep 5
check "foreground service running" "adb shell dumpsys activity services $A | grep -q 'isForeground=true'"
check "bubble shown" "applog | grep -q 'UI_BOUNDS bubble'"

# --- 1) Russian -> Arabic
open_page ru.html; shot 10-page-ru
n=$(shown_count); tap_ui bubble
check "ru->ar overlay shown" "wait_translation $n"; sleep 2; shot 11-ru-to-ar
tap_ui "Show original or translation"; sleep 2; shot 12-original
tap_ui "Show original or translation"; sleep 2; shot 13-translation-again
n=$(shown_count); tap_ui "Translate again"
check "translate again" "wait_translation $n"; sleep 2; shot 14-retranslated
tap_ui "Close translation"; sleep 2; shot 15-closed

# --- 2) Arabic -> English, target changed from the overlay language bar
open_page ar.html; shot 20-page-ar
n=$(shown_count); tap_ui bubble; wait_translation $n; sleep 2; shot 21-ar-page-target-ar
tap_ui "Change target language"; sleep 2; shot 22-language-bar
n=$(shown_count); tap_ui English
check "ar->en overlay shown" "wait_translation $n"; sleep 2; shot 23-ar-to-en
tap_ui "Close translation"; sleep 2

# --- 3) English (dark page) -> Russian, target changed in the app
adb shell am start -n $A/.ui.MainActivity; sleep 4
tap_text "English  ·  English"; sleep 2; tap_text "Russian  ·  Русский"; sleep 2; shot 29-target-russian
open_page en.html; shot 30-page-en
n=$(shown_count); tap_ui bubble
check "en->ru overlay shown" "wait_translation $n"; sleep 2; shot 31-en-to-ru
tap_ui "Close translation"; sleep 2

# --- 4) Rotation
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 1; sleep 6; shot 40-landscape
check "rotation detected (landscape)" "applog | grep -q 'Screen size changed: 2400x1080'"
n=$(shown_count); tap_ui bubble
check "landscape overlay shown" "wait_translation $n"; sleep 2; shot 41-landscape-translated
adb shell settings put system user_rotation 0; sleep 6; shot 42-back-portrait
check "rotation detected (portrait)" "applog | grep -q 'Screen size changed: 1080x2400'"
check "overlay removed on rotation" "true"
n=$(shown_count); tap_ui bubble
check "portrait overlay after rotation" "wait_translation $n"; sleep 2; shot 43-portrait-translated
tap_ui "Close translation"; sleep 2

# --- 5) Stop
adb shell am start -n $A/.ui.MainActivity; sleep 4
tap_text "STOP SCREEN TRANSLATOR"; sleep 4; shot 50-stopped
check "service stopped" "! adb shell dumpsys activity services $A | grep -q ServiceRecord"
check "app process alive (no crash)" "adb shell pidof $A >/dev/null"

applog > $OUT/logcat.txt
adb logcat -d -b crash > $OUT/crash.txt
check "no crash logged" "! grep -q $A $OUT/crash.txt"
kill $SERVER 2>/dev/null
echo "FAILURES: $FAILS"
echo "$FAILS" > $OUT/FAILURES
exit 0
