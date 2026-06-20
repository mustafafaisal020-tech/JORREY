import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/customers";
import AdminCustomerForm from "@/components/admin/AdminCustomerForm";

export const dynamic = "force-dynamic";

export default async function CustomerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-jorrey-black">
          {customer.firstName} {customer.lastName ?? ""}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{customer.email}</p>
      </div>
      <AdminCustomerForm customer={customer} />
    </main>
  );
}
