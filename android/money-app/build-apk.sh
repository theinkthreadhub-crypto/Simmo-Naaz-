#!/usr/bin/env bash
# Builds the Money Tracker Android APK without Gradle or the full Android SDK.
#
# Needs (Ubuntu): openjdk, android-sdk-platform-23, aapt, dalvik-exchange, zipalign, apksigner
#   sudo apt-get install android-sdk-platform-23 aapt dalvik-exchange zipalign apksigner
#
# Usage:
#   ./build-apk.sh                                   # uses https://mentra.inkthreadhub.in/money
#   START_URL=https://example.com/money ./build-apk.sh
#   KEYSTORE=/path/release.jks KEY_ALIAS=money KEYSTORE_PASS=... ./build-apk.sh
#
# Keep the same keystore for every build, otherwise phones must uninstall
# the old app before installing a new version.
set -euo pipefail

cd "$(dirname "$0")"
START_URL="${START_URL:-https://mentra.inkthreadhub.in/money}"
ANDROID_JAR="${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}"
OUT="${OUT:-build}"
KEYSTORE="${KEYSTORE:-$HOME/.android/money-tracker.jks}"
KEY_ALIAS="${KEY_ALIAS:-money}"
KEYSTORE_PASS="${KEYSTORE_PASS:-money-tracker}"

rm -rf "$OUT"
mkdir -p "$OUT/gen" "$OUT/classes"

# Build-time config.
mkdir -p "$OUT/gen/in/inkthreadhub/money"
cat > "$OUT/gen/in/inkthreadhub/money/Config.java" <<EOF
package in.inkthreadhub.money;
final class Config {
    static final String START_URL = "${START_URL}";
    private Config() {}
}
EOF

echo "› Resources (R.java)"
aapt package -f -m -J "$OUT/gen" -M AndroidManifest.xml -S res -I "$ANDROID_JAR"

echo "› Compile Java"
javac -nowarn -source 8 -target 8 -bootclasspath "$ANDROID_JAR" -classpath "$ANDROID_JAR" \
  -d "$OUT/classes" $(find src "$OUT/gen" -name '*.java') 2>&1 | grep -v "bootstrap classpath\|source value 8\|target value 8\|To suppress warnings\|^warning: \[options\]\|^[0-9] warnings\?$" || true
test -f "$OUT/classes/in/inkthreadhub/money/MainActivity.class"

echo "› Dex"
dalvik-exchange --dex --min-sdk-version=21 --output="$OUT/classes.dex" "$OUT/classes"

echo "› Package"
aapt package -f -M AndroidManifest.xml -S res -I "$ANDROID_JAR" -F "$OUT/unsigned.apk"
(cd "$OUT" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

if [ ! -f "$KEYSTORE" ]; then
  echo "› Creating signing key at $KEYSTORE"
  mkdir -p "$(dirname "$KEYSTORE")"
  keytool -genkeypair -keystore "$KEYSTORE" -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass "$KEYSTORE_PASS" -keypass "$KEYSTORE_PASS" \
    -dname "CN=Money Tracker, O=Inkthread Hub, C=IN" >/dev/null 2>&1
fi

echo "› Sign"
apksigner sign --ks "$KEYSTORE" --ks-key-alias "$KEY_ALIAS" \
  --ks-pass "pass:$KEYSTORE_PASS" --key-pass "pass:$KEYSTORE_PASS" \
  --min-sdk-version 21 --out "$OUT/MoneyTracker.apk" "$OUT/aligned.apk"
apksigner verify "$OUT/MoneyTracker.apk"

echo "✓ $OUT/MoneyTracker.apk  →  $START_URL"
