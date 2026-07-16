export interface SocialLink {
  id: string;
  label: string;
  url: string;
  hidden?: boolean;
}

export interface FooterCompanyChild {
  id: string;
  label: string;
  labelAr?: string;
  url: string;
  pageId?: string;
  visible: boolean;
  order: number;
}

export interface FooterCompanyItem {
  id: string;
  label: string;
  labelAr?: string;
  url: string;
  pageId?: string;
  visible: boolean;
  order: number;
  children: FooterCompanyChild[];
}

export interface FooterContactItem {
  id: string;
  label: string;
  labelAr?: string;
  value: string;
  valueAr?: string;
  url?: string;
  visible: boolean;
  order: number;
}

export interface FooterSettings {
  tagline?: string;
  taglineAr?: string;
  shopLabel?: string;
  shopLabelAr?: string;
  companyLabel?: string;
  companyLabelAr?: string;
  connectLabel?: string;
  connectLabelAr?: string;
  contactLabel?: string;
  contactLabelAr?: string;
  bgColor?: "black" | "white" | "beige";
  companyItems?: FooterCompanyItem[];
  contactItems?: FooterContactItem[];
}

export interface SaleCountdown {
  enabled: boolean;
  endsAt: string;           // UTC ISO string, e.g. "2026-07-01T15:00:00.000Z"
  labelEn?: string;         // Custom heading EN — falls back to i18n default
  labelAr?: string;         // Custom heading AR — falls back to i18n default
  onExpiry: "hide" | "show_ended";
}

export interface SiteSettings {
  whatsappNumber: string;
  currency: string;
  currencySymbol: string;
  siteName: string;
  socialLinks: SocialLink[];
  footer?: FooterSettings;
  collectionsTitle?: string;
  collectionsTitleAr?: string;
  collectionsDescription?: string;
  collectionsDescriptionAr?: string;
  saleCountdown?: SaleCountdown;
  /** Admin-set exchange rates relative to USD base. e.g. { IQD: 1310 } */
  exchangeRates?: Record<string, number>;
}
