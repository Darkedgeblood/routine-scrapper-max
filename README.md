# routine-scrapper-max

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_XTDFVelbATbrwPU2qiKS8UgwpU9i)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Android updates

APK releases must be signed with the same private key every time. Create a release keystore once and keep a secure backup; losing it prevents future APKs from updating existing installs.

```powershell
keytool -genkeypair -v -keystore RoutineScrapperMax-release.jks -alias routine-scrapper-max -keyalg RSA -keysize 2048 -validity 10000
[Convert]::ToBase64String([IO.File]::ReadAllBytes('.\RoutineScrapperMax-release.jks')) | Set-Clipboard
```

In the GitHub repository, open **Settings → Secrets and variables → Actions** and add these repository secrets:

- `ANDROID_KEYSTORE_BASE64`: the Base64 value copied above
- `ANDROID_KEY_ALIAS`: `routine-scrapper-max`
- `ANDROID_STORE_PASSWORD`: the keystore password entered in `keytool`
- `ANDROID_KEY_PASSWORD`: the key password entered in `keytool`

The APK workflow intentionally stops if the signing key is unavailable instead of publishing an APK that cannot update the installed app. The current published APKs were signed with different temporary debug keys. Android cannot update those installs with a new key, so everyone on those builds must uninstall once before installing the first stable signed release. Future releases will install over the app normally.

The app checks GitHub Releases on launch and when it returns to the foreground. If Android notifications are allowed, it sends one notification for each new release; tapping it starts the APK download. Android then shows its installer confirmation, which the user must approve. Releases marked `Update urgency: critical` use an important update notice. To publish one, manually run **Actions → Build Android APK** and select **critical**. This is an in-app update flow, not a silent installation or a push service; a phone checks for updates when the app is opened/resumed.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
