package com.adaptalyfe.app;

import android.graphics.Color;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(GooglePlayBillingPlugin.class);
        super.onCreate(savedInstanceState);

        // Set WebView background to Adaptalyfe green so the screen is never
        // white while the WebView is fetching content from the Railway server.
        // Without this, Railway cold-starts (35-45s) show a blank white screen
        // even when the native splash and window background are already green.
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.setBackgroundColor(Color.parseColor("#ecfdf5"));
            }
        } catch (Exception e) {
            // Silently ignore — not critical
        }
    }
}
