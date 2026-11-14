
import { fileTypeFromBuffer } from "file-type";

export async function uploadStudioImage(req, res) {
  if (!req.file) {
    return res.status(400).json({
      message: "Please select an image"
    });
  }

  if (!process.env.IMGBB_API_KEY) {
    return res.status(500).json({
      message: "Image hosting is not configured"
    });
  }

  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
  ]);

  try {
    const detectedType = await fileTypeFromBuffer(req.file.buffer);

    if (!detectedType || !allowedTypes.has(detectedType.mime)) {
      return res.status(400).json({
        message: "Please upload a valid JPG, PNG or WebP image"
      });
    }

    const formData = new FormData();

    formData.append(
      "image",
      new Blob([req.file.buffer], {
        type: detectedType.mime
      }),
      `studio-${Date.now()}.${detectedType.ext}`
    );

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(process.env.IMGBB_API_KEY)}`,
      {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(30000)
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success || !result.data?.url) {
      return res.status(502).json({
        message: "Image hosting service rejected the upload"
      });
    }

    return res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: result.data.url
    });
  } catch (error) {
    console.error("Image upload error:", error);

    return res.status(502).json({
      message: "Image upload failed. Please try again."
    });
  }
}
