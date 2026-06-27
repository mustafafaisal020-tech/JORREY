"use client";

import { useState, useEffect, useCallback } from "react";
import { useSignIn, useSignUp, useUser, useClerk } from "@clerk/nextjs";
import {
  X,
  LogOut,
  User as UserIcon,
  Check,
  Phone,
  AtSign,
  MapPin,
  Heart,
  Bell,
  ShoppingBag,
  Trash2,
  TrendingDown,
  PackageCheck,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomerProfile, NotificationChannel } from "@/lib/customer-types";
import type { Order } from "@/lib/order-types";
import type { Product } from "@/lib/product-types";
import { categoryHasSizes } from "@/lib/product-types";
import { useCart } from "./CartProvider";
import { useUserLists } from "./UserListsProvider";

interface Props {
  open: boolean;
  onClose: () => void;
}

type AccountTab = "profile" | "orders" | "favorites" | "watchlist" | "notifications";

export default function CustomerAccountModal({ open, onClose }: Props) {
  const t = useTranslations("account");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const { user, isLoaded: userLoaded } = useUser();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { signOut, setActive } = useClerk();
  const { addItem } = useCart();
  const {
    favorites,
    watchlist,
    notifications,
    unreadNotifications,
    toggleFavorite,
    toggleWatchlist,
    updateWatchlistPrefs,
    markAllRead,
  } = useUserLists();

  // ── Identifier-first auth state ─────────────────────────────
  // step: "phone" → enter phone or email; "otp" → enter WhatsApp code (phone path);
  //       "register" → new user (phone path), enter name/email;
  //       "email-verify" → Clerk email OTP;
  //       "signing_in" → establishing session
  type AuthStep = "phone" | "otp" | "register" | "email-verify" | "signing_in";
  const [authStep, setAuthStep] = useState<AuthStep>("phone");
  // authIdentifier holds whatever the customer typed: a phone number or email address
  const [authIdentifier, setAuthIdentifier] = useState("");
  const [authIdentifierError, setAuthIdentifierError] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [clerkEmailCode, setClerkEmailCode] = useState("");
  // "signup"|"signin" when in the direct-email path (step 1 was an email);
  // null when in the phone-OTP path (email-verify reached via register step)
  const [authEmailFlow, setAuthEmailFlow] = useState<"signup" | "signin" | null>(null);
  // Registration extras (only for phone-path new users)
  const [regFirstName, setRegFirstName] = useState("");
  const [regEmail, setRegEmail] = useState("");

  // ── Orders state ────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // ── Account tab state ────────────────────────────────────────
  const [accountTab, setAccountTab] = useState<AccountTab>("profile");

  // ── Profile state ───────────────────────────────────────────
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [pFirst, setPFirst] = useState("");
  const [pLast, setPLast] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pWhatsapp, setPWhatsapp] = useState("");
  const [pStreet, setPStreet] = useState("");
  const [pCity, setPCity] = useState("");
  const [pDistrict, setPDistrict] = useState("");
  const [pCountry, setPCountry] = useState("");
  const [pZip, setPZip] = useState("");

  // ── Favorites: add-to-bag flow ───────────────────────────────
  const [bagProduct, setBagProduct] = useState<Product | null>(null);
  const [bagFetching, setBagFetching] = useState<string | null>(null);
  const [bagSize, setBagSize] = useState("");
  const [bagAdded, setBagAdded] = useState<string | null>(null);

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
          setPWhatsapp(data.whatsappNumber ?? "");
          setPStreet(data.address?.street ?? "");
          setPCity(data.address?.city ?? "");
          setPDistrict(data.address?.district ?? "");
          setPCountry(data.address?.country ?? "");
          setPZip(data.address?.zipCode ?? "");
        } else {
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

  // Load orders when orders tab is active
  useEffect(() => {
    if (accountTab !== "orders" || !user) return;
    setOrdersLoading(true);
    fetch("/api/customers/me/orders")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Order[]) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [accountTab, user]);


  // Mark notifications read when notifications tab is opened
  useEffect(() => {
    if (accountTab === "notifications" && unreadNotifications > 0) {
      markAllRead();
    }
  }, [accountTab, unreadNotifications, markAllRead]);

  function isEmailIdentifier(val: string): boolean {
    return val.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function looksLikeEmail(val: string): boolean {
    return val.includes("@");
  }

  function normalisePhone(raw: string): string {
    let s = raw.replace(/[\s\-().]/g, "");
    if (s.startsWith("00")) s = "+" + s.slice(2);
    if (!s.startsWith("+")) s = "+" + s;
    if (/^\+0[7-9]\d{8,9}$/.test(s)) s = "+964" + s.slice(2);
    return s;
  }

  function validateIdentifier(raw: string): string {
    const val = raw.trim();
    if (!val) return isRTL ? "مطلوب" : "This field is required";
    if (looksLikeEmail(val)) {
      if (!isEmailIdentifier(val)) return isRTL ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address";
    } else {
      const digits = val.replace(/\D/g, "");
      if (digits.length < 7) return isRTL ? "يرجى إدخال رقم هاتف صحيح" : "Please enter a valid phone number";
    }
    return "";
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const err = validateIdentifier(authIdentifier);
    if (err) { setAuthIdentifierError(err); return; }
    setAuthIdentifierError("");
    setAuthError("");
    setAuthLoading(true);

    const val = authIdentifier.trim();

    try {
      if (isEmailIdentifier(val)) {
        // ── EMAIL PATH: use Clerk's native email verification ──
        if (!signUp) throw new Error("signUp not ready");
        console.log("[auth] signUp.create →", val);
        const { error: createErr } = await signUp.create({ emailAddress: val });
        console.log("[auth] signUp.create result — error:", createErr, "status:", signUp.status, "isTransferable:", (signUp as any).isTransferable);
        if (createErr) throw createErr;

        if ((signUp as any).isTransferable) {
          // Existing user — switch to sign-in flow
          if (!signIn) throw new Error("signIn not ready");
          console.log("[auth] transferable → signIn.create");
          const { error: siErr } = await (signIn as any).create({ identifier: val });
          console.log("[auth] signIn.create result — error:", siErr, "status:", (signIn as any).status);
          if (siErr) throw siErr;
          console.log("[auth] emailCode.sendCode →");
          const { error: sendErr } = await (signIn as any).emailCode.sendCode();
          console.log("[auth] emailCode.sendCode result — error:", sendErr);
          if (sendErr) throw sendErr;
          setAuthEmailFlow("signin");
        } else {
          // New user — sign-up flow.
          // create() may have already initiated email verification (auto-send in production).
          // Only call sendEmailCode() if no verification strategy is set yet.
          const alreadySent = !!signUp.verifications.emailAddress.strategy;
          console.log("[auth] new user — alreadySent:", alreadySent, "emailVerif:", signUp.verifications.emailAddress);
          if (!alreadySent) {
            const { error: sendErr } = await signUp.verifications.sendEmailCode();
            console.log("[auth] verifications.sendEmailCode result — error:", sendErr);
            if (sendErr) throw sendErr;
          }
          setAuthEmailFlow("signup");
        }
        setAuthStep("email-verify");
      } else {
        // ── PHONE PATH: WhatsApp OTP ──
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: normalisePhone(val), locale }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error ?? "Could not send code.");
          return;
        }
        setAuthStep("otp");
      }
    } catch (err: unknown) {
      console.error("[auth] handleSendOtp error:", err);
      const msg = (err as any)?.message ?? (err as any)?.longMessage ?? "";
      if (msg.toLowerCase().includes("exist") || msg.toLowerCase().includes("taken")) {
        setAuthError(isRTL ? "يوجد حساب بهذا البريد. جرّب تسجيل الدخول." : "An account with this email already exists.");
      } else {
        setAuthError(isRTL ? "تعذّر إرسال الرمز. حاول مرة أخرى." : "Could not send code. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!authOtp || authOtp.length < 6) {
      setAuthError(isRTL ? "أدخل الرمز المكون من 6 أرقام" : "Enter the 6-digit code.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const phone = normalisePhone(authIdentifier);
      // Exchange OTP for a short-lived verified-phone token
      const verifyRes = await fetch("/api/auth/phone-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: authOtp }),
      });
      if (!verifyRes.ok) {
        const { error } = await verifyRes.json();
        setAuthError(error ?? "Invalid code.");
        return;
      }
      const { verifiedToken: vt } = await verifyRes.json();
      setVerifiedToken(vt);

      // Try to sign in — will 404 if no account exists
      const siRes = await fetch("/api/auth/phone-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedToken: vt }),
      });

      if (siRes.ok) {
        // Account found — create Clerk session
        const { token } = await siRes.json();
        await clerkSignInWithToken(token);
      } else if (siRes.status === 404) {
        // No account — ask user to register
        setAuthStep("register");
      } else {
        const { error } = await siRes.json();
        setAuthError(error ?? "Sign-in failed.");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regFirstName.trim()) {
      setAuthError(isRTL ? "الاسم مطلوب" : "Name is required.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);

    const email = regEmail.trim();

    try {
      if (email) {
        // Email provided → use Clerk's native signUp so Clerk sends the verification code
        if (!signUp) throw new Error("signUp not ready");
        const { error: createErr } = await signUp.create({ emailAddress: email, firstName: regFirstName.trim() });
        if (createErr) throw new Error(createErr.message ?? "clerk create failed");
        const { error: sendErr } = await signUp.verifications.sendEmailCode();
        if (sendErr) throw new Error(sendErr.message ?? "clerk send email failed");
        setAuthStep("email-verify");
      } else {
        // Phone-only → server creates Clerk account with phone as identifier
        const res = await fetch("/api/auth/phone-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verifiedToken, firstName: regFirstName.trim() }),
        });
        if (!res.ok) {
          const { error } = await res.json();
          if (error === "already_exists") {
            setAuthError(t("account_exists_error"));
          } else if (error === "Token expired. Please restart verification.") {
            setAuthStep("phone");
            setAuthOtp("");
            setVerifiedToken("");
            setAuthError(isRTL ? "انتهت صلاحية الجلسة. ابدأ من جديد." : "Session expired. Please start over.");
          } else {
            setAuthError(error ?? "Registration failed.");
          }
          return;
        }
        const { token } = await res.json();
        await clerkSignInWithToken(token);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email") && msg.includes("exist")) {
        setAuthError(isRTL ? "يوجد حساب بهذا البريد. جرّب تسجيل الدخول." : "An account with this email already exists. Try signing in.");
      } else {
        setAuthError(isRTL ? "فشل إنشاء الحساب. حاول مرة أخرى." : "Registration failed. Please try again.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleClerkEmailVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!clerkEmailCode || clerkEmailCode.length < 6) {
      setAuthError(isRTL ? "أدخل الرمز المكون من 6 أرقام" : "Enter the 6-digit code.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authEmailFlow === "signin") {
        // Existing user, direct-email path — verify via signIn
        const { error: verifyErr } = await (signIn as any).emailCode.verifyCode({ code: clerkEmailCode });
        if (verifyErr) {
          setAuthError(isRTL ? "رمز غير صحيح أو منتهي الصلاحية." : "Incorrect or expired code.");
          return;
        }
        if ((signIn as any).status === "complete" && (signIn as any).createdSessionId) {
          setAuthStep("signing_in");
          await setActive({ session: (signIn as any).createdSessionId });
          // Existing user — profile already exists in Blob store, no need to re-create
        } else {
          setAuthError(isRTL ? "فشل تسجيل الدخول. حاول مرة أخرى." : "Sign-in failed. Please try again.");
        }
      } else {
        // New user — either direct-email signup or phone-path register step
        if (!signUp) return;
        console.log("[auth] verifyEmailCode → code:", clerkEmailCode);
        const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code: clerkEmailCode });
        console.log("[auth] verifyEmailCode result — error:", verifyErr, "status:", signUp.status, "missingFields:", signUp.missingFields);
        if (verifyErr) {
          // "already_verified" means the code was correct on a previous attempt but we
          // didn't advance because of missing_requirements — skip past verification.
          const isAlreadyVerified = (verifyErr as any)?.code === "verification_already_verified"
            || (verifyErr as any)?.errors?.[0]?.code === "verification_already_verified";
          if (!isAlreadyVerified) {
            setAuthError(isRTL ? "رمز غير صحيح أو منتهي الصلاحية." : "Incorrect or expired code.");
            return;
          }
          console.log("[auth] already_verified — proceeding to satisfy missing fields");
        }

        // Satisfy any required fields the production instance demands (e.g. first_name)
        if (signUp.status === "missing_requirements" && signUp.missingFields.length > 0) {
          console.log("[auth] missing fields:", signUp.missingFields);
          const updates: Record<string, string> = {};
          if (signUp.missingFields.includes("first_name")) {
            // Use the name from the register step if available; else derive from email
            updates.firstName = regFirstName.trim() || authIdentifier.split("@")[0];
          }
          if (Object.keys(updates).length > 0) {
            const { error: updateErr } = await signUp.update(updates);
            console.log("[auth] update result — error:", updateErr, "status:", signUp.status);
            if (updateErr) throw updateErr;
          }
        }

        if (signUp.status === "complete") {
          setAuthStep("signing_in");
          const { error: finalizeErr } = await signUp.finalize();
          console.log("[auth] finalize result — error:", finalizeErr);
          if (finalizeErr) throw finalizeErr;
          // Create customer profile in Blob store
          // authEmailFlow === "signup" → came from step 1 email, no phone
          // authEmailFlow === null    → came from register step, authIdentifier is the phone
          const phone = authEmailFlow === "signup" ? "" : normalisePhone(authIdentifier);
          const email = authEmailFlow === "signup" ? authIdentifier.trim() : regEmail.trim();
          const firstName = regFirstName.trim() || authIdentifier.split("@")[0];
          await fetch("/api/auth/init-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, firstName, email }),
          });
        } else {
          console.log("[auth] signup not complete after satisfying fields, status:", signUp.status, "missing:", signUp.missingFields);
          setAuthError(isRTL ? "فشل إنشاء الحساب. حاول مرة أخرى." : "Could not complete sign-up. Please try again.");
        }
      }
    } catch {
      setAuthError(isRTL ? "رمز غير صحيح. حاول مرة أخرى." : "Incorrect code. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleResendClerkEmail() {
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authEmailFlow === "signin") {
        console.log("[auth] resend → signIn emailCode.sendCode");
        const { error } = await (signIn as any).emailCode.sendCode();
        console.log("[auth] resend signIn result — error:", error);
        if (error) throw error;
      } else {
        if (!signUp) { console.log("[auth] resend — signUp is null"); return; }
        console.log("[auth] resend → signUp verifications.sendEmailCode, emailVerif:", signUp.verifications.emailAddress);
        const { error } = await signUp.verifications.sendEmailCode();
        console.log("[auth] resend signUp result — error:", error);
        if (error) throw error;
      }
    } catch (err) {
      console.error("[auth] resend error:", err);
      setAuthError(isRTL ? "تعذّر إعادة الإرسال." : "Could not resend. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function clerkSignInWithToken(token: string) {
    if (!signIn || !setActive) return;
    setAuthStep("signing_in");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (signIn as any).create({ strategy: "ticket", ticket: token });
      const sessionId = result?.createdSessionId ?? result?.session?.id;
      if (sessionId) {
        await setActive({ session: sessionId });
      } else {
        setAuthStep("phone");
        setAuthError(isRTL ? "فشل تسجيل الدخول. حاول مرة أخرى." : "Sign-in failed. Please try again.");
      }
    } catch {
      setAuthStep("phone");
      setAuthError(isRTL ? "فشل تسجيل الدخول. حاول مرة أخرى." : "Sign-in failed. Please try again.");
    }
  }

  async function handleResendOtp() {
    setAuthError("");
    setAuthLoading(true);
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalisePhone(authIdentifier), locale }),
      });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      const payload = {
        email: user?.primaryEmailAddress?.emailAddress ?? "",
        firstName: pFirst,
        lastName: pLast || undefined,
        phone: pPhone || undefined,
        whatsappNumber: pWhatsapp || undefined,
        address: {
          street: pStreet || undefined,
          city: pCity || undefined,
          district: pDistrict || undefined,
          country: pCountry || undefined,
          zipCode: pZip || undefined,
        },
      };
      const res = await fetch("/api/customers/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setProfileError("Could not save profile.");
        return;
      }
      const saved: CustomerProfile = await res.json();
      setProfile(saved);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      setProfileError("Network error.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAddToBag(productId: string) {
    if (bagFetching) return;
    setBagFetching(productId);
    setBagProduct(null);
    setBagSize("");
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) return;
      const product: Product = await res.json();
      const needsSize = categoryHasSizes(product.category) && product.sizes.length > 0;
      if (!needsSize) {
        const statusArr = product.status ?? [];
        const price =
          statusArr.includes("On Sale") && product.salePrice
            ? product.salePrice
            : product.price;
        addItem({
          productId: product.id,
          name: product.name,
          nameAr: product.nameAr,
          price,
          sku: product.sku,
          color: product.color,
          size: "One Size",
          image: product.image,
          category: product.category,
        });
        setBagAdded(productId);
        setTimeout(() => setBagAdded(null), 2000);
      } else {
        setBagProduct(product);
      }
    } finally {
      setBagFetching(null);
    }
  }

  function confirmAddToBag() {
    if (!bagProduct || !bagSize) return;
    const statusArr = bagProduct.status ?? [];
    const price =
      statusArr.includes("On Sale") && bagProduct.salePrice
        ? bagProduct.salePrice
        : bagProduct.price;
    addItem({
      productId: bagProduct.id,
      name: bagProduct.name,
      nameAr: bagProduct.nameAr,
      price,
      sku: bagProduct.sku,
      color: bagProduct.color,
      size: bagSize,
      image: bagProduct.image,
      category: bagProduct.category,
    });
    setBagAdded(bagProduct.id);
    setBagProduct(null);
    setBagSize("");
    setTimeout(() => setBagAdded(null), 2000);
  }

  function handleClose() {
    setAuthStep("phone");
    setAuthIdentifier("");
    setAuthIdentifierError("");
    setAuthEmailFlow(null);
    setAuthOtp("");
    setAuthError("");
    setVerifiedToken("");
    setClerkEmailCode("");
    setRegFirstName("");
    setRegEmail("");
    setProfileError("");
    setProfileSaved(false);
    setBagProduct(null);
    setBagSize("");
    onClose();
  }

  const inp =
    "rounded-none border-gray-200 text-sm focus-visible:ring-0 focus-visible:border-jorrey-black";

  const ACCOUNT_TABS = [
    { id: "profile" as AccountTab, icon: UserIcon, label: t("tab_profile") },
    { id: "orders" as AccountTab, icon: ShoppingBag, label: t("tab_orders") },
    {
      id: "favorites" as AccountTab,
      icon: Heart,
      label: t("tab_favorites"),
      count: favorites.length,
    },
    {
      id: "watchlist" as AccountTab,
      icon: Bell,
      label: t("tab_watchlist"),
      count: watchlist.length,
    },
    {
      id: "notifications" as AccountTab,
      icon: Bell,
      label: t("tab_notifications"),
      badge: unreadNotifications,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          className={cn(
            "fixed z-50 bg-white shadow-2xl outline-none overflow-y-auto",
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-[94vw] max-w-lg max-h-[90vh]",
            "duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
          )}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h2 className="font-serif text-lg text-jorrey-black tracking-wide">
              {userLoaded && user
                ? t("title")
                : authStep === "register"
                ? t("complete_registration")
                : t("sign_in")}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-6">
            {/* ── Signed-in ── */}
            {userLoaded && user ? (
              <div>
                {/* Avatar strip */}
                <div className="flex items-center gap-3 bg-jorrey-beige/30 px-4 py-3 -mx-1 mb-4">
                  <div className="w-9 h-9 bg-jorrey-gold/20 flex items-center justify-center flex-shrink-0">
                    <UserIcon size={16} className="text-jorrey-gold" />
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      onClose();
                    }}
                    className="ms-auto text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>

                {/* Tab bar */}
                <div className="flex border-b border-gray-100 mb-6 -mx-6 px-6 overflow-x-auto">
                  {ACCOUNT_TABS.map(({ id, icon: Icon, label, count, badge }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAccountTab(id)}
                      className={cn(
                        "flex items-center gap-1.5 pb-3 text-[10px] tracking-widest uppercase font-medium transition-colors border-b-2 -mb-px whitespace-nowrap pe-5",
                        accountTab === id
                          ? "border-jorrey-black text-jorrey-black"
                          : "border-transparent text-gray-400 hover:text-gray-600"
                      )}
                    >
                      <Icon size={11} />
                      {label}
                      {count != null && count > 0 && (
                        <span className="bg-jorrey-beige text-gray-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {count}
                        </span>
                      )}
                      {badge != null && badge > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* ── Profile tab ── */}
                {accountTab === "profile" && (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {profileLoading ? (
                      <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-1">
                            <UserIcon size={12} className="text-gray-400" />
                            <span className="text-[10px] tracking-widest uppercase text-gray-400">
                              {t("profile")}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] tracking-widests uppercase text-gray-500">
                                {t("first_name")} *
                              </Label>
                              <Input
                                value={pFirst}
                                onChange={(e) => setPFirst(e.target.value)}
                                required
                                className={inp}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] tracking-widests uppercase text-gray-500">
                                {t("last_name")}
                              </Label>
                              <Input
                                value={pLast}
                                onChange={(e) => setPLast(e.target.value)}
                                className={inp}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] tracking-widests uppercase text-gray-500">
                              {t("phone")}
                            </Label>
                            <div className="relative">
                              <Phone
                                size={13}
                                className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                              />
                              <Input
                                type="tel"
                                value={pPhone}
                                onChange={(e) => setPPhone(e.target.value)}
                                className={cn(inp, "ps-9")}
                                placeholder="+971 50 000 0000"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] tracking-widest uppercase text-gray-500">
                              {t("whatsapp_number")}
                            </Label>
                            <div className="relative">
                              <svg viewBox="0 0 24 24" className="absolute start-3 top-1/2 -translate-y-1/2 w-3 h-3 text-green-600 pointer-events-none fill-current">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              <Input
                                type="tel"
                                value={pWhatsapp}
                                onChange={(e) => setPWhatsapp(e.target.value)}
                                className={cn(inp, "ps-9")}
                                placeholder="+971 50 000 0000"
                              />
                            </div>
                            <p className="text-[10px] text-gray-400">{t("whatsapp_hint")}</p>
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-gray-100 pt-5">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin size={12} className="text-gray-400" />
                            <span className="text-[10px] tracking-widest uppercase text-gray-400">
                              {t("address_section")}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] tracking-widests uppercase text-gray-500">
                              {t("street")}
                            </Label>
                            <Input
                              value={pStreet}
                              onChange={(e) => setPStreet(e.target.value)}
                              className={inp}
                              placeholder="123 Main St"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] tracking-widests uppercase text-gray-500">
                                {t("country")}
                              </Label>
                              <Input
                                value={pCountry}
                                onChange={(e) => setPCountry(e.target.value)}
                                className={inp}
                                placeholder="UAE"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] tracking-widests uppercase text-gray-500">
                                {t("city")}
                              </Label>
                              <Input
                                value={pCity}
                                onChange={(e) => setPCity(e.target.value)}
                                className={inp}
                                placeholder="Dubai"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] tracking-widests uppercase text-gray-500">
                                {t("district")}
                              </Label>
                              <Input
                                value={pDistrict}
                                onChange={(e) => setPDistrict(e.target.value)}
                                className={inp}
                                placeholder="Al Barsha"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] tracking-widests uppercase text-gray-500">
                                {t("zip")}
                              </Label>
                              <Input
                                value={pZip}
                                onChange={(e) => setPZip(e.target.value)}
                                className={inp}
                                placeholder="00000"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {profileError && (
                      <p className="text-xs text-red-500 bg-red-50 px-3 py-2">{profileError}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={profileSaving || profileLoading}
                      className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widests uppercase font-semibold py-4 transition-colors"
                    >
                      {profileSaved ? (
                        <>
                          <Check size={12} className="me-1.5" />
                          {t("saved")}
                        </>
                      ) : profileSaving ? (
                        t("saving")
                      ) : (
                        t("save")
                      )}
                    </Button>
                  </form>
                )}

                {/* ── Orders tab ── */}
                {accountTab === "orders" && (
                  <div>
                    {ordersLoading ? (
                      <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
                    ) : selectedOrder ? (
                      /* Order detail */
                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(null)}
                          className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-gray-400 hover:text-jorrey-black mb-4 transition-colors"
                        >
                          <span>{isRTL ? "→" : "←"}</span>
                          {t("back")}
                        </button>
                        <p className="font-mono text-[10px] text-gray-400 mb-0.5">{selectedOrder.id}</p>
                        <p className="font-serif text-base text-jorrey-black mb-4">{t("order_detail_title")}</p>

                        {/* Status badge */}
                        <div className="mb-4">
                          <span className={`text-[9px] tracking-widest uppercase font-bold px-2.5 py-1 ${
                            selectedOrder.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                            selectedOrder.status === "shipped" ? "bg-blue-100 text-blue-800" :
                            selectedOrder.status === "delivered" ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {t(`status_${selectedOrder.status}`)}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="border-t border-gray-100 pt-3 mb-3">
                          <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-2">{t("order_items")}</p>
                          <div className="space-y-2">
                            {selectedOrder.items.map((item, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-jorrey-black">
                                  {isRTL && item.nameAr ? item.nameAr : item.name}
                                  {item.size && item.size !== "One Size" && (
                                    <span className="text-gray-400 ms-1">/ {item.size}</span>
                                  )}
                                  <span className="text-gray-400 ms-1">×{item.quantity}</span>
                                </span>
                                <span className="font-medium text-jorrey-black">
                                  {selectedOrder.currencySymbol}{(item.unitPrice * item.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm mb-3">
                          <div className="flex justify-between text-gray-500">
                            <span>{t("order_subtotal")}</span>
                            <span>{selectedOrder.currencySymbol}{selectedOrder.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>{t("order_shipping")}</span>
                            <span>{selectedOrder.shipping === 0 ? t("order_free") : `${selectedOrder.currencySymbol}${selectedOrder.shipping.toLocaleString()}`}</span>
                          </div>
                          {selectedOrder.discount > 0 && (
                            <div className="flex justify-between text-jorrey-gold">
                              <span>{t("order_discount")}</span>
                              <span>-{selectedOrder.currencySymbol}{selectedOrder.discount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold border-t border-gray-100 pt-2 text-jorrey-black">
                            <span>{t("order_total")}</span>
                            <span>{selectedOrder.currencySymbol}{selectedOrder.total.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Address */}
                        {selectedOrder.address.city && (
                          <div className="border-t border-gray-100 pt-3 text-sm mb-3">
                            <p className="text-[10px] tracking-widest uppercase text-gray-400 mb-1">{t("order_address")}</p>
                            <p className="text-gray-600 leading-relaxed">
                              {[selectedOrder.address.street, selectedOrder.address.district, selectedOrder.address.city, selectedOrder.address.country]
                                .filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}

                        {/* Date */}
                        <p className="text-[10px] text-gray-300 mt-2">
                          {t("order_date")}: {new Date(selectedOrder.createdAt).toLocaleDateString(locale === "ar" ? "ar-AE" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="py-12 text-center">
                        <ShoppingBag size={28} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-sm text-gray-400">{t("orders_empty")}</p>
                        <p className="text-xs text-gray-300 mt-1">{t("orders_hint")}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {orders.map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="w-full text-start border border-gray-100 p-4 hover:border-jorrey-gold/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-mono text-[10px] text-gray-400 mb-0.5">{order.id}</p>
                                <p className="text-sm text-jorrey-black">
                                  {order.items.length} {order.items.length === 1 ? t("order_items").replace(/s$/, "") : t("order_items")}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {new Date(order.createdAt).toLocaleDateString(locale === "ar" ? "ar-AE" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <span className={`text-[9px] tracking-widest uppercase font-bold px-2 py-0.5 ${
                                  order.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                                  order.status === "shipped" ? "bg-blue-100 text-blue-800" :
                                  order.status === "delivered" ? "bg-green-100 text-green-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {t(`status_${order.status}`)}
                                </span>
                                <p className="text-sm font-medium text-jorrey-black">
                                  {order.currencySymbol}{order.total.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Favorites tab ── */}
                {accountTab === "favorites" && (
                  <div className="space-y-3">
                    {favorites.length === 0 ? (
                      <div className="py-12 text-center">
                        <Heart size={28} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-sm text-gray-400">{t("favorites_empty")}</p>
                        <p className="text-xs text-gray-300 mt-1">{t("favorites_hint")}</p>
                      </div>
                    ) : (
                      favorites.map((item) => (
                        <div
                          key={item.productId}
                          className="border border-gray-100 p-3 flex items-start gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-jorrey-black truncate">
                              {item.productName}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {t("saved_on")}{" "}
                              {new Date(item.addedAt).toLocaleDateString()}
                            </p>

                            {/* Size picker (shown when this product needs size selection) */}
                            {bagProduct?.id === item.productId && (
                              <div className="mt-2">
                                <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-1.5">
                                  {t("select_size")}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {bagProduct.sizes.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => setBagSize(s)}
                                      className={`px-2.5 py-1 text-xs border transition-colors ${
                                        bagSize === s
                                          ? "bg-jorrey-black text-white border-jorrey-black"
                                          : "border-gray-200 text-gray-600 hover:border-jorrey-black"
                                      }`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={confirmAddToBag}
                                    disabled={!bagSize}
                                    className="rounded-none bg-jorrey-black text-white hover:bg-jorrey-gold hover:text-jorrey-black text-[10px] tracking-widests uppercase h-8"
                                  >
                                    <ShoppingBag size={11} className="me-1" />
                                    {t("add_to_bag")}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBagProduct(null)}
                                    className="rounded-none text-[10px] h-8"
                                  >
                                    {t("cancel")}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {bagAdded === item.productId ? (
                              <span className="text-[10px] text-teal-600 flex items-center gap-1">
                                <Check size={11} />
                                {t("added")}
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddToBag(item.productId)}
                                disabled={bagFetching === item.productId}
                                className="rounded-none text-[10px] tracking-widests uppercase h-8 border-gray-200"
                              >
                                <ShoppingBag size={11} className="me-1" />
                                {bagFetching === item.productId ? "…" : t("add_to_bag")}
                              </Button>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleFavorite(item.productId, item.productName)}
                              className="text-gray-300 hover:text-red-400 transition-colors p-1"
                              aria-label="Remove favorite"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── Watchlist tab ── */}
                {accountTab === "watchlist" && (
                  <div className="space-y-3">
                    {watchlist.length === 0 ? (
                      <div className="py-12 text-center">
                        <Bell size={28} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-sm text-gray-400">{t("watchlist_empty")}</p>
                        <p className="text-xs text-gray-300 mt-1">{t("watchlist_hint")}</p>
                      </div>
                    ) : (
                      watchlist.map((item) => (
                        <div
                          key={item.productId}
                          className="border border-gray-100 p-3"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-jorrey-black truncate">
                                {item.productName}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {t("price_at_add")}: $
                                {item.priceAtAdd.toLocaleString()}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                toggleWatchlist(item.productId, item.productName, item.priceAtAdd)
                              }
                              className="text-gray-300 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                              aria-label="Remove from watchlist"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          {/* Alert type toggles */}
                          <div className="flex gap-4 mb-2">
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.notifyPriceDrop}
                                onChange={(e) =>
                                  updateWatchlistPrefs(item.productId, {
                                    notifyPriceDrop: e.target.checked,
                                    notifyRestock: item.notifyRestock,
                                    notificationChannel: (item.notificationChannel ?? "email") as NotificationChannel,
                                  })
                                }
                                className="w-3 h-3 accent-jorrey-gold"
                              />
                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <TrendingDown size={10} />
                                {t("notify_price_drop")}
                              </span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.notifyRestock}
                                onChange={(e) =>
                                  updateWatchlistPrefs(item.productId, {
                                    notifyPriceDrop: item.notifyPriceDrop,
                                    notifyRestock: e.target.checked,
                                    notificationChannel: (item.notificationChannel ?? "email") as NotificationChannel,
                                  })
                                }
                                className="w-3 h-3 accent-jorrey-gold"
                              />
                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <PackageCheck size={10} />
                                {t("notify_restock")}
                              </span>
                            </label>
                          </div>
                          {/* Notification channel picker */}
                          <div className="flex gap-1.5">
                            {(["email", "whatsapp", "both"] as NotificationChannel[]).map((ch) => (
                              <button
                                key={ch}
                                type="button"
                                onClick={() =>
                                  updateWatchlistPrefs(item.productId, {
                                    notifyPriceDrop: item.notifyPriceDrop,
                                    notifyRestock: item.notifyRestock,
                                    notificationChannel: ch,
                                  })
                                }
                                className={`text-[9px] tracking-widest uppercase font-semibold px-2 py-1 border transition-colors ${
                                  (item.notificationChannel ?? "email") === ch
                                    ? "bg-jorrey-black text-white border-jorrey-black"
                                    : "border-gray-200 text-gray-400 hover:border-gray-400"
                                }`}
                              >
                                {t(`channel_${ch}`)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── Notifications tab ── */}
                {accountTab === "notifications" && (
                  <div>
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <Bell size={28} className="mx-auto mb-3 text-gray-200" />
                        <p className="text-sm text-gray-400">{t("notifications_empty")}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`border px-3 py-3 flex gap-3 ${
                              n.read
                                ? "border-gray-100 bg-white"
                                : "border-jorrey-gold/20 bg-jorrey-beige/10"
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 mt-0.5 ${
                                n.type === "price_drop" ? "text-red-500" : "text-teal-600"
                              }`}
                            >
                              {n.type === "price_drop" ? (
                                <TrendingDown size={15} />
                              ) : (
                                <PackageCheck size={15} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-jorrey-black">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {new Date(n.createdAt).toLocaleDateString()}{" "}
                                {new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            {!n.read && (
                              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {/* ── Step: signing_in spinner ── */}
                {authStep === "signing_in" && (
                  <div className="py-10 text-center">
                    <div className="w-10 h-10 border-2 border-jorrey-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-gray-400">{t("signing_in")}</p>
                  </div>
                )}

                {/* ── Step: enter phone ── */}
                {authStep === "phone" && (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="text-center pb-2">
                      <div className="w-11 h-11 bg-jorrey-beige rounded-full flex items-center justify-center mx-auto mb-3">
                        <AtSign size={20} className="text-jorrey-black" />
                      </div>
                      <p className="text-xs text-gray-400">{t("phone_auth_hint")}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="relative">
                        <AtSign size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <Input
                          type="text"
                          placeholder={isRTL ? "you@example.com أو +٩٦٤ ٧٧٠..." : "you@example.com or +964 770…"}
                          value={authIdentifier}
                          onChange={(e) => { setAuthIdentifier(e.target.value); setAuthIdentifierError(""); }}
                          dir="ltr"
                          className={cn(inp, "ps-9")}
                          autoFocus
                        />
                      </div>
                      {authIdentifierError && <p className="text-xs text-red-500">{authIdentifierError}</p>}
                    </div>

                    {authError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2">{authError}</p>}
                    <Button
                      type="submit"
                      disabled={authLoading}
                      className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors"
                    >
                      {authLoading ? t("sending_code") : t("send_code")}
                    </Button>
                  </form>
                )}

                {/* ── Step: enter OTP ── */}
                {authStep === "otp" && (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center pb-1">
                      <div className="w-10 h-10 bg-jorrey-beige rounded-full flex items-center justify-center mx-auto mb-3">
                        <Phone size={18} className="text-jorrey-black" />
                      </div>
                      <p className="text-sm font-medium text-jorrey-black">{t("verify_phone_title")}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {t("code_sent").replace("{phone}", authIdentifier)}
                      </p>
                    </div>
                    <Input
                      placeholder="000000"
                      value={authOtp}
                      onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      dir="ltr"
                      className={cn(inp, "text-center tracking-widest font-mono text-lg")}
                      maxLength={6}
                      inputMode="numeric"
                      autoFocus
                    />
                    {authError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2">{authError}</p>}
                    <Button
                      type="submit"
                      disabled={authLoading || authOtp.length < 6}
                      className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors"
                    >
                      {authLoading ? t("verifying") : t("verify_otp_btn")}
                    </Button>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => { setAuthStep("phone"); setAuthOtp(""); setAuthError(""); }}
                        className="text-[10px] text-gray-400 hover:text-jorrey-black transition-colors"
                      >
                        {t("back")}
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={authLoading}
                        className="text-[10px] text-gray-400 hover:text-jorrey-black underline underline-offset-2 transition-colors"
                      >
                        {authLoading ? "…" : t("resend_code")}
                      </button>
                    </div>
                  </form>
                )}

                {/* ── Step: complete registration (new user) ── */}
                {authStep === "register" && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2.5 leading-relaxed">
                      {t("no_account_found")}{" "}
                      <span className="text-jorrey-black font-medium">{authIdentifier}</span>
                    </p>
                    <p className="text-[10px] tracking-widest uppercase text-gray-400">{t("complete_registration")}</p>
                    <Input
                      placeholder={t("name_required")}
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                      className={inp}
                      autoFocus
                    />
                    <Input
                      type="email"
                      placeholder={t("email_optional")}
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className={inp}
                    />
                    {authError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2">{authError}</p>}
                    <Button
                      type="submit"
                      disabled={authLoading || !regFirstName.trim()}
                      className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors"
                    >
                      {authLoading ? t("creating") : t("register")}
                    </Button>
                    <button
                      type="button"
                      onClick={() => { setAuthStep("phone"); setAuthOtp(""); setAuthError(""); setVerifiedToken(""); }}
                      className="w-full text-[10px] text-gray-400 hover:text-jorrey-black transition-colors text-center"
                    >
                      {t("back")}
                    </button>
                  </form>
                )}

                {/* ── Step: Clerk email verification ── */}
                {authStep === "email-verify" && (
                  <form onSubmit={handleClerkEmailVerify} className="space-y-4">
                    <div className="text-center pb-1">
                      <div className="w-10 h-10 bg-jorrey-beige rounded-full flex items-center justify-center mx-auto mb-3">
                        <AtSign size={18} className="text-jorrey-black" />
                      </div>
                      <p className="text-sm font-medium text-jorrey-black">{t("verify_title")}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {t("verify_desc").replace("{email}", authEmailFlow ? authIdentifier : regEmail)}
                      </p>
                    </div>
                    <Input
                      placeholder={t("verify_placeholder")}
                      value={clerkEmailCode}
                      onChange={(e) => setClerkEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                      dir="ltr"
                      className={cn(inp, "text-center tracking-widest font-mono text-lg")}
                      maxLength={6}
                      inputMode="numeric"
                      autoFocus
                    />
                    {authError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2">{authError}</p>}
                    <Button
                      type="submit"
                      disabled={authLoading || clerkEmailCode.length < 6}
                      className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors"
                    >
                      {authLoading ? t("verifying") : t("verify_btn")}
                    </Button>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setClerkEmailCode("");
                          setAuthError("");
                          // Direct-email path → back to identifier step; phone-path → back to register
                          if (authEmailFlow !== null) {
                            setAuthStep("phone");
                            setAuthEmailFlow(null);
                          } else {
                            setAuthStep("register");
                          }
                        }}
                        className="text-[10px] text-gray-400 hover:text-jorrey-black transition-colors"
                      >
                        {t("back")}
                      </button>
                      <button
                        type="button"
                        onClick={handleResendClerkEmail}
                        disabled={authLoading}
                        className="text-[10px] text-gray-400 hover:text-jorrey-black transition-colors"
                      >
                        {authLoading ? "…" : t("resend_code")}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
