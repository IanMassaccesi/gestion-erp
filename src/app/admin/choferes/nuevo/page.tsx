import { createDriver } from "@/actions/users-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NuevoChoferPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/choferes" className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-brand-primary">Nuevo Chofer</h1>
      </div>

      <form action={createDriver} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-brand-dark block mb-2">Nombre</label>
            <input name="firstName" required className="w-full p-2 border rounded-lg" placeholder="Ej: Roberto" />
          </div>
          <div>
            <label className="text-sm font-bold text-brand-dark block mb-2">Apellido</label>
            <input name="lastName" required className="w-full p-2 border rounded-lg" placeholder="Ej: Gomez" />
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-brand-dark block mb-2">Email (Usuario)</label>
          <input type="email" name="email" required className="w-full p-2 border rounded-lg" placeholder="chofer@empresa.com" />
        </div>

        <div>
          <label className="text-sm font-bold text-brand-dark block mb-2">Contraseña</label>
          <input type="password" name="password" required className="w-full p-2 border rounded-lg" placeholder="******" />
          <p className="text-xs text-gray-400 mt-1">El chofer usará este email y contraseña para entrar a su panel.</p>
        </div>

        <button type="submit" className="w-full bg-brand-primary text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2">
          <Save size={20} /> Registrar Chofer
        </button>
      </form>
    </div>
  );
}