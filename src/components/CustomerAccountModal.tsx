"use client";

import { useState, useEffect, useCallback } from "react";
import { useSignIn, useSignUp, useUser, useClerk } from "@clerk/nextjs";
import {
  X,
  LogOut,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Phone,
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
import type { Product } from "@/lib/product-types";
import { categoryHasSizes } from "@/lib/product-types";
import { useCart } from "./CartProvider";
import { useUserLists } from "./UserListsProvider";

interface Props {
  open: boolean;
  onClose: () => void;
}

type AuthTab = "signin" | "signup";
type AccountTab = "profile" | "favorites" | "watchlist" | "notifications";

export default function CustomerAccountModal({ open, onClose }: Props) {
  const t = useTranslations("account");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const { user, isLoaded: userLoaded } = useUser();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { signOut } = useClerk();
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

  // ── Auth state ──────────────────────────────────────────────
  const [authTab, setAuthTab] = useState<AuthTab>("signin");
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

  // Mark notifications read when notifications tab is opened
  useEffect(() => {
    if (accountTab === "notifications" && unreadNotifications > 0) {
      markAllRead();
    }
  }, [accountTab, unreadNotifications, markAllRead]);

  function clerkErrMsg(err: unknown): string {
    const e = err as { errors?: Array<{ longMessage?: string; message?: string }> };
    return e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? "Something went wrong.";
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const { error: pwErr } = await signIn.password({ emailAddress: siEmail, password: siPass });
      if (pwErr) {
        setAuthError(pwErr.longMessage ?? pwErr.message ?? "Incorrect email or password.");
        return;
      }
      if (signIn.status === "complete") await signIn.finalize();
      else setAuthError("Additional verification required. Please try again.");
    } catch (err) {
      setAuthError(clerkErrMsg(err));
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const { error: suErr } = await signUp.password({
        emailAddress: suEmail,
        password: suPass,
        firstName: suFirst,
        lastName: suLast || undefined,
      });
      if (suErr) {
        setAuthError(suErr.longMessage ?? suErr.message ?? "Could not create account.");
        return;
      }
      if (signUp.status === "complete") {
        await signUp.finalize();
        return;
      }
      const { error: codeErr } = await signUp.verifications.sendEmailCode();
      if (codeErr) {
        setAuthError(codeErr.longMessage ?? codeErr.message ?? "Could not send code.");
        return;
      }
      setVerifyEmail(suEmail);
      setVerifying(true);
    } catch (err) {
      setAuthError(clerkErrMsg(err));
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const { error: verifyErr } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyErr) {
        setAuthError(verifyErr.longMessage ?? verifyErr.message ?? "Invalid code.");
        return;
      }
      if (signUp.status === "complete") await signUp.finalize();
      else setAuthError("Verification incomplete. Please try again.");
    } catch (err) {
      setAuthError(clerkErrMsg(err));
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
    setSiEmail("");
    setSiPass("");
    setSuFirst("");
    setSuLast("");
    setSuEmail("");
    setSuPass("");
    setAuthError("");
    setVerifying(false);
    setCode("");
    setShowPass(false);
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
                : authTab === "signin"
                ? t("sign_in")
                : t("register")}
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
              <>
                {/* ── Auth tabs ── */}
                <div className="flex border-b border-gray-100 mb-6 -mx-6 px-6">
                  {(["signin", "signup"] as AuthTab[]).map((t2) => (
                    <button
                      key={t2}
                      type="button"
                      onClick={() => {
                        setAuthTab(t2);
                        setAuthError("");
                        setVerifying(false);
                      }}
                      className={cn(
                        "flex-1 pb-3 text-xs tracking-widest uppercase font-medium transition-colors border-b-2 -mb-px",
                        authTab === t2
                          ? "border-jorrey-black text-jorrey-black"
                          : "border-transparent text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {t2 === "signin" ? t("sign_in") : t("register")}
                    </button>
                  ))}
                </div>

                {authError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 mb-4">{authError}</p>
                )}

                {/* Sign In */}
                {authTab === "signin" && (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="relative">
                      <Mail
                        size={13}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <Input
                        type="email"
                        placeholder={t("email")}
                        value={siEmail}
                        onChange={(e) => setSiEmail(e.target.value)}
                        required
                        className={cn(inp, "ps-9")}
                      />
                    </div>
                    <div className="relative">
                      <Lock
                        size={13}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <Input
                        type={showPass ? "text" : "password"}
                        placeholder={t("password")}
                        value={siPass}
                        onChange={(e) => setSiPass(e.target.value)}
                        required
                        className={cn(inp, "ps-9 pe-9")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <Button
                      type="submit"
                      disabled={authLoading}
                      className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors"
                    >
                      {authLoading ? t("signing_in") : t("sign_in")}
                    </Button>
                  </form>
                )}

                {/* Sign Up */}
                {authTab === "signup" && !verifying && (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder={t("first_name")}
                        value={suFirst}
                        onChange={(e) => setSuFirst(e.target.value)}
                        required
                        className={inp}
                      />
                      <Input
                        placeholder={t("last_name")}
                        value={suLast}
                        onChange={(e) => setSuLast(e.target.value)}
                        className={inp}
                      />
                    </div>
                    <div className="relative">
                      <Mail
                        size={13}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <Input
                        type="email"
                        placeholder={t("email")}
                        value={suEmail}
                        onChange={(e) => setSuEmail(e.target.value)}
                        required
                        className={cn(inp, "ps-9")}
                      />
                    </div>
                    <div className="relative">
                      <Lock
                        size={13}
                        className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <Input
                        type={showPass ? "text" : "password"}
                        placeholder={t("password")}
                        value={suPass}
                        onChange={(e) => setSuPass(e.target.value)}
                        required
                        className={cn(inp, "ps-9 pe-9")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    <Button
                      type="submit"
                      disabled={authLoading}
                      className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors"
                    >
                      {authLoading ? t("creating") : t("register")}
                    </Button>
                  </form>
                )}

                {/* Email verification */}
                {authTab === "signup" && verifying && (
                  <form onSubmit={handleVerify} className="space-y-4">
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {t("verify_desc").replace("{email}", verifyEmail)}
                    </p>
                    <Input
                      placeholder={t("verify_placeholder")}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      className={cn(inp, "text-center tracking-widest font-mono")}
                      maxLength={6}
                    />
                    <Button
                      type="submit"
                      disabled={authLoading}
                      className="w-full rounded-none bg-jorrey-black hover:bg-jorrey-gold hover:text-jorrey-black text-white text-xs tracking-widest uppercase font-semibold py-5 transition-colors"
                    >
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
