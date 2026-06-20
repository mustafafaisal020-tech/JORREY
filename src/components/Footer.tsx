import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getCategories } from "@/lib/categories";
import { getSettings } from "@/lib/settings";

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
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
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

          {/* Connect — social links from settings */}
          <div>
            <p className="text-jorrey-gold text-[10px] tracking-[0.3em] uppercase mb-6">{connectLabel}</p>
            <ul className="space-y-3">
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => (
                  <li key={link.id}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {link.label}
                    </a>
                  </li>
                ))
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
