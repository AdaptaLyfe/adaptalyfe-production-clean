---
name: Native report storage
description: Cross-platform storage rule for generated reports in the Capacitor app.
---

Generated files must not rely on a browser download anchor inside the native WebView. Android public Downloads requires a MediaStore write on Android 10 and newer, with legacy external-storage permission handling only for older Android versions. iOS app Documents becomes user-accessible through the Files app when file sharing and in-place document support are enabled.

**Why:** A WebView can report a successful anchor click while never placing the file in the device’s user-visible Downloads area.

**How to apply:** Keep Web on a Blob download, route Android native reports through the registered Downloads bridge, and write iOS native reports to Capacitor Documents. Surface the actual platform location in the success message.