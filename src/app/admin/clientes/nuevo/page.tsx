import { createClient } from "@/actions/clients-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoClientePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/clientes" className="p-2 hover:bg-brand-card rounded-full transition-colors text-brand-muted">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">Nuevo Cliente</h1>
        </div>
      </div>

      <form 
        action={async (formData) => { 'use server'; await createClient(formData); }} 
        className="bg-brand-card p-8 rounded-xl shadow-lg border border-brand-border space-y-6"
      >
        <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="text-sm font-medium text-brand-muted block mb-2">Nombre *</label>
                <input name="firstName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="Ej: Juan" />
            </div>
            <div>
                <label className="text-sm font-medium text-brand-muted block mb-2">Apellido *</label>
                <input name="lastName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="Ej: Perez" />
            </div>
        </div>

        <div>
            <label className="text-sm font-medium text-brand-muted block mb-2">DNI / CUIT *</label>
            <input name="dniCuit" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white font-mono focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="Sin guiones" />
        </div>

        <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="text-sm font-medium text-brand-muted block mb-2">Teléfono</label>
                <input name="phone" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="WhatsApp" />
            </div>
            <div>
                <label className="text-sm font-medium text-brand-muted block mb-2">Email</label>
                <input name="email" type="email" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="Opcional" />
            </div>
        </div>

        <div>
            <label className="text-sm font-medium text-brand-muted block mb-2">Dirección *</label>
            <input name="address" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none" placeholder="Calle y Altura" />
        </div>

        <div>
            <label className="text-sm font-medium text-brand-muted block mb-2">Tipo de Cliente *</label>
            <select name="type" className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none">
                <option value="FINAL">Consumidor Final</option>
                <option value="MINORISTA">Minorista</option>
                <option value="MAYORISTA">Mayorista</option>
            </select>
        </div>

        <input type="hidden" name="origin" value="admin" />

        <div className="pt-4">
            <button type="submit" className="w-full bg-brand-primary hover:bg-cyan-400 text-brand-dark px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-neon">
                <Save size={20} /> Guardar Cliente
            </button>
        </div>
      </form>
    </div>
  );
}