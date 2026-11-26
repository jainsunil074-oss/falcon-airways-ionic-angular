#!/usr/bin/env node
/**
 * Installs the custom NativeWebView plugin sources into the generated native projects.
 * Run after `npx cap add android` / `npx cap add ios`. Safe to run more than once.
 *
 *   npm run native:install
 */
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pkgPath = ['com', 'falconairways', 'app'];
const done = [];
const todo = [];

function patch(file, marker, apply) {
  const text = readFileSync(file, 'utf8');
  if (text.includes(marker)) return;
  const next = apply(text);
  if (next === text) {
    todo.push(`Could not patch ${file} automatically — see native/README.md`);
    return;
  }
  writeFileSync(file, next);
  done.push(`patched ${file}`);
}

function findFiles(dir, name, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) findFiles(p, name, out);
    else if (entry === name) out.push(p);
  }
  return out;
}

// ---------------- Android ----------------
const android = join(root, 'android');
if (existsSync(android)) {
  const javaRoot = join(android, 'app/src/main/java');
  const appDir = join(javaRoot, ...pkgPath);
  const pluginDir = join(appDir, 'plugins');
  mkdirSync(pluginDir, { recursive: true });

  copyFileSync(join(root, 'native/android/NativeWebViewPlugin.kt'), join(pluginDir, 'NativeWebViewPlugin.kt'));
  copyFileSync(join(root, 'native/android/MainActivity.kt'), join(appDir, 'MainActivity.kt'));
  for (const java of findFiles(javaRoot, 'MainActivity.java')) {
    rmSync(java);
    done.push(`removed generated ${java} (replaced by MainActivity.kt)`);
  }
  done.push('copied Android Kotlin sources');

  // Kotlin support (Capacitor's template is Java-only).
  patch(join(android, 'build.gradle'), 'kotlin-gradle-plugin', (t) =>
    t.replace(
      /(classpath 'com\.android\.tools\.build:gradle:[^']+')/,
      `$1\n        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.0'`,
    ),
  );
  const appGradle = join(android, 'app/build.gradle');
  patch(appGradle, 'org.jetbrains.kotlin.android', (t) =>
    t.replace("apply plugin: 'com.android.application'", "apply plugin: 'com.android.application'\napply plugin: 'org.jetbrains.kotlin.android'"),
  );
  patch(appGradle, 'androidx.webkit:webkit', (t) =>
    t.replace(
      /dependencies \{\n/,
      'dependencies {\n    implementation "androidx.webkit:webkit:$androidxWebkitVersion"\n',
    ),
  );
} else {
  todo.push('android/ not found — run `npx cap add android` first');
}

// ---------------- iOS ----------------
const iosApp = join(root, 'ios/App/App');
if (existsSync(iosApp)) {
  for (const f of ['NativeWebViewPlugin.swift', 'AppViewController.swift']) {
    copyFileSync(join(root, 'native/ios', f), join(iosApp, f));
  }
  done.push('copied iOS Swift sources');

  const scene = join(iosApp, 'SceneDelegate.swift');
  if (existsSync(scene)) {
    patch(scene, 'AppViewController()', (t) => t.replace('CAPBridgeViewController()', 'AppViewController()'));
  }
  const storyboard = join(iosApp, 'Base.lproj/Main.storyboard');
  if (existsSync(storyboard)) {
    patch(storyboard, 'customClass="AppViewController"', (t) =>
      t.replace('customClass="CAPBridgeViewController" customModule="Capacitor"', 'customClass="AppViewController" customModule="App"'),
    );
  }
  todo.push(
    'Xcode: File → Add Files to "App"… → select NativeWebViewPlugin.swift and AppViewController.swift (target: App)',
  );
} else {
  todo.push('ios/App/App not found — run `npx cap add ios` first (macOS + Xcode)');
}

console.log('\nNativeWebView plugin install\n');
done.forEach((d) => console.log('  ✓', d));
todo.forEach((t) => console.log('  •', t));
console.log('\nThen: npm run build && npx cap sync\n');
