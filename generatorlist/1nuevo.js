const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. SCHEMA: AGREGAR ESTADOS SIN BORRAR NADA
  // ==========================================
  'prisma/schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  CORREDOR
}

enum ClientType {
  MAYORISTA
  MINORISTA
  FINAL
}

enum PriceTier {
  MAYOR
  MINOR
  FINAL
}

// MANTENEMOS LOS VIEJOS Y AGREGAMOS LOS NUEVOS AL FINAL
enum OrderStatus {
  DRAFT
  PENDING
  CONFIRMED
  PREPARING
  READY
  DELIVERING
  DELIVERED
  CANCELLED
  
  // --- NUEVOS ESTADOS ---
  NO_PAGO
  PAGO
  FIADO
  IMPRESO
}

enum RouteStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
}

enum PriceAdjustmentType {
  NONE
  FIXED_PRICE
  PERCENTAGE_OFF
  PERCENTAGE_MARKUP
}

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  password       String
  firstName      String
  lastName       String
  role           Role     @default(CORREDOR)
  isActive       Boolean  @default(true)
  commissionRate Float    @default(0)
  isRunner       Boolean  @default(false)
  isDriver       Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  orders         Order[]         @relation("OrderCreatedBy")
  routes         DeliveryRoute[]
  logs           LogEntry[]
  notifications  Notification[]
  createdClients Customer[]      @relation("ClientCreator")
  shifts         CashShift[]
}

model Customer {
  id              String      @id @default(cuid())
  firstName       String
  lastName        String
  businessName    String?
  dniCuit         String      @unique
  phone           String?
  email           String?
  address         String
  city            String?
  type            ClientType  @default(FINAL)
  specialDiscount Float       @default(0)
  isDeleted       Boolean     @default(false)
  deletedAt       DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  orders          Order[]
  createdById     String?
  createdBy       User?       @relation("ClientCreator", fields: [createdById], references: [id])
}

model Product {
  id           String    @id @default(cuid())
  code         String?   @unique
  name         String
  description  String?
  category     String?
  currentStock Int
  minStock     Int       @default(0)
  unit         String    @default("UNIDAD")
  imageUrl     String?
  priceMayor   Float
  priceMinor   Float
  priceFinal   Float
  isActive     Boolean   @default(true)
  isDeleted    Boolean   @default(false)
  deletedAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  orderItems   OrderItem[]
}

model Order {
  id               String         @id @default(cuid())
  orderNumber      String         @unique
  customerId       String
  customer         Customer       @relation(fields: [customerId], references: [id], onDelete: Restrict)
  userId           String
  user             User           @relation("OrderCreatedBy", fields: [userId], references: [id], onDelete: Restrict)
  shippingAddress  String?
  deliveryCode     String?
  requiresCode     Boolean        @default(false) 
  deliveryRouteId  String?        
  deliveryRoute    DeliveryRoute? @relation(fields: [deliveryRouteId], references: [id], onDelete: SetNull)
  appliedPriceTier PriceTier
  subtotal         Float
  discount         Float          @default(0)
  adminFee         Float          @default(0)
  total            Float
  
  // AHORA SOPORTA TODOS LOS ESTADOS (VIEJOS Y NUEVOS)
  status           OrderStatus    @default(PENDING)
  
  deliveryDate     DateTime?
  notes            String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  items            OrderItem[]
  transactions     CashTransaction[]
  shipment         Shipment?
}

model OrderItem {
  id                   String              @id @default(cuid())
  orderId              String
  order                Order               @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId            String
  product              Product             @relation(fields: [productId], references: [id], onDelete: Restrict)
  quantity             Int
  basePriceTier        PriceTier           @default(MAYOR)
  basePrice            Float
  priceAdjustmentType  PriceAdjustmentType @default(NONE)
  priceAdjustmentValue Float?
  unitPrice            Float
  subtotal             Float
  priceNote            String?
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
}

model DeliveryRoute {
  id          String      @id @default(cuid())
  routeNumber String?     @unique
  date        DateTime
  driverId    String?
  driver      User?       @relation(fields: [driverId], references: [id], onDelete: SetNull)
  status      RouteStatus @default(PENDING)
  notes       String?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  orders      Order[]
}

