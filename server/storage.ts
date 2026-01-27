import { users, locations, type InsertLocation, type Location, type InsertUser, type User, updateUserSchema, UpdateUserInput } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { checkExistingUsername } from "./auth";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLocations(userId: number): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  deleteLocation(id: number, userId: number): Promise<void>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getLocations(userId: number): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.userId, userId));
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(insertLocation).onConflictDoNothing({
      target: [locations.userId, locations.latitude, locations.longitude],
    }).returning();
    return location;
  }

  async deleteLocation(id: number, userId: number): Promise<void> {
    await db.delete(locations).where(and(eq(locations.id, id), eq(locations.userId, userId)));
  }

  async updateUser(
    id: number,
    data: UpdateUserInput
  ): Promise<User> {
    if(await checkExistingUsername(data?.username!)) {
      throw new Error("Username already exists");
    }
    if(await checkExistingUsername(data?.email ?? "")) {
      throw new Error("Email already exists");
    }
    const [user] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return user;
}

}

export const storage = new DatabaseStorage();
