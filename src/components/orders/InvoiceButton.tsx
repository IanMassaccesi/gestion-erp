'use client';

import Link from "next/link";
import { Printer } from "lucide-react";

interface InvoiceButtonProps {
  orderId: string;
}

export function InvoiceButton({ orderId }: InvoiceButtonProps) {
  return (
    <Link 
      href={`/admin/pedidos/${orderId}/imprimir`} 
      target="_blank" // Abre en pestaña nueva para no perder el detalle
      className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-neon hover:bg-cyan-400 transition-colors"
    >
      <Printer size={18} />
      Ir a Imprimir
    </Link>
  );
}