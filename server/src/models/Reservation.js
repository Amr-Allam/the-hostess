import mongoose from "mongoose";
import { integerValidator } from "../utils/integerValidator.js";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const minutesField = {
  type: Number,
  required: true,
  min: 0,
  max: 1440,
  validate: integerValidator,
};

const reservationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  partySize: {
    type: Number,
    required: true,
    min: 1,
    validate: integerValidator,
  },
  date: { type: String, required: true, match: DATE },
  startTime: { type: String, required: true, match: TIME },
  endTime: { type: String, required: true, match: TIME },
  // Minutes from midnight, used for overlap queries.
  startMinutes: minutesField,
  endMinutes: minutesField,
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: true,
  },
  status: {
    type: String,
    enum: ["confirmed", "cancelled"],
    default: "confirmed",
  },
});

// Booking overlap check.
reservationSchema.index({ date: 1, table: 1 });

export default mongoose.model("Reservation", reservationSchema);
