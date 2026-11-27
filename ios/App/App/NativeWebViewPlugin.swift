import Capacitor
import UIKit
import WebKit

/// Opens a hosted web module in a second, isolated WKWebView and bridges messages
/// to the Ionic app.
///
/// JS → native: `window.webkit.messageHandlers.falconBridge.postMessage(json)`
///              (WKScriptMessageHandler; origin + main-frame checked before forwarding).
/// native → JS: `evaluateJavaScript("window.FalconBridge.receive(<json string>)")`.
@objc(NativeWebViewPlugin)
public class NativeWebViewPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeWebViewPlugin"
    public let jsName = "NativeWebView"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "postMessage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise),
    ]

    private var controller: WebModuleViewController?

    @objc func open(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            return call.reject("url is required")
        }
        let allowedHosts = call.getArray("allowedHosts", String.self) ?? []
        let policy = WebModulePolicy(allowedHosts: allowedHosts)
        guard policy.allows(url) else {
            notifyListeners("navigationBlocked", data: ["url": urlString])
            return call.reject("URL not allowed: \(urlString)")
        }

        DispatchQueue.main.async { [weak self] in
            guard let self, let presenter = self.bridge?.viewController else {
                return call.reject("No view controller")
            }
            self.controller?.dismiss(animated: false)
            let vc = WebModuleViewController(url: url, title: call.getString("title"), policy: policy)
            vc.onMessage = { [weak self] json in self?.notifyListeners("message", data: ["message": json]) }
            vc.onBlocked = { [weak self] blocked in self?.notifyListeners("navigationBlocked", data: ["url": blocked]) }
            vc.onClose = { [weak self] in
                self?.controller = nil
                self?.notifyListeners("closed", data: [:])
            }
            self.controller = vc
            let nav = UINavigationController(rootViewController: vc)
            nav.modalPresentationStyle = .pageSheet
            nav.presentationController?.delegate = vc // detect swipe-to-dismiss
            presenter.present(nav, animated: true)
            call.resolve()
        }
    }

    @objc func postMessage(_ call: CAPPluginCall) {
        guard let message = call.getString("message") else { return call.reject("message is required") }
        DispatchQueue.main.async { [weak self] in
            self?.controller?.deliver(message)
            call.resolve()
        }
    }

    @objc func close(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            self?.controller?.closeModule()
            call.resolve()
        }
    }
}

// MARK: - URL policy

struct WebModulePolicy {
    let allowedHosts: [String]

    func hostAllowed(_ host: String?) -> Bool {
        guard let host else { return false }
        return allowedHosts.contains { host == $0 || host.hasSuffix(".\($0)") }
    }

    func allows(_ url: URL) -> Bool {
        switch url.scheme {
        case "https": return hostAllowed(url.host)
        case BundledAssetsSchemeHandler.scheme: return url.host == "localhost" // app-bundled modules
        default: return false
        }
    }
}

// MARK: - View controller hosting the WKWebView

final class WebModuleViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler,
    UIAdaptivePresentationControllerDelegate {
    var onMessage: ((String) -> Void)?
    var onBlocked: ((String) -> Void)?
    var onClose: (() -> Void)?

    private let url: URL
    private let policy: WebModulePolicy
    private var webView: WKWebView!
    private var closed = false

    init(url: URL, title: String?, policy: WebModulePolicy) {
        self.url = url
        self.policy = policy
        super.init(nibName: nil, bundle: nil)
        self.title = title
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) not supported") }

    override func viewDidLoad() {
        super.viewDidLoad()
        let config = WKWebViewConfiguration()
        // Isolated, non-persistent storage: the module can't read the app's cookies/localStorage.
        config.websiteDataStore = .nonPersistent()
        config.preferences.javaScriptCanOpenWindowsAutomatically = false
        config.limitsNavigationsToAppBoundDomains = false
        // Serve app-bundled modules (capacitor://localhost/web/…) from the app bundle.
        config.setURLSchemeHandler(BundledAssetsSchemeHandler(), forURLScheme: BundledAssetsSchemeHandler.scheme)
        // Weak proxy: WKUserContentController retains its handlers strongly.
        config.userContentController.add(WeakScriptMessageHandler(self), name: "falconBridge")

        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        #if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true } // Safari Web Inspector
        #endif
        view = webView

        navigationItem.rightBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .close, target: self, action: #selector(closeModule))
        webView.load(URLRequest(url: url))
    }

    func deliver(_ json: String) {
        // Encode as a JSON string literal so the payload can never break out into code.
        guard let data = try? JSONEncoder().encode(json), let literal = String(data: data, encoding: .utf8) else { return }
        webView?.evaluateJavaScript("window.FalconBridge && window.FalconBridge.receive(\(literal));")
    }

    @objc func closeModule() {
        dismiss(animated: true) { [weak self] in self?.finish() }
    }

    // Swipe-down dismissal of the sheet.
    func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
        finish()
    }

    private func finish() {
        guard !closed else { return }
        closed = true
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "falconBridge")
        onClose?()
    }

    // MARK: WKScriptMessageHandler

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        let origin = message.frameInfo.securityOrigin
        let trusted = message.frameInfo.isMainFrame
            && (origin.protocol == "https" ? policy.hostAllowed(origin.host)
                : origin.protocol == BundledAssetsSchemeHandler.scheme && origin.host == "localhost")
        guard trusted, let body = message.body as? String, body.count < 10_000 else { return }
        onMessage?(body) // still validated again in TypeScript (parseWebMessage)
    }

    // MARK: WKNavigationDelegate

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let target = navigationAction.request.url else { return decisionHandler(.cancel) }
        if target.absoluteString == "about:blank" || policy.allows(target) {
            decisionHandler(.allow)
        } else {
            onBlocked?(target.absoluteString)
            decisionHandler(.cancel)
        }
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload() // WebKit killed the content process (memory pressure): recover.
    }
}

// MARK: - Helpers

/// Breaks the retain cycle WKUserContentController → handler → web view.
final class WeakScriptMessageHandler: NSObject, WKScriptMessageHandler {
    private weak var target: WKScriptMessageHandler?
    init(_ target: WKScriptMessageHandler) { self.target = target }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        target?.userContentController(c, didReceive: m)
    }
}

/// Serves files from the app bundle's `public/` folder (where Capacitor copies the web build)
/// for `capacitor://localhost/...` URLs inside this secondary WKWebView.
final class BundledAssetsSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "capacitor"

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url,
              let root = Bundle.main.resourceURL?.appendingPathComponent("public"),
              !url.path.contains("..") else {
            return task.didFailWithError(URLError(.badURL))
        }
        let file = root.appendingPathComponent(url.path)
        guard let data = try? Data(contentsOf: file) else {
            return task.didFailWithError(URLError(.fileDoesNotExist))
        }
        let mime: String = {
            switch file.pathExtension.lowercased() {
            case "html": return "text/html"
            case "js": return "text/javascript"
            case "css": return "text/css"
            case "json": return "application/json"
            case "svg": return "image/svg+xml"
            case "png": return "image/png"
            default: return "application/octet-stream"
            }
        }()
        task.didReceive(URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: "utf-8"))
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}
