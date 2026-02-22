package com.adaptalyfe.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Clear WebView cache on every app start to prevent white screen issues
        // after app updates (stale cached assets cause MIME type / loading failures)
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.clearCache(true);
                webView.clearHistory();
            }
        } catch (Exception e) {
            // Silently ignore if WebView isn't ready yet
        }
    }
}
