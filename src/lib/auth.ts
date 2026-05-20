import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";
import { auth } from "./better-auth";
import { CHARACTER_DATA } from "./characters";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      image: true,
      selectedCharacterId: true,
      selectedCharacter: true,
    },
  });
}

function getFallbackAuthOrigin() {
  return (
    process.env.AUTH_CANONICAL_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  );
}

export async function getAuthHeaders(request?: Request) {
  const headersList = new Headers();

  if (request) {
    request.headers.forEach((value, key) => {
      headersList.set(key, value);
    });
  }

  const nextHeaders = await headers();
  nextHeaders.forEach((value, key) => {
    if (!headersList.has(key)) {
      headersList.set(key, value);
    }
  });

  if (!headersList.has("cookie")) {
    const cookieHeader = (await cookies())
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    if (cookieHeader) headersList.set("cookie", cookieHeader);
  }

  if (!headersList.has("host") && !headersList.has("x-forwarded-host")) {
    const authOrigin = new URL(getFallbackAuthOrigin());
    headersList.set("host", authOrigin.host);
    headersList.set("x-forwarded-host", authOrigin.host);
    headersList.set("x-forwarded-proto", authOrigin.protocol.replace(":", ""));
  }

  return headersList;
}

async function getDefaultCharacterId() {
  const preferred = await prisma.character.findUnique({
    where: { name: "Miyuki Asakura" },
    select: { id: true },
  });
  if (preferred) return preferred.id;

  const first = await prisma.character.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (first) return first.id;

  const seeded = await prisma.character.create({
    data: CHARACTER_DATA[4],
    select: { id: true },
  });
  return seeded.id;
}

async function ensureSelectedCharacter(userId: string, selectedCharacterId?: string | null) {
  if (selectedCharacterId) return getUserById(userId);

  const defaultCharacterId = await getDefaultCharacterId();
  await prisma.user.update({
    where: { id: userId },
    data: { selectedCharacterId: defaultCharacterId },
  });
  return getUserById(userId);
}

async function getOrCreateGuestUser() {
  const guestUsername = "guest";
  let user = await prisma.user.findUnique({ where: { username: guestUsername } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        username: guestUsername,
        name: "Guest",
        selectedCharacterId: await getDefaultCharacterId(),
      },
    });
  }
  return ensureSelectedCharacter(user.id, user.selectedCharacterId);
}

export async function getCurrentUser(request?: Request) {
  const cookieStore = await cookies();

  const jwtToken = cookieStore.get("token")?.value;
  if (jwtToken) {
    const decoded = verifyToken(jwtToken);
    if (decoded) {
      const user = await getUserById(decoded.userId);
      if (user) return ensureSelectedCharacter(user.id, user.selectedCharacterId);
    }
  }

  try {
    const session = await auth.api.getSession({
      headers: await getAuthHeaders(request),
    });
    if (session?.user?.id) {
      const user = await getUserById(session.user.id);
      if (user) return ensureSelectedCharacter(user.id, user.selectedCharacterId);
    }
  } catch (error) {
    console.error("Better Auth session lookup failed:", error);
  }

  // Login disabled: fall back to a shared guest user so every API route
  // works without authentication.
  return getOrCreateGuestUser();
}
