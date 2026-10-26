# Android APK releases

The Android GitHub Actions workflow builds a signed APK and publishes it to [GitHub Releases](https://github.com/Darkedgeblood/routine-scrapper-max/releases). APK updates must use the same keystore each time. Keep a secure backup of the keystore; losing it prevents Android from updating installations signed with it.

## Configure signing

Create a release keystore once on a trusted computer. Keep the keystore and its passwords private and backed up:

```powershell
keytool -genkeypair -v -keystore RoutineScrapperMax-release.jks -alias routine-scrapper-max -keyalg RSA -keysize 2048 -validity 10000
[Convert]::ToBase64String([IO.File]::ReadAllBytes('.\RoutineScrapperMax-release.jks')) | Set-Clipboard
```

In the repository, open **Settings → Secrets and variables → Actions** and add these repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | The Base64 value copied from PowerShell |
| `ANDROID_KEY_ALIAS` | `routine-scrapper-max` |
| `ANDROID_STORE_PASSWORD` | The keystore password entered in `keytool` |
| `ANDROID_KEY_PASSWORD` | The key password entered in `keytool` |

Never commit the `.jks` file, its passwords, or the decoded Base64 value. The workflow stops if the signing secrets are missing.

## Build and publish

Merging to `main` runs the **Build Android APK** workflow and publishes a release. To mark an update as critical, run the workflow manually from **Actions → Build Android APK** and select **critical** for `update_urgency`.

The Android app checks GitHub Releases when it opens and returns to the foreground. It only offers major pointer versions (for example, `5.0`) by default; a release explicitly marked `critical` can also be offered between major versions. Normal minor APK releases do not trigger an update prompt or notification.

The APK loads the app website from Vercel, so website changes such as routine data and interface updates become available without reinstalling the APK. Changes to the native Android shell, permissions, or bundled plugins still need a new APK. Tapping an update notice downloads the APK, and Android asks the user to approve installation; updates are never installed silently.

## Existing installs signed with the old key

APKs signed with a different temporary debug key cannot be updated with the stable release key. Users on those legacy builds need to uninstall once before installing the first stable signed APK. Afterward, releases signed with the stable key can update in place.
