// Usage: npm run seed
// Safe to re-run: never overwrites or wipes existing data.
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { z } from "zod";
import { env } from "../src/config/env.js";
import { connectDB } from "../src/config/db.js";
import { BCRYPT_COST } from "../src/services/auth.js";
import User from "../src/models/User.js";
import Category from "../src/models/Category.js";
import MenuItem from "../src/models/MenuItem.js";
import Table from "../src/models/Table.js";
import Settings from "../src/models/Settings.js";

const seedEnvSchema = z.object({
  SEED_OWNER_EMAIL: z.string().trim().toLowerCase().email(),
  SEED_OWNER_PASSWORD: z.string().min(8, "must be at least 8 characters"),
  SEED_KITCHEN_EMAIL: z.string().trim().toLowerCase().email(),
  SEED_KITCHEN_PASSWORD: z.string().min(8, "must be at least 8 characters"),
});

function readSeedEnv() {
  const parsed = seedEnvSchema.safeParse(env);
  if (!parsed.success) {
    console.error("Invalid seed environment variables:");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  if (parsed.data.SEED_OWNER_EMAIL === parsed.data.SEED_KITCHEN_EMAIL) {
    console.error("SEED_OWNER_EMAIL and SEED_KITCHEN_EMAIL must be different");
    process.exit(1);
  }
  return parsed.data;
}

async function seedUser(email, password, role) {
  if (await User.exists({ email })) {
    console.log(`User ${email}: already exists, skipped`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  await User.create({ email, passwordHash, role });
  console.log(`User ${email}: created (${role})`);
}

// Prices are in piastres (EGP 85 = 8500).
async function seedMenu() {
  if (
    (await Category.countDocuments()) > 0 ||
    (await MenuItem.countDocuments()) > 0
  ) {
    console.log("Menu: categories or items already exist, skipped");
    return;
  }

  const [starters, mains, drinks] = await Category.insertMany([
    { name: "Starters", order: 1 },
    { name: "Mains", order: 2 },
    { name: "Drinks", order: 3 },
  ]);

  await MenuItem.insertMany([
    {
      name: "Hummus",
      description: "Chickpea and tahini dip with warm bread",
      price: 6000,
      category: starters._id,
    },
    {
      name: "Crispy Calamari",
      description: "Fried calamari with lemon and garlic mayo",
      price: 14500,
      category: starters._id,
    },
    {
      name: "Grilled Chicken Plate",
      description: "Marinated chicken breast with rice and grilled vegetables",
      price: 18000,
      category: mains._id,
    },
    {
      name: "Margherita Pizza",
      description: "Tomato, mozzarella and basil",
      price: 16000,
      category: mains._id,
      optionGroups: [
        {
          name: "Extras",
          type: "multiple",
          required: false,
          choices: [
            { name: "Extra Cheese", priceDelta: 2500 },
            { name: "Mushrooms", priceDelta: 2000 },
          ],
        },
      ],
    },
    {
      name: "Fresh Orange Juice",
      description: "Freshly squeezed",
      price: 5500,
      category: drinks._id,
    },
    {
      name: "Iced Coffee",
      description: "Cold brew over ice",
      price: 6500,
      category: drinks._id,
      optionGroups: [
        {
          name: "Size",
          type: "single",
          required: true,
          choices: [
            { name: "Regular", priceDelta: 0 },
            { name: "Large", priceDelta: 1500 },
          ],
        },
      ],
    },
  ]);
  console.log("Menu: created 3 categories and 6 items");
}

async function seedTables() {
  if ((await Table.countDocuments()) > 0) {
    console.log("Tables: already exist, skipped");
    return;
  }
  await Table.insertMany([
    { number: 1, capacity: 2 },
    { number: 2, capacity: 2 },
    { number: 3, capacity: 4 },
    { number: 4, capacity: 4 },
    { number: 5, capacity: 6 },
  ]);
  console.log("Tables: created 5 tables");
}

async function seedSettings() {
  if ((await Settings.countDocuments()) > 0) {
    console.log("Settings: already exist, skipped");
    return;
  }
  const day = { open: "10:00", close: "23:00", closed: false };
  await Settings.create({
    openingHours: {
      monday: day,
      tuesday: day,
      wednesday: day,
      thursday: day,
      friday: day,
      saturday: day,
      sunday: day,
    },
    slotLengthMinutes: 30,
    reservationDurationMinutes: 90,
  });
  console.log("Settings: created (open 10:00-23:00 every day)");
}

async function main() {
  const seedEnv = readSeedEnv();
  await connectDB();

  // Build indexes (e.g. unique email, unique table number) before inserting.
  await Promise.all(
    [User, Category, MenuItem, Table, Settings].map((model) => model.init()),
  );

  await seedUser(
    seedEnv.SEED_OWNER_EMAIL,
    seedEnv.SEED_OWNER_PASSWORD,
    "owner",
  );
  await seedUser(
    seedEnv.SEED_KITCHEN_EMAIL,
    seedEnv.SEED_KITCHEN_PASSWORD,
    "kitchen",
  );
  await seedMenu();
  await seedTables();
  await seedSettings();
  console.log("Seed complete");
}

try {
  await main();
} catch (err) {
  console.error("Seed failed:", err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
