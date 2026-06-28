import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** GET /api/admin/team — list all team members (admin only) */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = await requireAdmin();
  if (denied) return denied;

  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({ limit: 100 });

  const members = users.map((u) => ({
    id: u.id,
    firstName: u.firstName ?? "",
    lastName: u.lastName ?? "",
    email: u.emailAddresses[0]?.emailAddress ?? "",
    role: (u.publicMetadata?.role as string) ?? null,
    banned: u.banned,
    createdAt: u.createdAt,
  }));

  return NextResponse.json(members);
}

/** POST /api/admin/team — create a new team member (admin only) */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = await requireAdmin();
  if (denied) return denied;

  const { firstName, email, password, role } = await req.json() as {
    firstName: string;
    email: string;
    password: string;
    role: "admin" | "employee";
  };

  if (!firstName?.trim() || !email?.trim() || !password || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (role !== "admin" && role !== "employee") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.createUser({
      firstName: firstName.trim(),
      emailAddress: [email.trim()],
      password,
      publicMetadata: { role },
    });
    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      role,
      banned: false,
      createdAt: user.createdAt,
    }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/admin/team]", err);
    const msg = (err as any)?.errors?.[0]?.message ?? "Failed to create member";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
