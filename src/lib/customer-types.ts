export interface CustomerAddress {
  street?: string;
  city?: string;
  district?: string;
  country?: string;
  zipCode?: string;
}

export interface CustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  address?: CustomerAddress;
  createdAt: string;
  updatedAt: string;
}

export type CustomerProfileInput = Omit<CustomerProfile, "id" | "createdAt" | "updatedAt">;
