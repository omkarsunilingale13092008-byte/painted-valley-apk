name: Build Painted Valley Android APK

on:
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout your GitHub repository (with patch files)
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Setup Java JDK 21 (Required for Android Gradle)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3.2.2

      - name: Clone Painted Valley from patch.gg
        run: |
          git clone https://git.patch.gg/blendi/painted-valley.git game
          cp touch-joystick.js game/src/touch-joystick.js || true
          cp patch-mobile.mjs game/patch-mobile.mjs || true
          cp touch-joystick.js game/touch-joystick.js || true

      - name: Apply Transparent Left Joystick & Moto G45 Fix
        run: |
          cd game
          node patch-mobile.mjs || node patch-mobile.mjs.js || echo "patching..."
          npm install
          npm run build || npm run build:mobile || vite build || npx vite build

      - name: Wrap dist/ as Android APK with Capacitor
        run: |
          cd game
          npm install @capacitor/core @capacitor/cli @capacitor/android --save
          npx cap add android || true
          npx cap copy android || true
          mkdir -p dist
          ls -la dist || ls -la

      - name: Build APK with Gradle
        run: |
          cd game/android || cd game/android/app || cd game
          chmod +x gradlew || chmod +x ../gradlew || true
          ./gradlew assembleDebug || ../gradlew assembleDebug || ../../gradlew assembleDebug || gradle assembleDebug
          find . -name "*.apk" -type f

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Painted-Valley-Android-APK
          path: |
            **/*.apk
            game/**/*.apk
            **/app/build/outputs/**/*.apk
