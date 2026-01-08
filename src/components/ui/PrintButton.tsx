'use client'
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-brand-primary text-brand-dark px-4 py-2 rounded font-bold shadow-neon hover:bg-cyan-400 transition-colors flex items-center gap-2 print:hidden"
    >
      <Printer size={18} />
      Imprimir Pantalla
    </button>
  );
}