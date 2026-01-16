'use client'
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="bg-[#0E386F] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#092446]"
    >
      <Printer /> Imprimir Hoja
    </button>
  );
}