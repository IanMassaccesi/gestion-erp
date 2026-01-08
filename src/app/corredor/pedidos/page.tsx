import { prisma } from "@/lib/prisma";
import { OrderFormMobile } from "@/components/orders/OrderFormMobile";
import { getSession } from "@/lib/auth";

export default async function MobilePedidosPage() {
  const session = await getSession();
  const userId = session?.user?.id;
  
  // Obtenemos DATOS DEL USUARIO para saber su % de comisión y rol
  const currentUser = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { id: true, role: true, commissionRate: true } // Traemos la comisión
  });

  const whereCondition: any = { isDeleted: false };
  if (session?.user?.role !== 'ADMIN') {
      whereCondition.createdById = userId;
  }

  const [clients, products] = await Promise.all([
    prisma.customer.findMany({ where: whereCondition, select: { id: true, firstName: true, lastName: true, address: true } }),
    prisma.product.findMany({ where: { isDeleted: false }, select: { id: true, name: true, priceFinal: true, priceMayor: true, currentStock: true } })
  ]);

  return (
    <div className="pb-20">
      <h1 className="text-xl font-bold text-brand-primary mb-4 px-2">Tomar Pedido</h1>
      <OrderFormMobile clients={clients} products={products} currentUser={currentUser} />
    </div>
  );
}