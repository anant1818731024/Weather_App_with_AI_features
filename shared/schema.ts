import { pgTable, text, serial, real, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z, ZodTypeAny } from "zod";
import { relations } from "drizzle-orm";

export const emptyStringToUndefined = <T extends ZodTypeAny>(schema: T) =>
  z.preprocess(
    (val) => (val === "" ? undefined : val),
    schema
  );

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  tokenVersion: integer("token_version").notNull().default(1),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  country: text("country"),
  admin1: text("admin1"), // State/Region
  userId: integer("user_id").references(() => users.id), // Link location to a user
},
  (table) => ({
    uniqueLatLng: unique().on(table.userId, table.latitude, table.longitude),
  }));


export const locationsRelations = relations(locations, ({ one }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
}));




export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, tokenVersion: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export const registerSchema = insertUserSchema
  .extend({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),

    email: z
      .string()
      .email("Invalid email address")
      .max(255, "Email must be at most 255 characters"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      )
      .refine((val) => !/\s/.test(val), {
        message: "Password must not contain spaces",
      }),

    firstName: z
      .string()
      .min(1, "First name cannot be empty")
      .max(50, "First name must be at most 50 characters"),


    lastName: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string()
        .min(1, "Last name cannot be empty")
        .max(50, "Last name must be at most 50 characters")
        .optional()
    ),

    profileImageUrl: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string()
        .url("Profile image must be a valid URL")
        .max(2048, "Profile image URL is too long")
        .optional()
),

  })
  .strict();


export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
}).strict();

export const loginWithEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
}).strict();

export const publicUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
}).strict();

export const jwtPayloadSchema = z.object({
  userId: z.number(),
  username: z.string(),
  tokenVersion: z.number(),
});

export const updateUserSchema = registerSchema.partial().omit({ password: true });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginWithEmailInput = z.infer<typeof loginWithEmailSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type JWTPayload = z.infer<typeof jwtPayloadSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;