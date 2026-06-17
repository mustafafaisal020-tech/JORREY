import Link from "next/link";

const shopLinks = ["New Arrivals", "Collections", "Bestsellers", "Sale"];
const companyLinks = ["Our Story", "Atelier", "Journal", "Sustainability"];
const connectLinks = ["Contact", "Instagram", "Pinterest", "Press"];

export default function Footer() {
  return (
    <footer id="contact" className="bg-jorrey-black text-jorrey-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link
              href="/"
              className="font-serif text-2xl tracking-[0.15em] text-jorrey-white mb-6 block"
            >
              JORREY
            </Link>
            <p className="text-jorrey-white/40 text-sm leading-relaxed max-w-xs">
              Luxury fashion crafted with intention. Designed for those who
              understand that true elegance is timeless.
            </p>
          </div>

          {/* Shop */}
          <div>
            <p className="text-jorrey-gold text-[10px] tracking-[0.3em] uppercase mb-6">
              Shop
            </p>
            <ul className="space-y-3">
              {shopLinks.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-jorrey-white/50 hover:text-jorrey-gold text-sm transition-colors duration-200"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-jorrey-gold text-[10px] tracking-[0.3em] uppercase mb-6">
              Company
            </p>
            <ul className="space-y-3">
              {companyLinks.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-jorrey-white/50 hover:text-jorrey-gold text-sm transition-colors duration-200"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <p className="text-jorrey-gold text-[10px] tracking-[0.3em] uppercase mb-6">
              Connect
            </p>
            <ul className="space-y-3">
              {connectLinks.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-jorrey-white/50 hover:text-jorrey-gold text-sm transition-colors duration-200"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider + legal */}
        <div className="border-t border-jorrey-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-jorrey-white/20 text-xs tracking-wide">
            © {new Date().getFullYear()} Jorrey. All rights reserved.
          </p>
          <div className="flex gap-8">
            {["Privacy Policy", "Terms of Service", "Shipping"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-jorrey-white/20 hover:text-jorrey-white/50 text-xs transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
