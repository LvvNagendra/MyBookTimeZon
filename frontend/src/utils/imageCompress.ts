/**
 * Resize and compress an image file for optional profile / registration upload (JPEG data URL).
 * Returns null if file is not an image or result still exceeds maxChars (rough guard).
 */
export async function compressImageFileToDataUrl(
  file: File,
  opts?: { maxWidth?: number; quality?: number; maxChars?: number },
): Promise<string | null> {
  const maxWidth = opts?.maxWidth ?? 720;
  const quality = opts?.quality ?? 0.82;
  const maxChars = opts?.maxChars ?? 340_000;

  if (!file.type.startsWith("image/")) return null;

  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return null;

  const scale = bmp.width > maxWidth ? maxWidth / bmp.width : 1;
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    return null;
  }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (dataUrl.length > maxChars) {
    const smaller = canvas.toDataURL("image/jpeg", Math.min(0.7, quality - 0.1));
    if (smaller.length > maxChars) return null;
    return smaller;
  }
  return dataUrl;
}

export function dataUrlFromVideoFrame(video: HTMLVideoElement, opts?: { maxWidth?: number; quality?: number }): string | null {
  const maxWidth = opts?.maxWidth ?? 720;
  const quality = opts?.quality ?? 0.82;
  if (video.videoWidth < 2 || video.videoHeight < 2) return null;
  const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
  const w = Math.max(1, Math.round(video.videoWidth * scale));
  const h = Math.max(1, Math.round(video.videoHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
