import { createStaff } from "@/actions/users-actions";
import Link from "next/link";
import { ArrowLeft, Save, Percent } from "lucide-react";

export default function NuevoEmpleadoPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/equipo" className="p-2 hover:bg-brand-card rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold font-heading text-white">Nuevo Empleado</h1>
      </div>

      <form action={createStaff} className="bg-brand-card p-8 rounded-xl shadow-lg border border-brand-border space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium text-brand-muted mb-1 block">Nombre</label><input name="firstName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
          <div><label className="text-sm font-medium text-brand-muted mb-1 block">Apellido</label><input name="lastName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
        </div>
        
        <div><label className="text-sm font-medium text-brand-muted mb-1 block">Email</label><input type="email" name="email" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
        <div><label className="text-sm font-medium text-brand-muted mb-1 block">Contraseña</label><input type="password" name="password" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>

        <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
          <p className="text-sm font-bold text-brand-primary mb-3">Roles y Comisiones</p>
          <div className="space-y-4">
            <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-white"><input type="checkbox" name="isRunner" className="w-4 h-4" /> Vendedor</label>
                <label className="flex items-center gap-2 cursor-pointer text-white"><input type="checkbox" name="isDriver" className="w-4 h-4" /> Chofer</label>
            </div>
            
            <div>
                <label className="text-xs font-bold text-brand-muted uppercase block mb-1">Comisión de Venta (%)</label>
                <div className="relative">
                    <Percent className="absolute left-3 top-3 text-brand-muted" size={16} />
                    <input type="number" step="0.1" name="commissionRate" defaultValue="0" className="w-full pl-10 p-2 bg-brand-input border border-brand-border rounded text-white" />
                </div>
                <p className="text-xs text-brand-muted mt-1">Este porcentaje se aplicará automáticamente a sus pedidos.</p>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-brand-primary text-brand-dark py-3 rounded-lg font-bold flex justify-center gap-2"><Save size={20} /> Guardar Empleado</button>
      </form>
    </div>
  );
}