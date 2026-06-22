import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getCategories } from "@/lib/categories";
import { getSettings } from "@/lib/settings";

// Detect social platform from URL and return an inline SVG path.
// Returns null for unknown platforms (falls back to text label).
function getSocialIcon(url: string): React.ReactNode | null {
  const lower = url.toLowerCase();

  if (lower.includes("instagram.com")) return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current flex-shrink-0" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );

  if (lower.includes("tiktok.com")) return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current flex-shrink-0" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.83 1.55V6.79a4.85 4.85 0 01-1.06-.1z"/>
    </svg>
  );

  if (lower.includes("x.com") || lower.includes("twitter.com")) return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current flex-shrink-0" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.258 5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  if (lower.includes("facebook.com")) return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current flex-shrink-0" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );

  if (lower.includes("youtube.com")) return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current flex-shrink-0" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );

  if (lower.includes("pinterest.com")) return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current flex-shrink-0" aria-hidden>
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  );

  if (lower.includes("snapchat.com")) return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current flex-shrink-0" aria-hidden>
      <path d="M12.166.006C9.845-.007 5.651.634 3.532 4.807c-.872 1.725-.66 5.103-.535 6.812-.413.21-.927.397-1.583.397-.64 0-1.177-.262-1.414-.262-.45 0-.916.426-.97.851-.074.588.484 1.17 1.372 1.52.06.024.15.058.25.092.634.228 1.604.577 1.875 1.48.013.042.024.085.033.13 0 0-.004.023-.004.025.013.051.009.105.023.151.255.847 1.396 1.437 2.68 1.784a3.1 3.1 0 01.285.086c.28.1.463.26.52.46.105.375-.244.839-.658 1.316-.336.39-.714.833-.834 1.37-.076.338-.03.654.135.924.329.544 1.046.787 1.63.787.19 0 .366-.024.513-.073.474-.156 1.023-.247 1.48-.247.423 0 .748.074 1.036.27.456.308.84.985 1.459 1.61.783.792 1.738 1.258 2.739 1.258.965 0 1.889-.442 2.695-1.194.628-.58 1.015-1.28 1.487-1.604a1.78 1.78 0 011.038-.34c.453 0 1.003.088 1.474.242.147.049.327.075.517.075.59 0 1.318-.246 1.649-.796.16-.267.203-.58.124-.915-.123-.53-.5-.975-.836-1.368-.42-.487-.773-.952-.662-1.33.057-.2.24-.36.52-.458.098-.033.19-.063.29-.086 1.286-.348 2.43-.937 2.685-1.785.015-.047.012-.1.025-.148 0-.003-.003-.022-.003-.022.008-.045.02-.088.033-.131.27-.903 1.242-1.252 1.876-1.48.1-.034.19-.068.25-.092.888-.35 1.446-.932 1.372-1.52-.054-.425-.52-.85-.97-.85-.237 0-.774.261-1.414.261-.656 0-1.17-.186-1.584-.396.126-1.71.337-5.087-.535-6.813C18.35.63 14.488-.007 12.166.006z"/>
    </svg>
  );

  if (lower.includes("linkedin.com")) return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current flex-shrink-0" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );

  if (lower.includes("wa.me") || lower.includes("whatsapp.com")) return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current flex-shrink-0" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );

  return null;
}

