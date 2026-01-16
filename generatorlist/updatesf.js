const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. SCHEMA: AGREGAR 'trackStock' A PRODUCTO
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

enum OrderStatus {
  DRAFT
  PENDING
  CONFIRMED
  PREPARING
  READY
  DELIVERING
  DELIVERED
  CANCELLED
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

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  prefix    String   
  createdAt DateTime @default(now())
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
  preferences    NotificationPreference?
}

model NotificationPreference {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  notifyOrders Boolean @default(true)
  notifyStock  Boolean @default(true)
  notifySystem Boolean @default(false)
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
  
  // STOCK
  trackStock   Boolean   @default(true) // NUEVO CAMPO
  currentStock Int       @default(0)
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
  // 2. PRODUCTS ACTIONS: LOGS + TRACKSTOCK
  // ==========================================
  'src/actions/products-actions.ts': `'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registrarLog } from "@/actions/logger-actions";
import { sendNotificationToAdmins } from "@/actions/notifications-actions";

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const code = formData.get("code") as string;
  const category = formData.get("category") as string;
  const priceMayor = parseFloat(formData.get("priceMayor") as string) || 0;
  const priceMinor = parseFloat(formData.get("priceMinor") as string) || 0;
  const priceFinal = parseFloat(formData.get("priceFinal") as string) || 0;
  
  // Lógica de Stock Opcional
  const trackStock = formData.get("trackStock") === "on"; // Checkbox
  const currentStock = trackStock ? (parseInt(formData.get("currentStock") as string) || 0) : 0;
  const minStock = trackStock ? (parseInt(formData.get("minStock") as string) || 0) : 0;

  await prisma.product.create({
    data: { 
        name, code, category, 
        priceMayor, priceMinor, priceFinal, 
        currentStock, minStock, trackStock,
        unit: "UNIDAD", isActive: true, isDeleted: false 
    }
  });

  await registrarLog("CREAR_PRODUCTO", \`Nuevo producto: \${name} (\${code}) - Stock: \${trackStock ? currentStock : 'No Controla'}\`, "PRODUCTO");
  // Notificación opcional (solo logs para no spamear)

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function updateProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const priceFinal = parseFloat(formData.get("priceFinal") as string) || 0;
  
  const trackStock = formData.get("trackStock") === "on";
  const currentStock = trackStock ? (parseInt(formData.get("currentStock") as string) || 0) : 0;

  await prisma.product.update({ 
    where: { id }, 
    data: { name, priceFinal, currentStock, trackStock } 
  });
  
  await registrarLog("EDITAR_PRODUCTO", \`Actualizó producto: \${name}\`, "PRODUCTO");

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function deleteProduct(id: string) {
  await prisma.product.update({ where: { id }, data: { isDeleted: true } });
  
  await registrarLog("ELIMINAR_PRODUCTO", \`Eliminó producto ID: \${id}\`, "PRODUCTO");
  // Notificación crítica
  await sendNotificationToAdmins("Producto Eliminado", \`Se eliminó el producto ID \${id} del sistema.\`, "SYSTEM");

  revalidatePath("/admin/productos");
}`,

  // ==========================================
  // 3. ORDERS ACTIONS: LÓGICA DE STOCK HÍBRIDA + LOGS COMPLETOS
  // ==========================================
  'src/actions/orders-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PriceTier, PriceAdjustmentType } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { registrarLog } from "@/actions/logger-actions"; 
import { sendNotificationToAdmins } from "@/actions/notifications-actions";

type OrderItemInput = {
  productId: string;
  quantity: number;
  adjustmentType: PriceAdjustmentType;
  adjustmentValue?: number;
};

// --- CREAR PEDIDO ---
export async function createOrder(
  customerId: string, 
  priceTier: PriceTier, 
  items: OrderItemInput[],
  shippingAddress: string,
  feePercent: number = 0
) {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) return { error: "No autorizado." };
  if (!customerId || items.length === 0) return { error: "Faltan datos." };

  let newOrderId = "";
  let orderNumberLog = "";
  let totalLog = 0;

  try {
    await prisma.$transaction(async (tx) => {
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } });

      let subtotalOrder = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product) throw new Error(\`Producto \${item.productId} no encontrado\`);
        
        // --- CONTROL DE STOCK HÍBRIDO ---
        if (product.trackStock) {
            if (product.currentStock < item.quantity) {
                throw new Error(\`Stock insuficiente para \${product.name} (Disp: \${product.currentStock})\`);
            }
            // Descontar solo si trackStock es true
            await tx.product.update({
                where: { id: product.id },
                data: { currentStock: { decrement: item.quantity } }
            });
        }

        let basePrice = 0;
        switch (priceTier) {
          case "MAYOR": basePrice = product.priceMayor; break;
          case "MINOR": basePrice = product.priceMinor; break;
          default: basePrice = product.priceFinal;
        }

        const subtotal = basePrice * item.quantity;
        subtotalOrder += subtotal;

        // Alerta de Stock Bajo (Solo si trackea)
        if (product.trackStock && (product.currentStock - item.quantity) <= product.minStock) {
             // Esta notificación se dispara después de la transacción idealmente, 
             // pero para simplificar no la bloqueamos aquí.
        }

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          basePriceTier: priceTier,
          basePrice: basePrice,
          priceAdjustmentType: item.adjustmentType || "NONE",
          priceAdjustmentValue: item.adjustmentValue || 0,
          unitPrice: basePrice,
          subtotal: subtotal
        });
      }

      const adminFee = subtotalOrder * (feePercent / 100);
      const totalOrder = subtotalOrder + adminFee;
      totalLog = totalOrder;
      
      const orderNumber = "PED-" + Date.now().toString().slice(-6);
      orderNumberLog = orderNumber;

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

    // LOGS Y NOTIFICACIONES
    await registrarLog("CREAR_PEDIDO", \`Creó pedido \${orderNumberLog} (\$\${totalLog.toFixed(2)})\`, "PEDIDO");
    
    await sendNotificationToAdmins(
        "Nuevo Pedido", 
        \`Se generó el pedido \${orderNumberLog} por \$\${totalLog.toFixed(2)}\`, 
        "ORDER"
    );

  } catch (error: any) {
    console.error("Error:", error);
    return { error: error.message || "Error al procesar." };
  }

  revalidatePath("/admin/pedidos");
  redirect(\`/admin/pedidos/\${newOrderId}\`);
}

// --- CANCELAR ---
export async function cancelOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: { include: { product: true } } } });
  if (!order || order.status === 'CANCELLED') return;

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      // Devolver stock solo si el producto lo trackea
      if (item.product.trackStock) {
          await tx.product.update({ where: { id: item.productId }, data: { currentStock: { increment: item.quantity } } });
      }
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  });

  await registrarLog("CANCELAR_PEDIDO", \`Canceló el pedido \${order.orderNumber}.\`, "PEDIDO");
  await sendNotificationToAdmins("Pedido Cancelado", \`El pedido \${order.orderNumber} fue cancelado.\`, "ORDER");

  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function updateOrderStatus(orderId: string, newStatus: any) {
  const oldOrder = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, orderNumber: true } });
  await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });

  if (oldOrder) {
    await registrarLog("CAMBIO_ESTADO", \`Pedido \${oldOrder.orderNumber}: \${oldOrder.status} -> \${newStatus}\`, "PEDIDO");
    if (newStatus === 'PAGO') {
        await sendNotificationToAdmins("Pago Recibido", \`El pedido \${oldOrder.orderNumber} ha sido marcado como PAGADO.\`, "ORDER");
    }
  }
  revalidatePath("/admin/pedidos");
}

export async function markOrdersAsPrinted(orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) return;
  await prisma.order.updateMany({ where: { id: { in: orderIds } }, data: { status: 'IMPRESO' } });
  await registrarLog("HOJA_RUTA", \`Generó hoja de ruta para \${orderIds.length} pedidos.\`, "RUTA");
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}

export async function getFilteredOrders(status?: string, search?: string) {
  const where: any = {};
  if (status && status !== 'TODOS') where.status = status;
  else if (!status) where.status = { notIn: ['IMPRESO', 'CANCELLED', 'DELIVERED'] };

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { firstName: { contains: search, mode: 'insensitive' } } },
      { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      { customer: { businessName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  return await prisma.order.findMany({ where, include: { customer: true, user: true }, orderBy: { createdAt: 'desc' }, take: 100 });
}`,

  // ==========================================
  // 4. CLIENTS ACTIONS: LOGS
  // ==========================================
  'src/actions/clients-actions.ts': `'use server'
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { registrarLog } from "@/actions/logger-actions";
import { sendNotificationToAdmins } from "@/actions/notifications-actions";

export async function createClient(formData: FormData) {
  const session = await getSession();
  const userId = session?.user?.id;

  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const dniCuit = formData.get("dniCuit") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || ""; 
  const address = formData.get("address") as string;
  const type = formData.get("type") as "FINAL" | "MAYORISTA";
  const origin = formData.get("origin") as string;

  if (!firstName || !lastName || !dniCuit || !address) return { error: "Faltan datos obligatorios" };

  try {
    await prisma.customer.create({
      data: { 
        firstName, lastName, dniCuit, email: email || null, phone, address, type, 
        businessName: type === 'MAYORISTA' ? formData.get("businessName") as string : null, 
        isDeleted: false, createdById: userId 
      }
    });
    
    await registrarLog("CREAR_CLIENTE", \`Alta de cliente: \${firstName} \${lastName}\`, "CLIENTE");
    
    // Notificación solo para nuevos mayoristas (ejemplo de lógica de negocio)
    if (type === 'MAYORISTA') {
        await sendNotificationToAdmins("Nuevo Mayorista", \`Se registró el cliente mayorista \${businessName || lastName}\`, "SYSTEM");
    }

  } catch (error: any) {
    return { error: "Error: DNI o Email duplicado." };
  }

  revalidatePath("/admin/clientes");
  if (origin === "mobile") redirect("/corredor/pedidos");
  else redirect("/admin/clientes");
}

export async function updateClient(id: string, formData: FormData) {
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    
    await prisma.customer.update({ where: { id }, data: { firstName, lastName, address, phone } });
    await registrarLog("EDITAR_CLIENTE", \`Modificó datos del cliente ID: \${id}\`, "CLIENTE");
  
    revalidatePath("/admin/clientes");
    redirect("/admin/clientes");
}
  
export async function deleteClient(id: string) {
    await prisma.customer.update({ where: { id }, data: { isDeleted: true } });
    await registrarLog("ELIMINAR_CLIENTE", \`Eliminó (soft-delete) cliente ID: \${id}\`, "CLIENTE");
    revalidatePath("/admin/clientes");
}`,

  // ==========================================
  // 5. ROUTES ACTIONS: LOGS + NOTIFICATIONS
  // ==========================================
  'src/actions/routes-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { registrarLog } from "@/actions/logger-actions";
import { sendNotificationToAdmins } from "@/actions/notifications-actions";

export async function createRoute(formData: FormData) {
  const name = formData.get("name") as string;
  const driverId = formData.get("driverId") as string;
  const dateStr = formData.get("date") as string;
  const orderIds = formData.getAll("orderIds") as string[];

  if (!name || !dateStr) return { error: "Faltan datos" };

  let newRouteId = "";

  try {
    const newRoute = await prisma.deliveryRoute.create({
      data: {
        routeNumber: name,
        driverId: driverId && driverId !== "null" ? driverId : null,
        date: new Date(dateStr),
        status: "PENDING"
      }
    });
    newRouteId = newRoute.id;

    if (orderIds.length > 0) {
        await prisma.order.updateMany({
            where: { id: { in: orderIds } },
            data: { deliveryRouteId: newRoute.id, status: 'DELIVERING' }
        });
    }

    await registrarLog("CREAR_RUTA", \`Creó ruta \${name} con \${orderIds.length} pedidos\`, "RUTA");

  } catch (error) {
    console.error("Error al crear ruta:", error);
    return { error: "Error al crear la ruta" };
  }

  revalidatePath("/admin/rutas");
  redirect(\`/admin/rutas/\${newRouteId}\`);
}

export async function toggleOrderInRoute(orderId: string, routeId: string | null) {
  let updateData: any = { deliveryRouteId: routeId };
  if (routeId) {
    updateData.status = "DELIVERING"; 
    updateData.deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();
    updateData.requiresCode = true;
  } else {
    updateData.status = "CONFIRMED";
    updateData.deliveryCode = null;
    updateData.requiresCode = false;
  }

  await prisma.order.update({ where: { id: orderId }, data: updateData });
  
  await registrarLog("MODIFICAR_RUTA", \`Movió pedido \${orderId} \${routeId ? 'a ruta' : 'fuera de ruta'}\`, "RUTA");

  revalidatePath("/admin/rutas");
  if(routeId) revalidatePath(\`/admin/rutas/\${routeId}\`);
}

export async function completeRoute(routeId: string) {
  await prisma.deliveryRoute.update({ where: { id: routeId }, data: { status: "COMPLETED" } });
  await prisma.order.updateMany({ where: { deliveryRouteId: routeId }, data: { status: "DELIVERED" } });

  await registrarLog("COMPLETAR_RUTA", \`Finalizó ruta ID: \${routeId}\`, "RUTA");
  await sendNotificationToAdmins("Ruta Completada", "El camión ha finalizado su recorrido.", "SYSTEM");

  revalidatePath("/admin/rutas");
  redirect("/admin/rutas");
}

export async function deliverOrder(orderId: string, inputCode?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Pedido no encontrado" };

  if (order.requiresCode && order.deliveryCode) {
    if (inputCode !== order.deliveryCode) return { error: "Código incorrecto" }; 
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED", deliveryDate: new Date() }
  });

  await registrarLog("ENTREGA_PEDIDO", \`Entregó pedido \${order.orderNumber}\`, "RUTA");

  if (order.deliveryRouteId) revalidatePath(\`/admin/rutas/\${order.deliveryRouteId}\`);
  revalidatePath(\`/admin/rutas\`); 
}
}`,

  // ==========================================
  // 6. UPDATE: COMPONENTE PRODUCT FORM (Con Checkbox de Stock)
  // ==========================================
  'src/components/products/ProductForm.tsx': `'use client'

import { useState, useEffect } from "react";
import { createProduct } from "@/actions/products-actions";
import { getCategories, createCategory, deleteCategory, generateSKU } from "@/actions/categories-actions";
import { ArrowLeft, Save, Trash2, X, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProductForm() {
  const router = useRouter();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTrackStock, setIsTrackStock] = useState(true); // NUEVO ESTADO

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPrefix, setNewCatPrefix] = useState("");

  useEffect(() => { loadCats(); }, []);

  async function loadCats() {
    const data = await getCategories();
    setCategories(data);
  }

  const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setSelectedCategory(catId);
    if (catId) {
        const cat = categories.find(c => c.id === catId);
        if (cat) {
            setLoading(true);
            const sku = await generateSKU(cat.prefix);
            setGeneratedCode(sku);
            setLoading(false);
        }
    } else {
        setGeneratedCode("");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName || !newCatPrefix) return;
    await createCategory(newCatName, newCatPrefix);
    setNewCatName(""); setNewCatPrefix(""); loadCats();
  };

  const handleDeleteCategory = async (id: string) => {
    if(confirm("¿Seguro?")) { await deleteCategory(id); loadCats(); }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/productos" className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">Nuevo Producto</h1>
          <p className="text-slate-500 text-sm">Alta de inventario</p>
        </div>
      </div>

      <form action={createProduct} className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-sm font-bold text-slate-400">Nombre del Producto *</label>
            <input name="name" required className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white placeholder-slate-600" placeholder="Ej: Coca Cola 2.25L" />
          </div>

          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-sm font-bold text-slate-400 flex justify-between">
                Categoría *
                <button type="button" onClick={() => setIsModalOpen(true)} className="text-cyan-400 text-xs hover:underline flex items-center gap-1">
                    <Settings size={12}/> Gestionar
                </button>
            </label>
            <div className="relative">
                <input type="hidden" name="category" value={categories.find(c => c.id === selectedCategory)?.name || ""} />
                <select required className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white appearance-none" value={selectedCategory} onChange={handleCategoryChange}>
                    <option value="">-- Seleccionar --</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name} ({cat.prefix})</option>)}
                </select>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-sm font-bold text-slate-400">Código (SKU) *</label>
            <div className="relative">
                <input name="code" required value={generatedCode} onChange={(e) => setGeneratedCode(e.target.value)} className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-cyan-400 font-mono font-bold" placeholder="Seleccione categoría..." />
                {loading && <span className="absolute right-3 top-3 text-xs text-slate-500 animate-pulse">Generando...</span>}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-950/50 rounded-xl border border-slate-800">
            <h3 className="font-bold text-cyan-400 mb-4 text-sm uppercase flex items-center gap-2">💰 Lista de Precios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Precio Mayorista</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-600">$</span>
                        <input name="priceMayor" type="number" step="0.01" className="w-full pl-6 p-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white" placeholder="0.00" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Precio Minorista</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-600">$</span>
                        <input name="priceMinor" type="number" step="0.01" className="w-full pl-6 p-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white" placeholder="0.00" />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Precio Final (Público)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-600">$</span>
                        <input name="priceFinal" type="number" step="0.01" required className="w-full pl-6 p-2 bg-slate-900 border border-slate-700 rounded-lg font-bold text-cyan-400 focus:border-cyan-500 outline-none" placeholder="0.00" />
                    </div>
                </div>
            </div>
        </div>

        {/* SECCIÓN STOCK CON TOGGLE */}
        <div className="p-6 bg-slate-950/50 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-cyan-400 text-sm uppercase">📦 Gestión de Stock</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="trackStock" checked={isTrackStock} onChange={(e) => setIsTrackStock(e.target.checked)} className="w-4 h-4 accent-cyan-500" />
                    <span className="text-sm text-slate-300">Controlar Inventario</span>
                </label>
            </div>
            
            <div className={\`grid grid-cols-2 gap-6 transition-opacity duration-300 \${!isTrackStock ? 'opacity-30 pointer-events-none' : ''}\`}>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Stock Actual</label>
                    <input name="currentStock" type="number" disabled={!isTrackStock} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white" placeholder="0" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Stock Mínimo</label>
                    <input name="minStock" type="number" disabled={!isTrackStock} className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white" placeholder="10" />
                </div>
            </div>
            {!isTrackStock && <p className="text-xs text-slate-500 mt-2 italic text-center">* Este producto tendrá stock infinito y no se descontará al vender.</p>}
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-transform active:scale-95">
            <Save size={20} />
            Guardar Producto
          </button>
        </div>

      </form>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-xl border border-slate-700 shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Gestionar Categorías</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X/></button>
                </div>
                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                    {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div><span className="font-bold text-white">{cat.name}</span><span className="ml-2 text-xs bg-cyan-900 text-cyan-400 px-1 rounded">{cat.prefix}</span></div>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2"><input placeholder="Nombre (Ej: Bebidas)" className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm outline-none" value={newCatName} onChange={e => setNewCatName(e.target.value)}/></div>
                    <div className="col-span-1"><input placeholder="Prefijo (BEB)" className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm outline-none uppercase" maxLength={3} value={newCatPrefix} onChange={e => setNewCatPrefix(e.target.value.toUpperCase())}/></div>
                </div>
                <button onClick={handleCreateCategory} disabled={!newCatName || !newCatPrefix} className="w-full mt-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded-lg font-bold text-sm transition-colors">+ Agregar Nueva</button>
            </div>
        </div>
      )}
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 FEATURES V3 FINAL: Stock Opcional + Logs/Notificaciones Globales...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Generado: ${filePath}`);
  }
}
createFiles();