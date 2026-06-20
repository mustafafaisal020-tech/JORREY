export interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  visible: boolean;
  image?: string;
  description?: string;
  descriptionAr?: string;
  filtersEnabled?: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export type CategoryInput = Omit<Category, "id" | "createdAt" | "updatedAt">;
