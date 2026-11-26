import Capacitor
import UIKit

/// Registers app-local plugins with the Capacitor bridge.
/// In Main.storyboard set the Bridge View Controller's class to `AppViewController`.
class AppViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(NativeWebViewPlugin())
    }
}
