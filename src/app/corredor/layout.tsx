import { LogOut, Menu } from "lucide-react";
import { logout } from "@/actions/auth-actions";
import Link from "next/link";

export default function CorredorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Móvil Fijo */}
      <header className="bg-brand-primary text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Logo o Icono */}
          <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center text-brand-primary font-bold">
            T
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg leading-tight">TuEmpresa</h1>
            <p className="text-[10px] text-brand-light opacity-90">App Corredores</p>
          </div>
        </div>
        
        {/* BOTÓN LOGOUT MEJORADO */}
        <form action={logout}>
          <button 
            type="submit"
            className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 px-3 py-2 rounded-lg transition-colors text-xs font-bold border border-red-500/20"
          >
            <LogOut size={16} />
            Salir
          </button>
        </form>
      </header>
      
      <main className="p-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
        <Link href="/corredor/dashboard" className="flex flex-col items-center text-gray-500 hover:text-brand-primary transition-colors">
          <span className="text-2xl mb-1">🏠</span>
          <span className="text-[10px] font-bold">Inicio</span>
        </Link>
        <Link href="/corredor/pedidos" className="flex flex-col items-center text-gray-500 hover:text-brand-primary transition-colors">
          <span className="text-2xl mb-1">🛒</span>
          <span className="text-[10px] font-bold">Vender</span>
        </Link>
        <Link href="/corredor/rutas" className="flex flex-col items-center text-gray-500 hover:text-brand-primary transition-colors">
          <span className="text-2xl mb-1">🚚</span>
          <span className="text-[10px] font-bold">Rutas</span>
        </Link>
      </nav>
    </div>
  );
}