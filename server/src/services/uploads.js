import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";
import { httpError } from "../utils/httpError.js";

// Streams an in-memory image to Cloudinary and returns its https URL.
export function uploadImageBuffer(buffer) {
  if (!isCloudinaryConfigured) {
    throw httpError(503, "Image uploads are not configured");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      // asset_folder (not the legacy `folder`) is the right option for dynamic-folder accounts.
      { asset_folder: "the-hostess", resource_type: "image" },
      (error, result) => {
        if (error) {
          // Cloudinary answers 400 when the bytes aren't a real image, e.g. a renamed file.
          if (error.http_code === 400)
            return reject(httpError(400, "Invalid image file"));
          return reject(error);
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}
