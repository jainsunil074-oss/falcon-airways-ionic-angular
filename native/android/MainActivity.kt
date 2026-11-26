package com.falconairways.app

import android.os.Bundle
import com.falconairways.app.plugins.NativeWebViewPlugin
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // App-local plugins must be registered before super.onCreate().
        registerPlugin(NativeWebViewPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
