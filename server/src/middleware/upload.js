import multer from "multer";
import { httpError } from "../utils/httpError.js";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(httpError(400, "Only JPEG, PNG and WebP images are allowed"));
    }
    cb(null, true);
  },
});

// Accepts one file in the "image" form field and puts it on req.file.
export function uploadImage(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Image must be 5 MB or smaller"
          : 'Send exactly one file in the "image" field';
      return next(httpError(400, message));
    }
    next(err);
  });
}
