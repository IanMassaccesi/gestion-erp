import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Trash2, User } from "lucide-react";
import { deleteClient } from "@/actions/clients-actions";

export default async function ClientesPage() {
  const clients = await prisma.customer.findMany({ 
    where: { isDeleted: false }, 
    orderBy: { createdAt: 'desc' },
    include: { createdBy: true } 
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading text-white">Clientes</h1>
          <p className="text-brand-muted">Base de datos de compradores</p>
        </div>
        <Link href="/admin/clientes/nuevo" className="bg-brand-primary hover:bg-cyan-400 text-brand-dark px-4 py-2 rounded-lg flex gap-2 font-bold shadow-neon transition-all">
          <Plus size={20} /> Nuevo
        </Link>
      </div>

      <div className="bg-brand-card rounded-xl border border-brand-border overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm text-brand-text">
          <thead className="bg-brand-dark text-brand-muted font-heading font-semibold uppercase tracking-wider text-xs border-b border-brand-border">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Vendedor</th>
              <th className="p-4">DNI/CUIT</th>
              <th className="p-4">Dirección</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-brand-border/30 transition-colors">
                <td className="p-4 font-medium text-white">{c.firstName} {c.lastName}</td>
                <td className="p-4">
                  {c.createdBy ? (
                    <span className="flex items-center gap-1 text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded w-fit border border-brand-primary/20">
                       <User size={12} /> {c.createdBy.firstName}
                    </span>
                  ) : (
                    <span className="text-xs text-brand-muted">Sistema</span>
                  )}
                </td>
                <td className="p-4 text-brand-muted font-mono">{c.dniCuit}</td>
                <td className="p-4 text-brand-muted">{c.address}</td>
                <td className="p-4 flex justify-end gap-2">
                  <Link href={`/admin/clientes/${c.id}`} className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded transition-colors"><Edit size={16} /></Link>
                  <form action={async () => { 'use server'; await deleteClient(c.id); }}>
                    <button className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"><Trash2 size={16} /></button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}