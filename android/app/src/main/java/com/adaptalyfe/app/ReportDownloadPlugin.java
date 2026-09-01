package com.adaptalyfe.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import androidx.annotation.RequiresApi;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "ReportDownload",
    permissions = {
        @Permission(
            alias = "storage",
            strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }
        )
    }
)
public class ReportDownloadPlugin extends Plugin {

    @PluginMethod
    public void savePdf(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
            getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermissionCallback");
            return;
        }

        savePdfToDownloads(call);
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (getPermissionState("storage") != PermissionState.GRANTED) {
            call.reject("Storage permission is required to save the report to Downloads.");
            return;
        }

        savePdfToDownloads(call);
    }

    private void savePdfToDownloads(PluginCall call) {
        String requestedFileName = call.getString("fileName");
        String base64Data = call.getString("data");

        if (requestedFileName == null || requestedFileName.isEmpty() ||
            base64Data == null || base64Data.isEmpty()) {
            call.reject("A PDF filename and file data are required.");
            return;
        }

        String fileName = requestedFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (!fileName.toLowerCase().endsWith(".pdf")) {
            fileName += ".pdf";
        }

        Uri savedUri = null;
        try {
            byte[] pdfBytes = Base64.decode(base64Data, Base64.DEFAULT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                savedUri = saveWithMediaStore(fileName, pdfBytes);
            } else {
                File downloadsDirectory = Environment.getExternalStoragePublicDirectory(
                    Environment.DIRECTORY_DOWNLOADS
                );
                if (!downloadsDirectory.exists() && !downloadsDirectory.mkdirs()) {
                    throw new IllegalStateException("Unable to create the Downloads directory.");
                }

                File outputFile = new File(downloadsDirectory, fileName);
                try (FileOutputStream output = new FileOutputStream(outputFile)) {
                    output.write(pdfBytes);
                }
                savedUri = Uri.fromFile(outputFile);
            }

            JSObject result = new JSObject();
            result.put("fileName", fileName);
            result.put("location", "Downloads");
            result.put("uri", savedUri.toString());
            call.resolve(result);
        } catch (Exception error) {
            if (savedUri != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                getContext().getContentResolver().delete(savedUri, null, null);
            }
            call.reject("Unable to save the report to Downloads.", error);
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.Q)
    private Uri saveWithMediaStore(String fileName, byte[] pdfBytes) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
        values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
        values.put(MediaStore.Downloads.IS_PENDING, 1);

        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
            throw new IllegalStateException("Unable to create a file in Downloads.");
        }

        try (OutputStream output = resolver.openOutputStream(uri)) {
            if (output == null) {
                throw new IllegalStateException("Unable to open the Downloads file.");
            }
            output.write(pdfBytes);
        }

        ContentValues completed = new ContentValues();
        completed.put(MediaStore.Downloads.IS_PENDING, 0);
        resolver.update(uri, completed, null, null);
        return uri;
    }
}