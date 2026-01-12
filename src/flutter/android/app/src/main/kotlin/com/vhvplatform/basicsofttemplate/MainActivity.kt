package com.vhvplatform.basicsofttemplate

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugins.GeneratedPluginRegistrant

class MainActivity: FlutterActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        GeneratedPluginRegistrant.registerWith(flutterEngine)
        
        // Add custom platform channels here if needed
        // Example:
        // MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "com.vhvplatform/channel")
        //     .setMethodCallHandler { call, result ->
        //         when (call.method) {
        //             "methodName" -> {
        //                 // Handle method
        //                 result.success("Response")
        //             }
        //             else -> result.notImplemented()
        //         }
        //     }
    }
}
