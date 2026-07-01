# iOS Local Install

This project can be installed on your own iPhone from a Mac without EAS cloud builds. Keep the Expo / React Native app code; use Xcode only for the native iOS build and signing step.

## Current Assumptions

- Project path on Mac: any local folder named `fin-native`.
- Expo SDK: 52.
- Target: personal iPhone install, not App Store or TestFlight.
- Apple Developer Program is not required for this personal-device workflow.
- A Mac with full Xcode installed is required.

## One-Time Mac Setup

1. Install Xcode from the Mac App Store.
2. Open Xcode once and let it install required components.
3. In Xcode, sign in with your Apple Account:
   - Xcode > Settings > Accounts
4. Make sure command line tools point to full Xcode, not only Command Line Tools:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcrun --sdk iphoneos --show-sdk-path
```

The last command must print an iPhoneOS SDK path under `/Applications/Xcode.app`.

## First Local Build

From the project folder on the Mac:

```bash
npm install
npm run typecheck
npm test -- --runInBand
npm run ios:prebuild
npm run ios:device
```

If `npm run ios:device` asks for a device, choose your iPhone.

## Xcode Signing

If the CLI build cannot finish signing, open the generated workspace:

```bash
open ios/*.xcworkspace
```

Then in Xcode:

1. Select the app project.
2. Select the app target.
3. Open Signing & Capabilities.
4. Enable Automatically manage signing.
5. Select your Apple Account team.
6. Change Bundle Identifier if needed.

Recommended personal bundle identifier:

```text
com.lyc02.finapp
```

The current `app.json` value is:

```text
com.local.finapp
```

`com.local.finapp` can work locally, but a unique identifier is better if Xcode reports signing conflicts.

## iPhone Requirements

On the iPhone:

- Connect by USB for the first install.
- Trust the Mac when prompted.
- Enable Developer Mode if iOS asks for it.
- Keep the phone unlocked during build/install.

## Rebuilding After App Changes

For JavaScript / TypeScript changes only:

```bash
npm run ios:device
```

For native dependency or config changes, regenerate native files first:

```bash
npm run ios:prebuild
npm run ios:device
```

Examples of native/config changes:

- `app.json` iOS permissions
- package changes involving native modules
- `expo-camera`, `expo-av`, `expo-secure-store`, `react-native-quick-crypto`

## Clean Rebuild

Use this if CocoaPods or native files are in a bad state:

```bash
rm -rf ios
npx expo prebuild --platform ios --clean
npm run ios:device
```

If Pods are the only issue:

```bash
cd ios
pod install --repo-update
cd ..
npm run ios:device
```

## Do Not Upgrade Expo During Install Work

Do not run:

```bash
npm audit fix --force
npx expo upgrade
```

The app currently targets Expo SDK 52 with pinned compatible native versions. Upgrade only as a separate task after the iOS install flow is stable.

## Release Checklist For Personal Use

- PIN setup works.
- PIN unlock works after force-closing the app.
- Transaction data persists after restart.
- Receipt camera permission and capture work.
- Voice microphone permission and recording work.
- Face ID unlock works if enabled.
- `Dev: Reset All` appears only in development builds.
- `npx tsc --noEmit` passes.
- `npm test -- --runInBand` passes.

## Known Limitation

Free Apple Account installs are for personal use. They are not App Store distribution and are not a stable way to distribute to other users. For TestFlight or App Store, enroll in the Apple Developer Program.
