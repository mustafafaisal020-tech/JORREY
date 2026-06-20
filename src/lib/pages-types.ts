export interface HomeSection {
  id: string;
  name: string;
  nameAr: string;
  visible: boolean;
  order: number;
  image?: string;
  heading?: string;
  headingAr?: string;
  subheading?: string;
  subheadingAr?: string;
}

export interface CustomPage {
  id: string;
  title: string;
  titleAr: string;
  slug: string;
  visible: boolean;
  order?: number;
  parentId?: string;
  homeSectionId?: string;
  sections: CustomSection[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomSection {
  id: string;
  name: string;
  nameAr: string;
  type: "text" | "heading" | "richtext";
  content: string;
  contentAr: string;
  visible: boolean;
  order: number;
}

export interface PagesData {
  home: { sections: HomeSection[] };
  custom: CustomPage[];
}
