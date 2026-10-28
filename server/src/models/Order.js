import mongoose from "mongoose";
import { integerValidator } from "../utils/integerValidator.js";

const selectedOptionSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true },
    choiceName: { type: String, required: true },
    priceDelta: { type: Number, default: 0, validate: integerValidator },
  },
  { _id: false },
);

// Name and prices are snapshotted at order time.
const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      validate: integerValidator,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: integerValidator,
    },
    selectedOptions: { type: [selectedOptionSchema], default: [] },
    note: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      enum: ["dine-in", "takeaway"],
      required: true,
    },
    tableNumber: {
      type: Number,
      required: function () {
        return this.orderType === "dine-in";
      },
    },
    items: { type: [orderItemSchema], default: [] },
    customerNote: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["placed", "preparing", "ready", "served", "cancelled"],
      default: "placed",
    },
    total: { type: Number, required: true, min: 0, validate: integerValidator },
  },
  { timestamps: true },
);

// Kitchen's active-orders list.
orderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
