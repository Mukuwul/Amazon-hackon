// Client-side downscale for uploaded current photos (MT9). The backend caps each
// decoded image at ~1.5 MB; we shrink to ~1024px on the long edge and re-encode as
// JPEG so a phone photo lands well under that. Returns base64 WITHOUT the data: prefix
// (the backend strips it too, but smaller payload = faster). Zero deps — canvas only.
const MAX_EDGE = 1024;
const QUALITY = 0.72;

export function fileToGradeImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
      resolve({
        b64: dataUrl.split(",", 2)[1], // strip "data:image/jpeg;base64,"
        preview: dataUrl,              // keep the data URL for an instant thumbnail
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}
