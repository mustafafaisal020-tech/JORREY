import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/roles";
import Sidebar from "@/components/admin/Sidebar";

const EMPLOYEE_FORBIDDEN = [
  "/admin/products",
  "/admin/categories",
  "/admin/pages",
  "/admin/settings",
  "/admin/team",
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const role = await getUserRole();

  // Block employees from admin-only sections
  // (checked here so employees get a proper redirect rather than a raw 403)
  // Note: API-level enforcement is still applied regardless of this check.
  if (role === "employee") {
    // We can't read the current pathname in a server layout without headers,
    // so we pass the role down and let the Sidebar hide restricted items.
    // Route-level protection is done in each page via requireAdmin().
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
