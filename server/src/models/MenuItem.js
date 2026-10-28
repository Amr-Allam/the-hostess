import mongoose from "mongoose";
import { integerValidator } from "../utils/integerValidator.js";

const choiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    priceDelta: { type: Number, default: 0, validate: integerValidator },
  },
  { _id: false },
);

const optionGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["single", "multiple"], required: true },
    required: { type: Boolean, default: false },
    choices: { type: [choiceSchema], default: [] },
  },
  { _id: false },
);

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "", trim: true },
  price: { type: Number, required: true, min: 0, validate: integerValidator },
  imageUrl: { type: String, default: "" },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  available: { type: Boolean, default: true },
  optionGroups: { type: [optionGroupSchema], default: [] },
});

export default mongoose.model("MenuItem", menuItemSchema);
