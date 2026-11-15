# Painted Valley — Android APK Builder (with Transparent Left Joystick & Moto G45 Fix)

This kit turns [`blendi/painted-valley`](https://patch.gg/blendi/painted-valley) into an installable **Android APK** with:
1. **A Transparent Left Virtual Joystick** (`touch-joystick.js`) that feeds movement (`move.x`, `move.y`) and auto-sprint directly into `src/figure/input.js`.
2. **Right-Screen Touch Camera Look** + transparent quick-action buttons (`JUMP`, `VIEW`, `SUN`).
3. **Moto G45 (Snapdragon 6s Gen 3 / Adreno 619) WebGL2 Crash Fix**: Defaults `quality` to `'low'` (`4096px` mountain backdrop instead of `12288px`, `512px` clouds instead of `2048px`, `0` MSAA samples, `0.45` grass density, and capped `1.25x` pixel ratio) so the Adreno 619 GPU loads the valley in ~3 seconds without running out of VRAM or timing out.

## How to Build & Download Your APK on GitHub (No PC Required)

1. Create a **new repository** on GitHub (e.g., `painted-valley-apk`).
2. Extract this ZIP and upload its 3 files to the root of your repository, keeping the folder structure:
   - `.github/workflows/build-apk.yml`
   - `touch-joystick.js`
   - `patch-mobile.mjs`
3. Open the **Actions** tab in your GitHub repository.
4. Select **Build Painted Valley Android APK** and tap **Run workflow**.
5. Wait ~3 minutes for the build to finish, then scroll down to **Artifacts** at the bottom of the workflow run and tap **`Painted-Valley-Android-APK`** to download your `.apk`!
