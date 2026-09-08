import type { jsPDF } from "jspdf";

export type ReportDownloadResult = {
  platform: "web" | "android" | "ios";
  location: "Downloads" | "Files";
  uri?: string;
};

function getCapacitor() {
  if (typeof window === "undefined") return null;
  return (window as any).Capacitor || null;
}

function getSafeFileName(fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`;
}

export async function savePdfDocument(doc: jsPDF, fileName: string): Promise<ReportDownloadResult> {
  const safeFileName = getSafeFileName(fileName);
  const capacitor = getCapacitor();
  const isNative = Boolean(capacitor?.isNativePlatform?.());
  const platform = capacitor?.getPlatform?.();
  const dataUri = doc.output("datauristring");
  const base64Data = dataUri.substring(dataUri.indexOf(",") + 1);

  if (isNative && platform === "android") {
    const reportDownload = capacitor?.Plugins?.ReportDownload;
    if (!reportDownload?.savePdf) {
      throw new Error("Android file storage is not available in this app build.");
    }

    const result = await reportDownload.savePdf({
      fileName: safeFileName,
      data: base64Data,
    });

    return {
      platform: "android",
      location: "Downloads",
      uri: result?.uri,
    };
  }

  if (isNative && platform === "ios") {
    const { Directory, Filesystem } = await import("@capacitor/filesystem");
    const result = await Filesystem.writeFile({
      path: safeFileName,
      directory: Directory.Documents,
      data: base64Data,
    });

    return {
      platform: "ios",
      location: "Files",
      uri: result.uri,
    };
  }

  const blob = doc.output("blob");
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = safeFileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

  return {
    platform: "web",
    location: "Downloads",
  };
}