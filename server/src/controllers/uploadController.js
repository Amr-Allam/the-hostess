import * as uploadService from "../services/uploads.js";
import { httpError } from "../utils/httpError.js";

export async function uploadImage(req, res) {
  if (!req.file)
    throw httpError(400, 'Send an image file in the "image" field');
  const url = await uploadService.uploadImageBuffer(req.file.buffer);
  res.status(201).json({ url });
}
