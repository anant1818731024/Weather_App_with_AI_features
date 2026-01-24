import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "./db";
import { changePasswordSchema, updateUserSchema, users } from "@shared/schema";
import { eq } from "drizzle-orm";

// assumed to already exist
import {
  registerSchema,
  loginSchema,
  publicUserSchema,
  jwtPayloadSchema,
} from "@shared/schema";
import { storage } from "./storage";

/* ------------------------------------------------------------------ */
/* Config */
/* ------------------------------------------------------------------ */

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

/* ------------------------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------------------------ */

function signToken(payload: z.infer<typeof jwtPayloadSchema>) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export async function checkExistingUsername(username: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return rows.length > 0;
} 

export async function checkExistingEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows.length > 0;
}

/* ------------------------------------------------------------------ */
/* Routes */
/* ------------------------------------------------------------------ */

/**
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);

  if (await checkExistingUsername(input.username)) {
    return res.status(400).json({ message: "Username already exists" });
  }

  if (input.email && await checkExistingEmail(input.email)) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const [user] = await db
    .insert(users)
    .values({
      username: input.username,
      email: input.email,
      password: passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      profileImageUrl: input.profileImageUrl || null,
      tokenVersion: 1
    })
    .returning();

  const token = signToken({
    userId: user.id,
    username: user.username,
    tokenVersion: 1,
  });

  const publicUser = publicUserSchema.parse(user);

  res.status(201).json({ user: publicUser, token });
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, input.username))
    .limit(1);

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  await db
    .update(users)
    .set({ tokenVersion: user.tokenVersion + 1 })
    .where(eq(users.id, user.id));

  const token = signToken({
    userId: user.id,
    username: user.username,
    tokenVersion: user.tokenVersion + 1,
  });

  const publicUser = publicUserSchema.parse(user);

  res.json({ user: publicUser, token });
}

/**
 * GET /api/auth/me
 */
export async function me(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user.id))
    .limit(1);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.json(publicUserSchema.parse(user));
}

/**
 * POST /api/auth/change-password
 */
export async function changePassword(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const input = changePasswordSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await db
    .update(users)
    .set({ password: passwordHash })
    .where(eq(users.id, req.user.id));


  res.json({ message: "Password changed successfully" });
}

/**
 * POST /api/auth/logout
 */
export async function logout(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user.id))
    .limit(1);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try{
    await db
    .update(users)
    .set({ tokenVersion: user.tokenVersion + 1 })
    .where(eq(users.id, user.id));

    res.json({ message: "Logged out successfully" });

  } catch (error) {
    return res.status(500).json({ message: "Error Logging out" });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const input = updateUserSchema.parse(req.body);
    const updatedUser = await storage.updateUser(userId, input);

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      profileImageUrl: updatedUser.profileImageUrl,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Middleware */
/* ------------------------------------------------------------------ */

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = header.slice(7);

  try {
    const payload = jwtPayloadSchema.parse(
      jwt.verify(token, JWT_SECRET)
    );
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: payload.userId,
      username: payload.username,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
