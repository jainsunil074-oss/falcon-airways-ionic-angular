#!/usr/bin/env bash
# One-time publish: creates the public GitHub repo, enables GitHub Pages and pushes.
# The GitHub Actions workflow then tests, builds and deploys the live demo.
#
#   ./scripts/publish-to-github.sh <your-github-username>
#
# Uses the GitHub CLI (`gh`) if it's installed and logged in (brew install gh && gh auth login);
# otherwise falls back to plain git + one manual setting.
set -euo pipefail

GH_USER="${1:?Usage: ./scripts/publish-to-github.sh <github-username>}"
REPO="falcon-airways-ionic-angular"
DESC="Hybrid airline app: Ionic 9 + Angular 22 + Capacitor 8 with a secure WebView/WKWebView bridge, custom Kotlin/Swift plugin, Arabic RTL"
TOPICS="ionic,angular,capacitor,hybrid-app,webview,wkwebview,typescript,kotlin,swift,rtl,mobile"

cd "$(dirname "$0")/.."

# Put the real live-demo URL into the README.
if grep -q "YOUR-GITHUB-USERNAME" README.md; then
  sed -i.bak "s/YOUR-GITHUB-USERNAME/${GH_USER}/g" README.md && rm -f README.md.bak
  git add README.md
  git commit -q -m "docs: add live demo link"
fi

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  gh repo create "${REPO}" --public --description "${DESC}" --source . --remote origin
  gh repo edit "${GH_USER}/${REPO}" --add-topic "${TOPICS}" --homepage "https://${GH_USER}.github.io/${REPO}/"
  # Enable Pages with GitHub Actions as the source BEFORE the first push, so the first deploy succeeds.
  gh api -X POST "repos/${GH_USER}/${REPO}/pages" -f build_type=workflow >/dev/null 2>&1 || true
  git push -u origin main
  echo
  echo "✓ Repo:      https://github.com/${GH_USER}/${REPO}"
  echo "✓ Live demo: https://${GH_USER}.github.io/${REPO}/  (ready in ~2 minutes — watch the Actions tab)"
else
  echo "GitHub CLI not logged in — using plain git."
  echo "1) Create an EMPTY public repo named '${REPO}' at https://github.com/new (no README), then press Enter."
  read -r _
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/${GH_USER}/${REPO}.git"
  git push -u origin main
  echo
  echo "2) Open https://github.com/${GH_USER}/${REPO}/settings/pages → Source: 'GitHub Actions'"
  echo "3) Open the Actions tab → 'Test & deploy demo' → Re-run all jobs"
  echo "Live demo: https://${GH_USER}.github.io/${REPO}/"
fi
