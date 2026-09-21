package com.adaptalyfe.app

import android.speech.tts.TextToSpeech
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterActivity
import io.flutter.plugin.common.MethodChannel
import java.util.Locale

class MainActivity : FlutterActivity(), TextToSpeech.OnInitListener {
    private val channelName = "adaptalyfe/text_to_speech"
    private val deepLinkChannelName = "adaptalyfe/deep_links"
    private var textToSpeech: TextToSpeech? = null
    private var textToSpeechReady = false
    private var deepLinkChannel: MethodChannel? = null
    private var pendingDeepLink: String? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        textToSpeech = TextToSpeech(this, this)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            channelName,
        ).setMethodCallHandler { call, result ->
            if (call.method != "speak") {
                result.notImplemented()
                return@setMethodCallHandler
            }

            if (!textToSpeechReady) {
                result.error("TTS_NOT_READY", "Text-to-speech is not ready.", null)
                return@setMethodCallHandler
            }

            val text = call.argument<String>("text")
            val rate = call.argument<Double>("rate")?.toFloat() ?: 1.0f
            if (text.isNullOrBlank()) {
                result.error("INVALID_TEXT", "Text-to-speech text is empty.", null)
                return@setMethodCallHandler
            }

            textToSpeech?.setSpeechRate(rate.coerceIn(0.5f, 2.0f))
            textToSpeech?.speak(
                text,
                TextToSpeech.QUEUE_FLUSH,
                null,
                "adaptalyfe-settings-test",
            )
            result.success(null)
        }
        deepLinkChannel = MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            deepLinkChannelName,
        ).also { channel ->
            channel.setMethodCallHandler { call, result ->
                if (call.method != "getInitialLink") {
                    result.notImplemented()
                    return@setMethodCallHandler
                }
                result.success(pendingDeepLink)
                pendingDeepLink = null
            }
        }
        pendingDeepLink = intent?.data?.toString()
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleDeepLink(intent)
    }

    private fun handleDeepLink(intent: android.content.Intent?) {
        val link = intent?.data?.toString() ?: return
        val channel = deepLinkChannel
        if (channel == null) {
            pendingDeepLink = link
        } else {
            channel.invokeMethod("open", link)
        }
    }

    override fun onInit(status: Int) {
        textToSpeechReady = status == TextToSpeech.SUCCESS
        if (textToSpeechReady) {
            textToSpeech?.language = Locale.getDefault()
        }
    }

    override fun onDestroy() {
        textToSpeech?.stop()
        textToSpeech?.shutdown()
        textToSpeech = null
        super.onDestroy()
    }
}