import { createClient } from "@/actions/clients-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoClienteMobilePage() {
  return (
    <div className="pb-20">
      <div className="bg-brand-primary text-white p-4 sticky top-0 z-10 flex items-center gap-3 shadow-md">
        <Link href="/corredor/dashboard"><ArrowLeft /></Link>
        <h1 className="font-bold text-lg">Nuevo Cliente</h1>
      </div>

      <form action={createClient} className="p-4 space-y-4">
        <input type="hidden" name="origin" value="mobile" /> {/* Marca de origen para el redirect */}
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-brand-primary uppercase">Datos Personales</h3>
            <input name="firstName" required placeholder="Nombre" className="w-full p-3 border rounded-lg" />
            <input name="lastName" required placeholder="Apellido" className="w-full p-3 border rounded-lg" />
            <input name="dniCuit" required placeholder="DNI / CUIT" className="w-full p-3 border rounded-lg" />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-brand-primary uppercase">Ubicación y Contacto</h3>
            <input name="address" required placeholder="Dirección completa" className="w-full p-3 border rounded-lg" />
            <input name="phone" placeholder="Teléfono / WhatsApp" className="w-full p-3 border rounded-lg" />
            <input name="email" type="email" placeholder="Email (Opcional)" className="w-full p-3 border rounded-lg" />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
             <h3 className="text-sm font-bold text-brand-primary uppercase">Tipo</h3>
             <select name="type" className="w-full p-3 border rounded-lg bg-white">
                <option value="FINAL">Consumidor Final</option>
                <option value="MAYORISTA">Comercio / Mayorista</option>
             </select>
        </div>

        <button type="submit" className="w-full bg-brand-accent text-white py-4 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 text-lg">
           <Save /> Guardar Cliente
        </button>
      </form>
    </div>
  );
}