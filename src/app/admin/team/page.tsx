import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/roles";
import TeamClient from "./TeamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const role = await getUserRole();
  if (role !== "admin") redirect("/admin");

  return <TeamClient currentUserId={userId} />;
}
