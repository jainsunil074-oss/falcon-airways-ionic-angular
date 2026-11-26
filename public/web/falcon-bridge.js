/**
 * Falcon Bridge — web-side SDK for hosted web modules.
 *
 * One page, three containers. The SDK detects where it is running and picks a transport:
 *   1. iOS WKWebView      → window.webkit.messageHandlers.falconBridge.postMessage(json)
 *   2. Android WebView    → window.FalconBridgeAndroid.postMessage(json)  (@JavascriptInterface)
 *   3. <iframe> / popup   → parent.postMessage(envelope, parentOrigin)
 *
 * Native hosts deliver messages by calling window.FalconBridge.receive(json)
 * through evaluateJavascript; iframe hosts use window.postMessage.
 */
(function () {
  'use strict';
  var NS = 'falcon-bridge';
  var V = 1;
  var handlers = {};
  var context = null;

  function uuid() {
    return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()) + Math.random();
  }

  function detectTransport() {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.falconBridge) {
      return 'ios-wkwebview';
    }
    if (window.FalconBridgeAndroid && typeof window.FalconBridgeAndroid.postMessage === 'function') {
      return 'android-webview';
    }
    if (window.opener && window.opener !== window) {
      return 'popup';
    }
    if (window.parent && window.parent !== window) {
      return 'iframe';
    }
    return 'standalone';
  }

  var transport = detectTransport();

  // Only talk to (and accept messages from) the origin that embedded us.
  var hostOrigin = (function () {
    try {
      return document.referrer ? new URL(document.referrer).origin : location.origin;
    } catch (e) {
      return location.origin;
    }
  })();

  function send(type, payload) {
    var env = { ns: NS, v: V, id: uuid(), type: type, payload: payload || {} };
    var json = JSON.stringify(env);
    switch (transport) {
      case 'ios-wkwebview':
        window.webkit.messageHandlers.falconBridge.postMessage(json);
        break;
      case 'android-webview':
        window.FalconBridgeAndroid.postMessage(json);
        break;
      case 'popup':
        window.opener.postMessage(env, hostOrigin);
        break;
      case 'iframe':
        window.parent.postMessage(env, hostOrigin);
        break;
      default:
        console.info('[FalconBridge] standalone (no host):', env);
    }
  }

  function dispatch(env) {
    if (!env || env.ns !== NS || env.v !== V || typeof env.type !== 'string') return;
    if (env.type === 'host.init') {
      context = env.payload;
      document.documentElement.lang = context.locale;
      document.documentElement.dir = context.dir;
      document.documentElement.dataset.theme = context.theme;
    }
    if (env.type === 'host.ping') {
      send('web.pong', { at: env.payload.at });
    }
    (handlers[env.type] || []).forEach(function (fn) {
      fn(env.payload);
    });
  }

  // iframe / popup transport
  window.addEventListener('message', function (event) {
    var expected = transport === 'popup' ? window.opener : window.parent;
    if (event.source !== expected || event.origin !== hostOrigin) return;
    dispatch(typeof event.data === 'string' ? JSON.parse(event.data) : event.data);
  });

  // Report content height so the host can size the iframe (no inner scrollbars).
  function reportHeight() {
    send('web.resize', { height: document.documentElement.scrollHeight });
  }

  window.FalconBridge = {
    transport: transport,
    send: send,
    on: function (type, fn) {
      (handlers[type] = handlers[type] || []).push(fn);
    },
    context: function () {
      return context;
    },
    /** Called by native hosts via evaluateJavascript. */
    receive: function (json) {
      try {
        dispatch(typeof json === 'string' ? JSON.parse(json) : json);
      } catch (e) {
        console.warn('[FalconBridge] bad message', e);
      }
    },
    ready: function () {
      send('web.ready', {});
      if (transport === 'iframe' && 'ResizeObserver' in window) {
        new ResizeObserver(reportHeight).observe(document.body);
      }
    },
  };
})();
