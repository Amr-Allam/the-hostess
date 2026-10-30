import { z } from "zod";

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const idParamsSchema = z.object({ id: objectId });

export const categoryBodySchema = z.object({
  name: z.string().trim().min(1),
  order: z.number().int().default(0),
});

const choiceSchema = z.object({
  name: z.string().trim().min(1),
  priceDelta: z.number().int().default(0),
});

const optionGroupSchema = z
  .object({
    name: z.string().trim().min(1),
    type: z.enum(["single", "multiple"]),
    required: z.boolean().default(false),
    choices: z.array(choiceSchema).min(1),
  })
  .superRefine((group, ctx) => {
    // Orders refer to choices by name, so names must be unique inside a group.
    const names = group.choices.map((c) => c.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "Choice names must be unique within a group",
      });
    }
  });

export const menuItemBodySchema = z
  .object({
    name: z.string().trim().min(1),
    description: z.string().trim().default(""),
    price: z.number().int().min(0),
    imageUrl: z.union([z.literal(""), z.url()]).default(""),
    category: objectId,
    available: z.boolean().default(true),
    optionGroups: z.array(optionGroupSchema).default([]),
  })
  .superRefine((item, ctx) => {
    // Orders refer to groups by name, so names must be unique inside an item.
    const names = item.optionGroups.map((g) => g.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      ctx.addIssue({
        code: "custom",
        path: ["optionGroups"],
        message: "Option group names must be unique within an item",
      });
    }
  });
