"use client";

import { useState, useEffect, useCallback } from "react";
import { useSignIn, useSignUp, useUser, useClerk } from "@clerk/nextjs";
import { X, LogOut, User as UserIcon, Mail, Lock, Eye, EyeOff, Check, Phone, MapPin } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomerProfile } from "@/lib/customer-types";

interface Props {
  open: boolean;
  onClose: () => void;
}

type AuthTab = "signin" | "signup";

export default function CustomerAccountModal({ open, onClose }: Props) {
  const t = useTranslations("account");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const { user, isLoaded: userLoaded } = useUser();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { signOut } = useClerk();

  // ── Auth state ──────────────────────────────────────────────
  const [tab, setTab] = useState<AuthTab>("signin");
  const [showPass, setShowPass] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [siEmail, setSiEmail] = useState("");
  const [siPass, setSiPass] = useState("");
  const [suFirst, setSuFirst] = useState("");
  const [suLast, setSuLast] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPass, setSuPass] = useState("");

  // ── Profile state ───────────────────────────────────────────
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [pFirst, setPFirst] = useState("");
  const [pLast, setPLast] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pStreet, setPStreet] = useState("");
  const [pCity, setPCity] = useState("");
  const [pDistrict, setPDistrict] = useState("");
  const [pCountry, setPCountry] = useState("");
  const [pZip, setPZip] = useState("");

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const res = await fetch("/api/customers/me");
      if (res.ok) {
        const data: CustomerProfile | null = await res.json();
        setProfile(data);
        if (data) {
          setPFirst(data.firstName ?? "");
          setPLast(data.lastName ?? "");
          setPPhone(data.phone ?? "");
          setPStreet(data.address?.street ?? "");
          setPCity(data.address?.city ?? "");
          setPDistrict(data.address?.district ?? "");
          setPCountry(data.address?.country ?? "");
          setPZip(data.address?.zipCode ?? "");
        } else {
          // Seed from Clerk user
          setPFirst(user.firstName ?? "");
          setPLast(user.lastName ?? "");
        }
      }
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) loadProfile();
  }, [open, user, loadProfile]);

  function clerkErrMsg(err: unknown): string {
    const e = err as { errors?: Array<{ longMessage?: string; message?: string }> };
    return e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? "Something went wrong.";
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;
    setAuthLoading(true); setAuthError("");
    try {
      const { error: pwErr } = await signIn.password({ emailAddress: siEmail, password: siPass });
      if (pwErr) { setAuthError(pwErr.longMessage ?? pwErr.message ?? "Incorrect email or password."); return; }
      if (signIn.status === "complete") { await signIn.finalize(); }
      else { setAuthError("Additional verification required. Please try again."); }
    } catch (err) { setAuthError(clerkErrMsg(err)); }
    finally { setAuthLoading(false); }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setAuthLoading(true); setAuthError("");
    try {
      const { error: suErr } = await signUp.password({ emailAddress: suEmail, password: suPass, firstName: suFirst, lastName: suLast || undefined });
      if (suErr) { setAuthError(suErr.longMessage ?? suErr.message ?? "Could not create account."); return; }
      if (signUp.status === "complete") { await signUp.finalize(); return; }
      const { error: codeErr } = await signUp.verifications.sendEmailCode();
      if (codeErr) { setAuthError(codeErr.longMessage ?? codeErr.message ?? "Could not send code."); return; }
      setVerifyEmail(suEmail);
      setVerifying(true);
    } catch (err) { setAuthError(clerkErrMsg(err)); }
    finally { setAuthLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setAuthLoading(true); setAuthError("");
    try {
      const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyErr) { setAuthError(verifyErr.longMessage ?? verifyErr.message ?? "Invalid code."); return; }
      if (signUp.status === "complete") { await signUp.finalize(); }
      else { setAuthError("Verification incomplete. Please try again."); }
    } catch (err) { setAuthError(clerkErrMsg(err)); }
    finally { setAuthLoading(false); }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true); setProfileError(""); setProfileSaved(false);
    try {
      const payload = {
        email: user?.primaryEmailAddress?.emailAddress ?? "",
        firstName: pFirst,
        lastName: pLast || undefined,
        phone: pPhone || undefined,
        address: { street: pStreet || undefined, city: pCity || undefined, district: pDistrict || undefined, country: pCountry || undefined, zipCode: pZip || undefined },
      };
      const res = await fetch("/api/customers/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { setProfileError("Could not save profile."); return; }
      const saved: CustomerProfile = await res.json();
      setProfile(saved);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch { setProfileError("Network error."); }
    finally { setProfileSaving(false); }
  }

  function handleClose() {
    setSiEmail(""); setSiPass(""); setSuFirst(""); setSuLast(""); setSuEmail(""); setSuPass("");
    setAuthError(""); setVerifying(false); setCode(""); setShowPass(false);
    setProfileError(""); setProfileSaved(false);
    onClose();
  }

  const inp = "rounded-none border-gray-200 text-sm focus-visible:ring-0 focus-visible:border-jorrey-black";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          className={cn(
            "fixed z-50 bg-white shadow-2xl outline-none overflow-y-auto",
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-[94vw] max-w-md max-h-[90vh]",
            "duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          )}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 className="font-serif text-lg text-jorrey-black tracking-wide">
              {userLoaded && user ? t("title") : tab === "signin" ? t("sign_in") : t("register")}
            </h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1">
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-6">

            {/* ── Signed-in: profile editor ── */}
            {userLoaded && user ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">

                {/* Avatar strip */}
                <div className="flex items-center gap-3 bg-jorrey-beige/30 px-4 py-3 -mx-1">
                  <div className="w-9 h-9 bg-jorrey-gold/20 flex items-center justify-center flex-shrink-0">
                    <UserIcon size={16} className="text-jorrey-gold" />
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>

                {profileLoading ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
                ) : (
                  <>
                    {/* Name */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <UserIcon size={12} className="text-gray-400" />
                        <span className="text-[10px] tracking-widest uppercase text-gray-400">{t("profile")}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] tracking-widests uppercase text-gray-500">{t("first_name")} *</Label>
                          <Input value={pFirst} onChange={(e) => setPFirst(e.target.value)} required className={inp} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] tracking-widests uppercase text-gray-500">{t("last_name")}</Label>
                          <Input value={pLast} onChange={(e) => setPLast(e.target.value)} className={inp} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] tracking-widests uppercase text-gray-500">{t("phone")}</Label>
                        <div className="relative">
                          <Phone size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <Input type="tel" value={pPhone} onChange={(e) => setPPhone(e.target.value)} className={cn(inp, "ps-9")} placeholder="+971 50 000 0000" />
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-3 border-t border-gray-100 pt-5">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin size={12} className="text-gray-400" />
                        <span className="text-[10px] tracking-widest uppercase text-gray-400">{t("address_section")}</span>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] tracking-widests uppercase text-gray-500">{t("street")}</Label>
                        <Input value={pStreet} onChange={(e) => setPStreet(e.target.value)} className={inp} placeholder="123 Main St" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] tracking-widests uppercase text-gray-500">{t("country")}</Label>
                          <Input value={pCountry} onChange={(e) => setPCountry(e.target.value)} className={inp} placeholder="UAE" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] tracking-widests uppercase text-gray-500">{t("city")}</Label>
                          <Input value={pCity} onChange={(e) => setPCity(e.target.value)} className={inp} placeholder="Dubai" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] tracking-widests uppercase text-gray-500">{t("district")}</Label>
                          <Input value={pDistrict} onChange={(e) => setPDistrict(e.target.value)} className={inp} placeholder="Al Barsha" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] tracking-widests uppercase text-gray-500">{t("zip")}</Label>
                          <Input value={pZip} onChange={(e) => setPZip(e.target.value)} className={inp} placeholder="00000" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {profileError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2">{profileError}</p>}

                <div className="flex gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={profileSaving || profileLoading}
                    className="flex-1 rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widests uppercase font-semibold py-4 transition-colors"
                  >
                    {profileSaved ? <><Check size={12} className="me-1.5" />{t("saved")}</> : profileSaving ? t("saving") : t("save")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { signOut(); onClose(); }}
                    className="rounded-none border-gray-200 text-xs tracking-widests uppercase text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors py-4 px-4"
                  >
                    <LogOut size={12} />
                  </Button>
                </div>
              </form>

            ) : (
              <>
                {/* ── Auth tabs ── */}
                <div className="flex border-b border-gray-100 mb-6 -mx-6 px-6">
                  {(["signin", "signup"] as AuthTab[]).map((t2) => (
                    <button
                      key={t2}
                      type="button"
                      onClick={() => { setTab(t2); setAuthError(""); setVerifying(false); }}
                      className={cn(
                        "flex-1 pb-3 text-xs tracking-widest uppercase font-medium transition-colors border-b-2 -mb-px",
                        tab === t2 ? "border-jorrey-black text-jorrey-black" : "border-transparent text-gray-400 hover:text-gray-600",
                      )}
                    >
                      {t2 === "signin" ? t("sign_in") : t("register")}
                    </button>
                  ))}
                </div>

                {authError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 mb-4">{authError}</p>}

                {/* Sign In */}
                {tab === "signin" && (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="relative">
                      <Mail size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <Input type="email" placeholder={t("email")} value={siEmail} onChange={(e) => setSiEmail(e.target.value)} required className={cn(inp, "ps-9")} />
                    </div>
                    <div className="relative">
                      <Lock size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <Input type={showPass ? "text" : "password"} placeholder={t("password")} value={siPass} onChange={(e) => setSiPass(e.target.value)} required className={cn(inp, "ps-9 pe-9")} />
                      <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <Button type="submit" disabled={authLoading} className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors">
                      {authLoading ? t("signing_in") : t("sign_in")}
                    </Button>
                  </form>
                )}

                {/* Sign Up */}
                {tab === "signup" && !verifying && (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder={t("first_name")} value={suFirst} onChange={(e) => setSuFirst(e.target.value)} required className={inp} />
                      <Input placeholder={t("last_name")} value={suLast} onChange={(e) => setSuLast(e.target.value)} className={inp} />
                    </div>
                    <div className="relative">
                      <Mail size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <Input type="email" placeholder={t("email")} value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required className={cn(inp, "ps-9")} />
                    </div>
                    <div className="relative">
                      <Lock size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <Input type={showPass ? "text" : "password"} placeholder={t("password")} value={suPass} onChange={(e) => setSuPass(e.target.value)} required className={cn(inp, "ps-9 pe-9")} />
                      <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <Button type="submit" disabled={authLoading} className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors">
                      {authLoading ? t("creating") : t("register")}
                    </Button>
                  </form>
                )}

                {/* Email verification */}
                {tab === "signup" && verifying && (
                  <form onSubmit={handleVerify} className="space-y-4">
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {t("verify_desc").replace("{email}", verifyEmail)}
                    </p>
                    <Input placeholder={t("verify_placeholder")} value={code} onChange={(e) => setCode(e.target.value)} required className={cn(inp, "text-center tracking-widest font-mono")} maxLength={6} />
                    <Button type="submit" disabled={authLoading} className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors">
                      {authLoading ? t("verifying") : t("verify_btn")}
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
