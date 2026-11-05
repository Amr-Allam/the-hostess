import { env } from "../config/env.js";
import Order from "../models/Order.js";
import { eachDate } from "../utils/time.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_ITEMS_LIMIT = 10;

// Orders that count toward reports whose local day (in TIMEZONE) is from..to.
// 1. A loose createdAt window lets MongoDB use the {status, createdAt} index.
//    A local day is at most 14 hours away from the UTC day, so one day before
//    `from` and two days after `to` always cover it.
// 2. The exact day filter then compares the local day string.
function matchStages(from, to) {
  return [
    {
      $match: {
        status: { $ne: "cancelled" },
        createdAt: {
          $gte: new Date(Date.parse(`${from}T00:00:00Z`) - DAY_MS),
          $lt: new Date(Date.parse(`${to}T00:00:00Z`) + 2 * DAY_MS),
        },
      },
    },
    {
      $addFields: {
        day: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
            timezone: env.TIMEZONE,
          },
        },
      },
    },
    { $match: { day: { $gte: from, $lte: to } } },
  ];
}

export function dailyPipeline(from, to) {
  return [
    ...matchStages(from, to),
    {
      $group: {
        _id: "$day",
        totalSales: { $sum: "$total" },
        orderCount: { $sum: 1 },
      },
    },
  ];
}

export function topItemsPipeline(from, to) {
  return [
    ...matchStages(from, to),
    // Oldest first, so $last below picks the most recent snapshotted name.
    { $sort: { createdAt: 1 } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItem",
        name: { $last: "$items.name" },
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { quantity: -1, name: 1 } },
    { $limit: TOP_ITEMS_LIMIT },
    { $project: { _id: 0, menuItemId: "$_id", name: 1, quantity: 1 } },
  ];
}

// One row per day from..to (days without orders are zeros).
export async function getDailyReport({ from, to }) {
  const rows = await Order.aggregate(dailyPipeline(from, to));
  const byDay = new Map(rows.map((r) => [r._id, r]));

  return eachDate(from, to).map((date) => {
    const row = byDay.get(date);
    const totalSales = row?.totalSales ?? 0;
    const orderCount = row?.orderCount ?? 0;
    return {
      date,
      totalSales,
      orderCount,
      // Money is an integer, so the average is rounded to a whole piastre.
      averageOrderValue:
        orderCount === 0 ? 0 : Math.round(totalSales / orderCount),
    };
  });
}

export function getTopItems({ from, to }) {
  return Order.aggregate(topItemsPipeline(from, to));
}
