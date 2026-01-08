import { prisma } from "@/lib/prisma";
import { OrderFormMobile } from "@/components/orders/OrderFormMobile";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NuevoPedidoAdminPage() {
  // 1. Obtener Sesión y Usuario Actual
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) return <div>Acceso Denegado</div>;

  // Buscamos al usuario para pasarle su ROL y COMISIÓN al formulario
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, commissionRate: true }
  });

  // 2. Obtener Datos para el formulario
  const [clients, products] = await Promise.all([
    // El Admin ve TODOS los clientes (sin filtro createdById)
    prisma.customer.findMany({ 
      where: { isDeleted: false }, 
      select: { id: true, firstName: true, lastName: true, address: true, businessName: true } 
    }),
    prisma.product.findMany({ 
      where: { isDeleted: false }, 
      select: { id: true, name: true, priceFinal: true, priceMayor: true, currentStock: true } 
    })
  ]);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/pedidos" className="p-2 hover:bg-brand-card rounded-full text-brand-muted transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">Nuevo Pedido (Admin)</h1>
          <p className="text-brand-muted text-sm">Gestionar venta manual</p>
        </div>
      </div>

      {/* 3. Pasamos currentUser al componente */}
      <OrderFormMobile 
        clients={clients} 
        products={products} 
        currentUser={currentUser} 
      />
    </div>
  );
}