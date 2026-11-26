# NativeWebView — custom Capacitor plugin

Opens a hosted web module in a **second, isolated native WebView** with a two-way JS bridge.
The TypeScript side (interface, web fallback, registration) lives in
`src/app/core/hybrid/native-webview/`. This folder holds the native sources.

| File | Platform | What it shows |
| --- | --- | --- |
| `android/NativeWebViewPlugin.kt` | Android | `android.webkit.WebView`, `WebViewCompat.addWebMessageListener` (origin-scoped bridge), `shouldOverrideUrlLoading` allowlist, `shouldInterceptRequest` serving bundled assets, hardened `WebSettings`, back-button handling |
| `android/MainActivity.kt` | Android | Registering an app-local plugin before `super.onCreate()` |
| `ios/NativeWebViewPlugin.swift` | iOS | `WKWebView`, `WKScriptMessageHandler` with origin + main-frame checks, `WKNavigationDelegate` allowlist, `WKURLSchemeHandler` for bundled files, non-persistent data store, weak handler proxy (retain-cycle fix), content-process crash recovery, `isInspectable` |
| `ios/AppViewController.swift` | iOS | Registering an app-local plugin with `bridge?.registerPluginInstance` |

## Install

```bash
npm run build
npx cap add android        # and/or: npx cap add ios   (macOS + Xcode)
npm run native:install     # copies sources + patches Gradle / SceneDelegate
npx cap sync
npx cap open android       # or: npx cap open ios
```

`native:install` is idempotent. What it changes:

- **Android:** copies the Kotlin files, removes the generated `MainActivity.java`, adds the
  Kotlin Gradle plugin (`2.2.0`) and `androidx.webkit` dependency.
- **iOS:** copies the Swift files and points `SceneDelegate` / `Main.storyboard` at
  `AppViewController`. Add the two Swift files to the **App** target in Xcode
  (File → Add Files to "App"…), because the Xcode project does not pick up new files automatically.

### Troubleshooting

- *Kotlin "Inconsistent JVM target"*: set Gradle JDK to 21 (Android Studio → Settings → Build Tools → Gradle).
- *Kotlin version*: if your Android Gradle Plugin needs a newer Kotlin, bump the version in `android/build.gradle`.

## Why `addWebMessageListener` instead of `addJavascriptInterface`

`addJavascriptInterface` injects the object into **every** page and iframe the WebView ever loads.
`addWebMessageListener` only injects it for the origins you list, and tells you the sender's
origin and whether it is the main frame. Messages are then validated **again** in TypeScript
(`parseWebMessage`), so neither layer trusts the page.

## Message flow

```
Ionic app (TS)                    Native plugin                        Web module (JS)
─────────────                     ─────────────                        ───────────────
NativeWebView.open(url) ───────▶  allowlist check → present WebView ─▶ loads, FalconBridge.ready()
                         ◀──────  notifyListeners('message')  ◀─────── postMessage('web.ready')
postMessage(host.init)  ───────▶  evaluateJavascript(receive(…)) ────▶ FalconBridge.receive()
                         ◀──────  notifyListeners('message')  ◀─────── send('checkin.completed')
```