export default async function Footer() {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const isRTL = locale === "ar";

  const [categories, settings] = await Promise.all([getCategories(false), getSettings()]);
  const socialLinks = (settings.socialLinks ?? []).filter((l) => !l.hidden);
  const footer = settings.footer ?? {};

  const isDark = !footer.bgColor || footer.bgColor === "black";
  const rootBg = footer.bgColor === "beige" ? "bg-jorrey-beige" : footer.bgColor === "white" ? "bg-white" : "bg-jorrey-black";
  const brandText = isDark ? "text-jorrey-white" : "text-jorrey-black";
  const taglineText = isDark ? "text-jorrey-white/40" : "text-jorrey-black/50";
  const linkClass = isDark
    ? "text-jorrey-white/50 hover:text-jorrey-gold text-sm transition-colors duration-200"
    : "text-jorrey-black/60 hover:text-jorrey-gold text-sm transition-colors duration-200";
  const iconLinkClass = isDark
    ? "flex items-center gap-2.5 text-jorrey-white/50 hover:text-jorrey-gold transition-colors duration-200 group"
    : "flex items-center gap-2.5 text-jorrey-black/60 hover:text-jorrey-gold transition-colors duration-200 group";
  const borderColor = isDark ? "border-jorrey-white/10" : "border-jorrey-black/10";
  const copyrightText = isDark ? "text-jorrey-white/20" : "text-jorrey-black/30";
  const copyrightLinkClass = isDark
    ? "text-jorrey-white/20 hover:text-jorrey-white/50 text-xs transition-colors"
    : "text-jorrey-black/30 hover:text-jorrey-black/60 text-xs transition-colors";

  const shopLabel = (isRTL ? footer.shopLabelAr : footer.shopLabel) || t("shop");
  const companyLabel = (isRTL ? footer.companyLabelAr : footer.companyLabel) || t("company");
  const connectLabel = (isRTL ? footer.connectLabelAr : footer.connectLabel) || t("connect");
  const tagline = (isRTL ? footer.taglineAr : footer.tagline) || t("tagline");

  return (
    <footer id="contact" className={`${rootBg} ${brandText}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12 md:pt-20 pb-8 md:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-10 md:mb-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className={`font-serif text-2xl tracking-[0.15em] ${brandText} mb-6 block`}>
              JORREY
            </Link>
            <p className={`${taglineText} text-sm leading-relaxed max-w-xs`}>{tagline}</p>
          </div>

          {/* Shop — DB categories */}
          <div>
            <p className="text-jorrey-gold text-[10px] tracking-[0.3em] uppercase mb-6">{shopLabel}</p>
            <ul className="space-y-3">
              {categories.length > 0 ? (
                categories.map((cat) => {
                  const label = isRTL && cat.nameAr ? cat.nameAr : cat.name;
                  return (
                    <li key={cat.id}>
                      <Link href={`/category/${cat.slug}`} className={linkClass}>{label}</Link>
                    </li>
                  );
                })
              ) : (
                [t("new_arrivals"), t("collections"), t("bestsellers"), t("sale")].map((l) => (
                  <li key={l}>
                    <a href="#collections" className={linkClass}>{l}</a>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Company — editable items from settings */}
          <div>
            <p className="text-jorrey-gold text-[10px] tracking-[0.3em] uppercase mb-6">{companyLabel}</p>
            <ul className="space-y-3">
              {(footer.companyItems ?? [])
                .filter((x) => x.visible)
                .sort((a, b) => a.order - b.order)
                .map((item) => {
                  const label = isRTL && item.labelAr ? item.labelAr : item.label;
                  const children = (item.children ?? [])
                    .filter((c) => c.visible)
                    .sort((a, b) => a.order - b.order);
                  return (
                    <li key={item.id}>
                      <a href={item.url} className={linkClass}>{label}</a>
                      {children.length > 0 && (
                        <ul className={`mt-2 space-y-2 ${isRTL ? "pe-3 border-e" : "ps-3 border-s"} ${isDark ? "border-jorrey-white/10" : "border-jorrey-black/10"}`}>
                          {children.map((child) => {
                            const childLabel = isRTL && child.labelAr ? child.labelAr : child.label;
                            return (
                              <li key={child.id}>
                                <a href={child.url} className={`${linkClass} text-xs opacity-80`}>
                                  {childLabel}
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Connect — social links with icons */}
          <div>
            <p className="text-jorrey-gold text-[10px] tracking-[0.3em] uppercase mb-6">{connectLabel}</p>
            <ul className="space-y-4">
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => {
                  const icon = getSocialIcon(link.url);
                  return (
                    <li key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.label}
                        className={icon ? iconLinkClass : linkClass}
                      >
                        {icon}
                        <span className="text-sm">{link.label}</span>
                      </a>
                    </li>
                  );
                })
              ) : (
                [t("contact"), t("instagram"), t("pinterest"), t("press")].map((l) => (
                  <li key={l}>
                    <a href="#" className={linkClass}>{l}</a>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className={`border-t ${borderColor} pt-8 flex flex-col md:flex-row items-center justify-between gap-4`}>
          <p className={`${copyrightText} text-xs tracking-wide`}>
            © {new Date().getFullYear()} Jorrey. {t("copyright")}
          </p>
          <div className="flex gap-8">
            {[t("privacy"), t("terms"), t("shipping")].map((l) => (
              <a key={l} href="#" className={copyrightLinkClass}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
