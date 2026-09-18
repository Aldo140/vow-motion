/** Keep server uploads under the hosting gateway limit, including large phone photos. */
export async function preparePhoto(file: File): Promise<File> {
  const maxBytes = 3_500_000;
  if (file.size <= maxBytes) return file;
  // Phone photos carry orientation as EXIF metadata rather than rotated pixels.
  // A canvas has no EXIF of its own, so if we draw the raw bitmap the rotation
  // is lost for good. Ask explicitly for the corrected orientation rather than
  // trusting a browser default that has changed across versions.
  const image = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const ratio = Math.min(1, 2200 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Please choose a smaller photo.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.85, 0.65, 0.45]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (blob && blob.size <= maxBytes)
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
          type: "image/webp",
        });
    }
    throw new Error("Please choose a smaller photo.");
  } finally {
    image.close();
  }
}
