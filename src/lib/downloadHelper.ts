/**
 * Universal safe downloader for images, certificates, QR codes, and files.
 * Handles data: URLs, blob: URLs, and remote URLs (with canvas fallback for CORS).
 */

export async function downloadImage(urlOrDataUrl: string, filename?: string): Promise<void> {
  if (!urlOrDataUrl) return;

  const resolvedFilename = filename || getDefaultImageFilename(urlOrDataUrl);

  // 1. If Data URL or Blob URL, trigger direct anchor download
  if (urlOrDataUrl.startsWith('data:') || urlOrDataUrl.startsWith('blob:')) {
    triggerAnchorDownload(urlOrDataUrl, resolvedFilename);
    return;
  }

  // 2. Try fetching as Blob (supports same-origin and CORS-enabled domains)
  try {
    const response = await fetch(urlOrDataUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Fetch failed');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerAnchorDownload(objectUrl, resolvedFilename);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    return;
  } catch {
    // 3. Fallback: Draw into HTML5 Canvas with crossOrigin anonymous to produce PNG data URL
    try {
      const dataUrl = await convertImageToDataUrl(urlOrDataUrl);
      triggerAnchorDownload(dataUrl, resolvedFilename);
      return;
    } catch {
      // 4. Final fallback: Open in new tab or direct link click
      triggerAnchorDownload(urlOrDataUrl, resolvedFilename, true);
    }
  }
}

export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  triggerAnchorDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function getDefaultImageFilename(url: string): string {
  if (url.startsWith('data:image/')) {
    const mimeMatch = url.match(/data:image\/([a-zA-Z0-9]+);/);
    const ext = mimeMatch ? mimeMatch[1] : 'png';
    return `academy_image_${Date.now()}.${ext}`;
  }
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && /\.(jpe?g|png|webp|gif|svg)$/i.test(last)) {
      return last;
    }
  } catch {
    // Ignore URL parse error
  }
  return `academy_image_${Date.now()}.png`;
}

function triggerAnchorDownload(href: string, filename: string, openInNewTabFallback = false): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  if (openInNewTabFallback) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function convertImageToDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}
