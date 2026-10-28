import mongoose from "mongoose";
import { integerValidator } from "../utils/integerValidator.js";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const dayHoursSchema = new mongoose.Schema(
  {
    open: { type: String, required: true, match: TIME },
    close: { type: String, required: true, match: TIME },
    closed: { type: Boolean, default: false },
  },
  { _id: false },
);

const openingHours = Object.fromEntries(
  DAYS.map((day) => [day, { type: dayHoursSchema, required: true }]),
);

// Single document: the app always reads/updates the first one.
const settingsSchema = new mongoose.Schema({
  openingHours,
  slotLengthMinutes: {
    type: Number,
    default: 30,
    min: 1,
    validate: integerValidator,
  },
  reservationDurationMinutes: {
    type: Number,
    default: 90,
    min: 1,
    validate: integerValidator,
  },
});

export default mongoose.model("Settings", settingsSchema);
