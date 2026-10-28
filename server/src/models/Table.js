import mongoose from "mongoose";
import { integerValidator } from "../utils/integerValidator.js";

const tableSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    validate: integerValidator,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    validate: integerValidator,
  },
});

export default mongoose.model("Table", tableSchema);
