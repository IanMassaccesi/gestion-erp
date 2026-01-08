import { prisma } from "@/lib/prisma";
import { updateClient } from "@/actions/clients-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.customer.findUnique({ where: { id } });
  if (!client) return <div>Cliente no encontrado</div>;

  const updateClientWithId = updateClient.bind(null, id);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/clientes" className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-brand-primary">Editar Cliente</h1>
      </div>
      <form action={updateClientWithId} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-bold block mb-1">Nombre</label><input name="firstName" defaultValue={client.firstName} className="w-full p-2 border rounded" /></div>
          <div><label className="text-sm font-bold block mb-1">Apellido</label><input name="lastName" defaultValue={client.lastName} className="w-full p-2 border rounded" /></div>
        </div>
        <div><label className="text-sm font-bold block mb-1">Dirección</label><input name="address" defaultValue={client.address} className="w-full p-2 border rounded" /></div>
        <div><label className="text-sm font-bold block mb-1">Teléfono</label><input name="phone" defaultValue={client.phone} className="w-full p-2 border rounded" /></div>
        <button type="submit" className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold flex justify-center gap-2"><Save /> Guardar Cambios</button>
      </form>
    </div>
  );
}