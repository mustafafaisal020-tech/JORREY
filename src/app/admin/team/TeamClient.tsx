"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { UserPlus, ShieldCheck, UserCheck, Ban, RotateCcw, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "employee" | null;
  banned: boolean;
  createdAt: number;
}

interface Props {
  currentUserId: string;
}

const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  admin:    { en: "Admin",    ar: "مسؤول" },
  employee: { en: "Employee", ar: "موظف"  },
};

export default function TeamClient({ currentUserId }: Props) {
  const locale = useLocale();
  const ar = locale === "ar";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New member form
  const [showForm, setShowForm] = useState(false);
  const [fName, setFName]       = useState("");
  const [fEmail, setFEmail]     = useState("");
  const [fPass, setFPass]       = useState("");
  const [fRole, setFRole]       = useState<"admin" | "employee">("employee");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");

  // Inline action state
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/team");
      if (!res.ok) throw new Error();
      const data: Member[] = await res.json();
      setMembers(data.sort((a, b) => a.createdAt - b.createdAt));
    } catch {
      setError(ar ? "فشل تحميل الفريق." : "Failed to load team.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!fName.trim() || !fEmail.trim() || !fPass) {
      setFormError(ar ? "جميع الحقول مطلوبة." : "All fields are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: fName, email: fEmail, password: fPass, role: fRole }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? (ar ? "فشل الإضافة." : "Failed to add.")); return; }
      setMembers((prev) => [...prev, data]);
      setShowForm(false);
      setFName(""); setFEmail(""); setFPass(""); setFRole("employee");
    } catch {
      setFormError(ar ? "فشل الإضافة." : "Failed to add member.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBan(id: string, ban: boolean) {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: ban }),
      });
      if (!res.ok) throw new Error();
      const updated: Member = await res.json();
      setMembers((prev) => prev.map((m) => m.id === id ? updated : m));
    } catch {
      setError(ar ? "فشل تحديث العضو." : "Failed to update member.");
    } finally {
      setActing(null);
    }
  }

  async function handleRoleChange(id: string, role: "admin" | "employee") {
    setActing(id);
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error();
      const updated: Member = await res.json();
      setMembers((prev) => prev.map((m) => m.id === id ? updated : m));
    } catch {
      setError(ar ? "فشل تحديث الدور." : "Failed to update role.");
    } finally {
      setActing(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(ar ? "حذف هذا العضو نهائياً؟" : "Permanently delete this member?")) return;
    setActing(id);
    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError(ar ? "فشل الحذف." : "Failed to delete member.");
    } finally {
      setActing(null);
    }
  }

  return (
    <main className="p-8" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl text-jorrey-black">
            {ar ? "الفريق" : "Team"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {ar ? "إدارة حسابات المسؤولين والموظفين" : "Manage admin and employee accounts"}
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          className="flex items-center gap-2 bg-jorrey-black text-white text-xs tracking-widest uppercase px-4 py-2.5 hover:bg-jorrey-gold hover:text-jorrey-black transition-colors"
        >
          <UserPlus size={14} />
          {ar ? "إضافة عضو" : "Add Member"}
        </button>
      </div>

      {/* Add-member form */}
      {showForm && (
        <form onSubmit={handleCreate} className="border border-gray-200 p-6 mb-8 bg-gray-50 space-y-4">
          <p className="text-xs tracking-widest uppercase text-gray-500 mb-2">
            {ar ? "عضو جديد" : "New Member"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] tracking-widests uppercase text-gray-500">
                {ar ? "الاسم" : "First Name"} *
              </label>
              <input
                value={fName} onChange={(e) => setFName(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-jorrey-black"
                placeholder={ar ? "الاسم الأول" : "First name"}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] tracking-widests uppercase text-gray-500">
                {ar ? "البريد الإلكتروني" : "Email"} *
              </label>
              <input
                type="email" value={fEmail} onChange={(e) => setFEmail(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-jorrey-black"
                placeholder="employee@example.com"
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] tracking-widests uppercase text-gray-500">
                {ar ? "كلمة المرور المؤقتة" : "Temporary Password"} *
              </label>
              <input
                type="password" value={fPass} onChange={(e) => setFPass(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-jorrey-black"
                placeholder="••••••••"
                dir="ltr"
              />
              <p className="text-[10px] text-gray-400">
                {ar ? "شارك هذه الكلمة مع الموظف ليتمكن من تسجيل الدخول." : "Share this with the employee so they can sign in."}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] tracking-widests uppercase text-gray-500">
                {ar ? "الدور" : "Role"}
              </label>
              <div className="relative">
                <select
                  value={fRole} onChange={(e) => setFRole(e.target.value as "admin" | "employee")}
                  className="w-full appearance-none border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-jorrey-black bg-white"
                >
                  <option value="employee">{ar ? "موظف" : "Employee"}</option>
                  <option value="admin">{ar ? "مسؤول" : "Admin"}</option>
                </select>
                <ChevronDown size={12} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-3">
            <button
              type="submit" disabled={submitting}
              className="bg-jorrey-black text-white text-xs tracking-widests uppercase px-5 py-2.5 hover:bg-jorrey-gold hover:text-jorrey-black transition-colors disabled:opacity-50"
            >
              {submitting ? (ar ? "جارٍ الإضافة…" : "Adding…") : (ar ? "إضافة عضو" : "Add Member")}
            </button>
            <button
              type="button" onClick={() => setShowForm(false)}
              className="border border-gray-200 text-xs tracking-widests uppercase px-5 py-2.5 hover:border-gray-400 transition-colors"
            >
              {ar ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

      {/* Members list */}
      {loading ? (
        <p className="text-sm text-gray-400 py-8 text-center">{ar ? "جارٍ التحميل…" : "Loading…"}</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-gray-400 py-12 text-center">
          {ar ? "لا يوجد أعضاء في الفريق بعد." : "No team members yet."}
        </p>
      ) : (
        <div className="border border-gray-100 divide-y divide-gray-100">
          {members.map((m) => {
            const isSelf = m.id === currentUserId;
            const isLoading = acting === m.id;
            const displayName = [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email;
            const roleLabel = m.role ? ROLE_LABELS[m.role]?.[ar ? "ar" : "en"] : "—";

            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-center justify-between px-5 py-4 gap-4",
                  m.banned && "bg-red-50/40 opacity-60"
                )}
              >
                {/* Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-jorrey-black truncate">{displayName}</p>
                    {isSelf && (
                      <span className="text-[9px] tracking-widest uppercase bg-jorrey-beige text-gray-500 px-1.5 py-0.5">
                        {ar ? "أنت" : "You"}
                      </span>
                    )}
                    {m.banned && (
                      <span className="text-[9px] tracking-widest uppercase bg-red-100 text-red-600 px-1.5 py-0.5">
                        {ar ? "معطّل" : "Inactive"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate" dir="ltr">{m.email}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {ar ? "انضم" : "Joined"}{" "}
                    {new Date(m.createdAt).toLocaleDateString(ar ? "ar-AE" : "en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>

                {/* Role badge + actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Role badge */}
                  <span className={cn(
                    "flex items-center gap-1 text-[9px] tracking-widest uppercase font-bold px-2 py-1",
                    m.role === "admin"
                      ? "bg-jorrey-gold/10 text-jorrey-gold"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    {m.role === "admin" ? <ShieldCheck size={10} /> : <UserCheck size={10} />}
                    {roleLabel}
                  </span>

                  {/* Actions (hidden for self) */}
                  {!isSelf && (
                    <div className="flex items-center gap-1">
                      {/* Toggle role */}
                      <button
                        onClick={() => handleRoleChange(m.id, m.role === "admin" ? "employee" : "admin")}
                        disabled={isLoading}
                        title={ar ? "تغيير الدور" : "Change role"}
                        className="p-1.5 text-gray-400 hover:text-jorrey-black transition-colors disabled:opacity-40"
                      >
                        <ShieldCheck size={14} />
                      </button>

                      {/* Ban / unban */}
                      <button
                        onClick={() => handleBan(m.id, !m.banned)}
                        disabled={isLoading}
                        title={m.banned ? (ar ? "تفعيل" : "Reactivate") : (ar ? "تعطيل" : "Deactivate")}
                        className={cn(
                          "p-1.5 transition-colors disabled:opacity-40",
                          m.banned
                            ? "text-green-500 hover:text-green-700"
                            : "text-gray-400 hover:text-orange-500"
                        )}
                      >
                        {m.banned ? <RotateCcw size={14} /> : <Ban size={14} />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={isLoading}
                        title={ar ? "حذف" : "Delete"}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
