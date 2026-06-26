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
}
