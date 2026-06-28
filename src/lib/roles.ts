import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export type Role = "admin" | "employee";

export async function getUserRole(): Promise<Role | null> {
  const user = await currentUser();
  if (!user) return null;
  return (user.publicMetadata?.role as Role) ?? null;
}

/** Returns a 403 response if the caller is not an admin, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const role = await getUserRole();
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Returns a 403 response if the caller is not admin or employee, otherwise null. */
export async function requireStaff(): Promise<NextResponse | null> {
  const role = await getUserRole();
  if (role !== "admin" && role !== "employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
