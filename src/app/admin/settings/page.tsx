import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/roles";
import { getSettings } from "@/lib/settings";
import { getCustomPages } from "@/lib/pages";
import SettingsForm from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const role = await getUserRole();
  if (role !== "admin") redirect("/admin");
  const [settings, availablePages] = await Promise.all([
    getSettings(),
    getCustomPages(true),
  ]);
  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">WhatsApp, currency, footer branding, and connect links</p>
      </div>
      <SettingsForm settings={settings} availablePages={availablePages} />
    </main>
  );
}
