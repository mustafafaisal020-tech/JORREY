import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/roles";

export const dynamic = "force-dynamic";

/** PATCH /api/admin/team/[id] — update role or ban status (admin only) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json() as { role?: "admin" | "employee"; banned?: boolean };

  try {
    const clerk = await clerkClient();

    if (body.banned === true) {
      await clerk.users.banUser(id);
    } else if (body.banned === false) {
      await clerk.users.unbanUser(id);
    }

    if (body.role) {
      if (body.role !== "admin" && body.role !== "employee") {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      await clerk.users.updateUserMetadata(id, {
        publicMetadata: { role: body.role },
      });
    }

    const updated = await clerk.users.getUser(id);
    return NextResponse.json({
      id: updated.id,
      firstName: updated.firstName ?? "",
      lastName: updated.lastName ?? "",
      email: updated.emailAddresses[0]?.emailAddress ?? "",
      role: (updated.publicMetadata?.role as string) ?? null,
      banned: updated.banned,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/team/:id]", err);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

/** DELETE /api/admin/team/[id] — permanently delete a member (admin only) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  // Prevent self-deletion
  if (id === userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/team/:id]", err);
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 });
  }
}
