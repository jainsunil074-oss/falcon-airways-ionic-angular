package com.falconairways.app.plugins

import android.annotation.SuppressLint
import android.app.Dialog
import android.content.pm.ApplicationInfo
import android.graphics.Color
import android.net.Uri
import android.view.Gravity
import android.view.KeyEvent
import android.view.ViewGroup
import android.webkit.MimeTypeMap
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject

/**
 * Opens a hosted web module in a second, isolated android.webkit.WebView and
 * bridges messages to the Ionic app.
 *
 * JS → native: WebViewCompat.addWebMessageListener exposes `window.FalconBridgeAndroid`
 *              ONLY to allowlisted origins (safer than addJavascriptInterface,
 *              which exposes the object to every page and frame).
 * native → JS: evaluateJavascript("window.FalconBridge.receive(<json string>)").
 */
@CapacitorPlugin(name = "NativeWebView")
class NativeWebViewPlugin : Plugin() {

    private var dialog: Dialog? = null
    private var webView: WebView? = null
    private var allowedHosts: List<String> = emptyList()

    @PluginMethod
    fun open(call: PluginCall) {
        val url = call.getString("url") ?: return call.reject("url is required")
        allowedHosts = try {
            call.getArray("allowedHosts")?.toList<String>() ?: emptyList()
        } catch (e: org.json.JSONException) {
            return call.reject("allowedHosts must be an array of strings")
        }
        if (!isAllowed(Uri.parse(url))) {
            notifyListeners("navigationBlocked", JSObject().put("url", url))
            return call.reject("URL not allowed: $url")
        }
        val title = call.getString("title") ?: ""

        activity.runOnUiThread {
            closeInternal(notify = false)
            val wv = createWebView()
            webView = wv
            dialog = buildDialog(title, wv).also { it.show() }
            wv.loadUrl(url)
            call.resolve()
        }
    }

    @PluginMethod
    fun postMessage(call: PluginCall) {
        val message = call.getString("message") ?: return call.reject("message is required")
        activity.runOnUiThread {
            // JSONObject.quote produces a safe JS string literal (no code injection).
            webView?.evaluateJavascript(
                "window.FalconBridge && window.FalconBridge.receive(${JSONObject.quote(message)});",
                null,
            )
            call.resolve()
        }
    }

    @PluginMethod
    fun close(call: PluginCall) {
        activity.runOnUiThread {
            closeInternal(notify = true)
            call.resolve()
        }
    }

    override fun handleOnDestroy() {
        closeInternal(notify = false)
    }

    // ---------------------------------------------------------------------

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(): WebView {
        val debuggable = (context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0
        WebView.setWebContentsDebuggingEnabled(debuggable) // chrome://inspect in debug builds only

        return WebView(context).apply {
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                setGeolocationEnabled(false)
                javaScriptCanOpenWindowsAutomatically = false
                setSupportMultipleWindows(false)
                mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
                safeBrowsingEnabled = true
            }
            webViewClient = ModuleWebViewClient()
            installBridge(this)
        }
    }

    private fun installBridge(wv: WebView) {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            // Very old System WebView: refuse rather than fall back to addJavascriptInterface.
            notifyListeners("navigationBlocked", JSObject().put("url", "bridge-unsupported"))
            return
        }
        val origins = allowedHosts.flatMap { listOf("https://$it", "https://*.$it") }.toSet()
        WebViewCompat.addWebMessageListener(wv, "FalconBridgeAndroid", origins) { _, message, sourceOrigin, isMainFrame, _ ->
            val host = sourceOrigin.host
            // Only the top-level page of an allowlisted origin may talk to the app.
            if (isMainFrame && host != null && hostAllowed(host)) {
                message.data?.let { notifyListeners("message", JSObject().put("message", it)) }
            }
        }
    }

    private fun buildDialog(title: String, wv: WebView): Dialog {
        val toolbar = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setBackgroundColor(Color.parseColor("#1F2A44"))
            setPadding(32, 24, 16, 24)
            addView(TextView(context).apply {
                text = title
                setTextColor(Color.WHITE)
                textSize = 17f
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            })
            addView(Button(context).apply {
                text = "Close"
                setOnClickListener { closeInternal(notify = true) }
            })
        }
        val root = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            addView(toolbar)
            addView(wv)
        }
        return Dialog(activity, android.R.style.Theme_DeviceDefault_Light_NoActionBar).apply {
            setContentView(root)
            setCancelable(true)
            // Hardware back: navigate back inside the module first, then close.
            setOnKeyListener { _, keyCode, event ->
                if (keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
                    if (wv.canGoBack()) wv.goBack() else closeInternal(notify = true)
                    true
                } else {
                    false
                }
            }
        }
    }

    private fun closeInternal(notify: Boolean) {
        val wasOpen = dialog != null
        webView?.apply {
            stopLoading()
            loadUrl("about:blank")
            (parent as? ViewGroup)?.removeView(this)
            destroy()
        }
        webView = null
        dialog?.dismiss()
        dialog = null
        if (notify && wasOpen) notifyListeners("closed", JSObject())
    }

    private fun hostAllowed(host: String): Boolean =
        allowedHosts.any { host == it || host.endsWith(".$it") }

    private fun isAllowed(uri: Uri): Boolean =
        uri.scheme == "https" && uri.host?.let(::hostAllowed) == true

    private inner class ModuleWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (isAllowed(request.url)) return false
            notifyListeners("navigationBlocked", JSObject().put("url", request.url.toString()))
            return true // block: http, intent://, tel:, other domains…
        }

        /**
         * Capacitor serves the app from https://localhost inside ITS WebView only.
         * Serve bundled web modules (assets/public/…) to this second WebView too,
         * so the demo works offline. Remote modules load normally.
         */
        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
            val url = request.url
            if (url.host != "localhost") return null
            val path = url.path?.trimStart('/')?.takeIf { it.isNotEmpty() && !it.contains("..") } ?: return null
            return try {
                val ext = MimeTypeMap.getFileExtensionFromUrl(path)
                val mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext) ?: "text/plain"
                WebResourceResponse(mime, "utf-8", context.assets.open("public/$path"))
            } catch (e: Exception) {
                WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), null)
            }
        }
    }
}
