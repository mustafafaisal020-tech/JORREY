import { readStore, writeStore } from "./blob-store";

export type { CustomerProfile, CustomerProfileInput, CustomerAddress } from "./customer-types";
import type { CustomerProfile, CustomerProfileInput } from "./customer-types";

const KEY = "customers";

async function read(): Promise<CustomerProfile[]> {
  return readStore<CustomerProfile[]>(KEY, []);
}

async function write(data: CustomerProfile[]): Promise<void> {
  return writeStore(KEY, data);
}

export async function getCustomers(): Promise<CustomerProfile[]> {
  return (await read()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getCustomer(id: string): Promise<CustomerProfile | undefined> {
  return (await read()).find((c) => c.id === id);
}

export async function upsertCustomer(
  id: string,
  input: CustomerProfileInput
): Promise<CustomerProfile> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === id);
  const now = new Date().toISOString();
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...input, id, updatedAt: now };
    await write(all);
    return all[idx];
  }
  const profile: CustomerProfile = { ...input, id, createdAt: now, updatedAt: now };
  await write([...all, profile]);
  return profile;
}

export async function updateCustomer(
  id: string,
  input: Partial<CustomerProfileInput>
): Promise<CustomerProfile | null> {
  const all = await read();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...input, updatedAt: new Date().toISOString() };
  await write(all);
  return all[idx];
}
