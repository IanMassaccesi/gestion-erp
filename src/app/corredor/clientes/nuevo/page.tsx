import { createClient } from "@/actions/clients-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoClienteCorredorPage() {
  return (
    <div className="pb-20">
      <div className="flex items-center gap-4 mb-6 px-4 pt-4">
        <Link href="/corredor/dashboard" className="p-2 hover:bg-brand-card rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-xl font-bold font-heading text-white">Nuevo Cliente</h1>
      </div>

      {/* CORRECCIÓN: Wrapper asíncrono */}
      <form action={async (formData) => { 'use server'; await createClient(formData); }} className="px-4 space-y-4">
        <div className="bg-brand-card p-4 rounded-xl border border-brand-border space-y-4">
           <div><label className="text-sm text-brand-muted block mb-1">Nombre</label><input name="firstName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
           <div><label className="text-sm text-brand-muted block mb-1">Apellido</label><input name="lastName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
           <div><label className="text-sm text-brand-muted block mb-1">DNI / CUIT</label><input name="dniCuit" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
           <div><label className="text-sm text-brand-muted block mb-1">Dirección</label><input name="address" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
           <div><label className="text-sm text-brand-muted block mb-1">Ciudad</label><input name="city" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
           <div><label className="text-sm text-brand-muted block mb-1">Teléfono</label><input name="phone" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
        </div>

        <button type="submit" className="w-full bg-brand-primary text-brand-dark py-4 rounded-xl font-bold text-lg shadow-neon flex justify-center gap-2">
            <Save /> Guardar Cliente
        </button>
      </form>
    </div>
  );
}