model Shipment {
  id            String   @id @default(cuid())
  trackingCode  String   @unique
  provider      String   @default("CORREO ARGENTINO")
  status        String   @default("PREPARACION")
  orderId       String   @unique
  order         Order    @relation(fields: [orderId], references: [id])
  labelUrl      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model CashShift {
  id             String    @id @default(cuid())
  openedAt       DateTime  @default(now())
  closedAt       DateTime?
  startAmount    Float
  endAmount      Float?
  systemAmount   Float?
  difference     Float?
  status         String    @default("OPEN")
  transactions   CashTransaction[]
  openedById     String
  openedBy       User      @relation(fields: [openedById], references: [id])
}

model CashTransaction {
  id             String    @id @default(cuid())
  date           DateTime  @default(now())
  amount         Float
  type           String    // IN, OUT
  category       String
  description    String?
  shiftId        String
  shift          CashShift @relation(fields: [shiftId], references: [id])
  orderId        String?
  order          Order?    @relation(fields: [orderId], references: [id])
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title       String
  description String
  type        String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model LogEntry {
  id        String   @id @default(cuid())
  timestamp DateTime @default(now())
  action    String
  details   String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Restrict)
  type      String
}`,

  // ==========================================
  // 2. ACTIONS: COMBINAR BACKUP CON NUEVAS FUNCIONES
  // ==========================================
  'src/actions/orders-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PriceTier, PriceAdjustmentType } from "@prisma/client";
import { getSession } from "@/lib/auth";

type OrderItemInput = {
  productId: string;
  quantity: number;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue?: number;
};

// --------------------------------------------------------
// FUNCIONES ORIGINALES DEL BACKUP (Create & Cancel)
// --------------------------------------------------------

export async function createOrder(
  customerId: string, 
  priceTier: PriceTier, 
  items: OrderItemInput[],
  shippingAddress: string,
  feePercent: number = 0 
) {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) return { error: "No estás autorizado." };
  if (!customerId || items.length === 0) return { error: "Faltan datos." };

  let newOrderId = "";

  try {
    await prisma.$transaction(async (tx) => {
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } });

      let subtotalOrder = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product) throw new Error(\`Producto \${item.productId} no encontrado\`);
        if (product.currentStock < item.quantity) throw new Error(\`Stock insuficiente para \${product.name}\`);

        let basePrice = 0;
        switch (priceTier) {
          case "MAYOR": basePrice = product.priceMayor; break;
          case "MINOR": basePrice = product.priceMinor; break;
          default: basePrice = product.priceFinal;
        }

        let unitPrice = basePrice; 
        
        const subtotal = unitPrice * item.quantity;
        subtotalOrder += subtotal;

        await tx.product.update({
          where: { id: product.id },
          data: { currentStock: { decrement: item.quantity } }
        });

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          basePriceTier: priceTier,
          basePrice: basePrice,
          priceAdjustmentType: item.adjustmentType || "NONE",
          priceAdjustmentValue: item.adjustmentValue || 0,
          unitPrice: unitPrice,
          subtotal: subtotal
        });
      }

      const adminFee = subtotalOrder * (feePercent / 100);
      const totalOrder = subtotalOrder + adminFee;
      const orderNumber = \`PED-\${Date.now().toString().slice(-6)}\`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customer: { connect: { id: customerId } },
          shippingAddress: shippingAddress || "Retira en local",
          appliedPriceTier: priceTier,
          subtotal: subtotalOrder,
          adminFee: adminFee,
          total: totalOrder,
          status: "NO_PAGO", 
          items: { create: orderItemsData },
          user: { connect: { id: userId } }
        }
      });
      
      newOrderId = order.id;
    });

  } catch (error: any) {
    console.error("Error:", error);
    return { error: error.message || "Error al procesar." };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/productos");
  redirect(\`/admin/pedidos/\${newOrderId}\`);
}

export async function cancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order || order.status === 'CANCELLED') return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { increment: item.quantity } }
      });
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" }
    });
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/productos");
  redirect("/admin/pedidos");
}

// --------------------------------------------------------
// NUEVAS FUNCIONES (Filtrado y Hoja de Ruta)
// --------------------------------------------------------

export async function markOrdersAsPrinted(orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) return;
  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: { status: 'IMPRESO' }
  });
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function updateOrderStatus(orderId: string, newStatus: any) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus }
  });
  revalidatePath("/admin/pedidos");
}

export async function getFilteredOrders(status?: string, search?: string) {
  const where: any = {};

  if (status && status !== 'TODOS') {
    where.status = status;
  } else if (!status) {
    where.status = { notIn: ['IMPRESO', 'CANCELLED', 'DELIVERED'] };
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  return await prisma.order.findMany({
    where,
    include: { customer: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });
}`,

  // ==========================================
  // 3. FRONTEND PEDIDOS: LÓGICA NUEVA + ESTÉTICA BACKUP
  // ==========================================
  'src/app/admin/pedidos/page.tsx': `'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { getFilteredOrders, updateOrderStatus } from "@/actions/orders-actions";
import { Printer, Search, CheckSquare, Square, Plus, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [filterStatus]); 

  async function loadOrders() {
    setLoading(true);
    const data = await getFilteredOrders(filterStatus, searchTerm);
    setOrders(data);
    setLoading(false);
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) setSelectedIds([]);
    else setSelectedIds(orders.map(o => o.id));
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    await updateOrderStatus(id, newStatus);
    loadOrders(); 
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) {
        alert("Selecciona al menos un pedido.");
        return;
    }
    const idsParam = selectedIds.join(',');
    router.push(\`/admin/pedidos/imprimir?ids=\${idsParam}\`);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER: Estilo Backup (Dark Neon) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading text-brand-primary">Pedidos</h1>
          <p className="text-gray-500">Gestión de ventas y cobros</p>
        </div>
        
        <div className="flex gap-3">
            {/* Botón Nuevo Pedido (Estilo Backup) */}
            <Link 
                href="/admin/pedidos/nuevo" 
                className="bg-brand-accent hover:bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
            >
                <Plus size={20} /> Nuevo Pedido
            </Link>

            {/* Botón Imprimir Hoja (Estilo Nuevo) */}
            <button 
                onClick={handlePrint}
                disabled={selectedIds.length === 0}
                className={\`bg-[#0E386F] hover:bg-[#092446] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm \${selectedIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}\`}
            >
                <Printer size={20} /> Hoja de Ruta (\${selectedIds.length})
            </button>
        </div>
      </div>

      {/* FILTROS (Estilo adaptado al dark mode del backup) */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={20}/>
            <input 
                placeholder="Buscar Cliente, N° Orden..." 
                className="w-full pl-10 p-3 bg-brand-card border border-brand-border rounded-lg text-brand-text outline-none focus:border-brand-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
            />
        </div>
        <select 
            className="p-3 bg-brand-card border border-brand-border rounded-lg text-brand-text font-bold outline-none focus:border-brand-primary"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
        >
            <option value="">Activos (Pendientes)</option>
            <option value="TODOS">Todos</option>
            <option value="NO_PAGO">🔴 No Pagos (Confirmados)</option>
            <option value="PAGO">🟢 Pagos</option>
            <option value="FIADO">🟡 Fiados</option>
            <option value="IMPRESO">🗄️ Impresos/Archivados</option>
            <option value="PENDING">⏳ Pendientes (Web)</option>
        </select>
      </div>

      {/* TABLA (Estilo Backup pero con Checkboxes) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-brand-dark font-heading font-semibold border-b">
              <tr>
                <th className="p-4 w-10">
                    <button onClick={toggleSelectAll} className="hover:text-brand-primary">
                        {selectedIds.length === orders.length && orders.length > 0 ? <CheckSquare /> : <Square />}
                    </button>
                </th>
                <th className="p-4">N° Orden</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Total</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Cargando pedidos...</td></tr>
              ) : orders.map(order => (
                <tr key={order.id} className={\`hover:bg-gray-50 transition-colors \${selectedIds.includes(order.id) ? 'bg-blue-50' : ''}\`}>
                  <td className="p-4">
                    <button onClick={() => toggleSelect(order.id)} className="text-gray-400 hover:text-brand-primary">
                        {selectedIds.includes(order.id) ? <CheckSquare className="text-brand-primary"/> : <Square />}
                    </button>
                  </td>
                  <td className="p-4 font-mono text-brand-accent">
                    {order.orderNumber}
                  </td>
                  <td className="p-4 font-medium text-brand-dark">
                    {order.customer.firstName} {order.customer.lastName}
                    <div className="text-xs text-gray-400">{order.customer.businessName}</div>
                  </td>
                  <td className="p-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-brand-dark">\$\${order.total.toLocaleString()}</td>
                  <td className="p-4">
                        <select 
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={\`px-2 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none bg-white \${
                                order.status === 'PAGO' ? 'text-green-700 border-green-200 bg-green-50' :
                                order.status === 'FIADO' ? 'text-yellow-700 border-yellow-200 bg-yellow-50' :
                                order.status === 'NO_PAGO' ? 'text-red-700 border-red-200 bg-red-50' :
                                'text-gray-600 border-gray-200'
                            }\`}
                        >
                            {/* Mostramos opciones viejas y nuevas */}
                            <option value="NO_PAGO">NO PAGO</option>
                            <option value="PAGO">PAGO</option>
                            <option value="FIADO">FIADO</option>
                            <option value="CONFIRMED">CONFIRMADO</option>
                            <option value="PENDING">PENDIENTE</option>
                            <option value="IMPRESO">ARCHIVADO</option>
                        </select>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                     <Link href={\`/admin/pedidos/\${order.id}\`} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                        <Eye size={20} />
                     </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && !loading && (
             <div className="p-10 text-center text-gray-500">
                No hay pedidos en esta vista.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}`,

  // ==========================================
  // 4. NUEVA PÁGINA: HOJA DE RUTA (IMPRIMIBLE)
  // ==========================================
  'src/app/admin/pedidos/imprimir/page.tsx': `import { prisma } from "@/lib/prisma";
import { markOrdersAsPrinted } from "@/actions/orders-actions";
import Link from "next/link";
import { ArrowLeft, Printer, CheckCircle, Truck } from "lucide-react";

export default async function HojaDeRutaPage({ searchParams }: { searchParams: Promise<{ ids: string }> }) {
  const { ids } = await searchParams;
  
  if (!ids) return <div className="p-10 text-black">No se seleccionaron pedidos.</div>;

  const idArray = ids.split(',');

  const orders = await prisma.order.findMany({
    where: { id: { in: idArray } },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { customer: { address: 'asc' } }
  });

  const totalLoad = orders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans">
      
      {/* HEADER DE CONTROL (No sale impreso) */}
      <div className="print:hidden mb-8 flex justify-between items-center bg-gray-100 p-4 rounded-xl border border-gray-300">
        <Link href="/admin/pedidos" className="flex items-center gap-2 text-gray-600 hover:text-black font-bold">
            <ArrowLeft /> Volver
        </Link>
        <div className="flex gap-4">
            <button 
                onClick={() => { 'use client'; window.print(); }} 
                className="bg-[#0E386F] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#092446]"
            >
                <Printer /> Imprimir Hoja
            </button>
            <form action={async () => { 'use server'; await markOrdersAsPrinted(idArray); }}>
                <button className="bg-[#34B3A0] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#2a9181]">
                    <CheckCircle /> Confirmar y Archivar
                </button>
            </form>
        </div>
      </div>

      {/* DISEÑO DE IMPRESIÓN (BLANCO Y NEGRO CLARO) */}
      <div className="max-w-4xl mx-auto border border-gray-300 p-8 shadow-sm print:shadow-none print:border-0 print:p-0 bg-white">
        
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold uppercase tracking-wider flex items-center gap-2">
                    <Truck className="text-black" size={28}/> HOJA DE RUTA
                </h1>
                <p className="text-sm mt-1 text-gray-600">Fecha: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg">Pedidos: {orders.length}</p>
                <p className="font-bold text-lg">Total Carga: \$\${totalLoad.toLocaleString()}</p>
            </div>
        </div>

        <div className="space-y-6">
            {orders.map((order, index) => (
                <div key={order.id} className="border-b border-gray-300 pb-4 break-inside-avoid">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <span className="text-sm font-bold bg-black text-white px-2 py-0.5 rounded mr-2">#{index + 1}</span>
                            <span className="font-bold text-lg">{order.customer.firstName} {order.customer.lastName}</span>
                            <span className="text-sm text-gray-600 ml-2">({order.customer.businessName || 'Final'})</span>
                        </div>
                        <div className="text-right">
                             <span className="font-mono font-bold">Ord: {order.orderNumber}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 ml-2">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-gray-500">Destino</p>
                            <p className="font-medium text-lg">{order.shippingAddress || "RETIRA EN LOCAL"}</p>
                            <p className="text-sm">{order.customer.city} {order.customer.phone && \`| Tel: \${order.customer.phone}\`}</p>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-gray-500">A Cobrar</p>
                            
                            {order.status === 'NO_PAGO' || order.status === 'CONFIRMED' ? (
                                <p className="font-bold text-2xl mt-1">\$\${order.total.toLocaleString()}</p>
                            ) : order.status === 'FIADO' ? (
                                <div>
                                    <span className="text-sm font-bold border border-black px-1 rounded">CTA CTE</span>
                                    <p className="font-bold text-lg">\$\${order.total.toLocaleString()}</p>
                                </div>
                            ) : (
                                <span className="text-sm font-bold border border-black px-1 rounded bg-black text-white">PAGADO</span>
                            )}
                        </div>
                    </div>
                    {order.notes && (
                        <div className="mt-2 ml-2 text-sm italic bg-gray-100 p-1 border border-gray-200">
                            Nota: {order.notes}
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Fusión completada: Backup + Nuevos Estados + Hoja de Ruta...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Generado: ${filePath}`);
  }
}
createFiles();