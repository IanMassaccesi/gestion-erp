const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. SCHEMA: AGREGAMOS MODELO CATEGORY
  // ==========================================
  'prisma/schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// --- ENUMS ---
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

// --- NUEVO MODELO: CATEGORÍAS ---
model Category {
  id        String   @id @default(cuid())
  name      String   @unique // Ej: "Cigarrillos"
  prefix    String   // Ej: "CIG"
  createdAt DateTime @default(now())
}

// --- MODELOS EXISTENTES (SIN CAMBIOS) ---

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
  // 2. ACTIONS: LOGICA DE CATEGORIAS Y SKU
  // ==========================================
  'src/actions/categories-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// OBTENER CATEGORÍAS
export async function getCategories() {
  return await prisma.category.findMany({ orderBy: { name: 'asc' } });
}

// CREAR CATEGORÍA
export async function createCategory(name: string, prefix: string) {
  if (!name || !prefix) return { error: "Nombre y prefijo requeridos" };
  
  try {
    await prisma.category.create({
      data: { name, prefix: prefix.toUpperCase() }
    });
    revalidatePath("/admin/productos/nuevo");
    return { success: true };
  } catch (e) {
    return { error: "La categoría ya existe." };
  }
}

// BORRAR CATEGORÍA
export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/productos/nuevo");
}

// GENERAR SKU AUTOMÁTICO
export async function generateSKU(prefix: string) {
  if (!prefix) return "";

  // Buscar el último producto con ese prefijo
  const lastProduct = await prisma.product.findFirst({
    where: { code: { startsWith: \`\${prefix}-\` } },
    orderBy: { code: 'desc' }, // Ordenar para obtener el último
    select: { code: true }
  });

  if (!lastProduct || !lastProduct.code) {
    return \`\${prefix}-001\`; // Primero de la serie
  }

  // Extraer número: CIG-014 -> 14
  const parts = lastProduct.code.split('-');
  const lastNumber = parseInt(parts[parts.length - 1]);

  if (isNaN(lastNumber)) return \`\${prefix}-001\`; // Fallback

  const nextNumber = lastNumber + 1;
  return \`\${prefix}-\${nextNumber.toString().padStart(3, '0')}\`;
}`,

  // ==========================================
  // 3. COMPONENTE: FORMULARIO PRODUCTO INTELIGENTE
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
  
  // Estado del Formulario
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado del Modal de Categorías
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPrefix, setNewCatPrefix] = useState("");

  // Cargar categorías al inicio
  useEffect(() => {
    loadCats();
  }, []);

  async function loadCats() {
    const data = await getCategories();
    setCategories(data);
  }

  // Cuando cambia la categoría, generar SKU
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

  // Crear nueva categoría
  const handleCreateCategory = async () => {
    if (!newCatName || !newCatPrefix) return;
    await createCategory(newCatName, newCatPrefix);
    setNewCatName("");
    setNewCatPrefix("");
    loadCats();
  };

  // Borrar categoría
  const handleDeleteCategory = async (id: string) => {
    if(confirm("¿Seguro?")) {
        await deleteCategory(id);
        loadCats();
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Header */}
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
        
        {/* Información Básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Nombre */}
          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-sm font-bold text-slate-400">Nombre del Producto *</label>
            <input name="name" required className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white placeholder-slate-600" placeholder="Ej: Coca Cola 2.25L" />
          </div>

          {/* Categoría Inteligente */}
          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-sm font-bold text-slate-400 flex justify-between">
                Categoría *
                <button type="button" onClick={() => setIsModalOpen(true)} className="text-cyan-400 text-xs hover:underline flex items-center gap-1">
                    <Settings size={12}/> Gestionar
                </button>
            </label>
            <div className="relative">
                {/* Input oculto para compatibilidad con la action de productos */}
                <input type="hidden" name="category" value={categories.find(c => c.id === selectedCategory)?.name || ""} />
                
                <select 
                    required 
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white appearance-none"
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                >
                    <option value="">-- Seleccionar --</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name} ({cat.prefix})</option>
                    ))}
                </select>
            </div>
          </div>

          {/* Código Automático */}
          <div className="col-span-2 md:col-span-1 space-y-2">
            <label className="text-sm font-bold text-slate-400">Código (SKU) *</label>
            <div className="relative">
                <input 
                    name="code" 
                    required 
                    value={generatedCode}
                    onChange={(e) => setGeneratedCode(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-cyan-400 font-mono font-bold" 
                    placeholder="Seleccione categoría..." 
                />
                {loading && <span className="absolute right-3 top-3 text-xs text-slate-500 animate-pulse">Generando...</span>}
            </div>
          </div>

        </div>

        {/* Precios */}
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

        {/* Stock */}
        <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">Stock Actual</label>
                <input name="currentStock" type="number" required className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white" placeholder="0" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">Stock Mínimo</label>
                <input name="minStock" type="number" required className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg focus:border-cyan-500 outline-none text-white" placeholder="10" />
            </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-transform active:scale-95">
            <Save size={20} />
            Guardar Producto
          </button>
        </div>

      </form>

      {/* MODAL GESTOR CATEGORÍAS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-xl border border-slate-700 shadow-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Gestionar Categorías</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X/></button>
                </div>

                <div className="space-y-2 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                    {categories.length === 0 && <p className="text-slate-600 text-center italic text-sm">No hay categorías.</p>}
                    {categories.map(cat => (
                        <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                            <div>
                                <span className="font-bold text-white">{cat.name}</span>
                                <span className="ml-2 text-xs bg-cyan-900 text-cyan-400 px-1 rounded">{cat.prefix}</span>
                            </div>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                        <input 
                            placeholder="Nombre (Ej: Bebidas)" 
                            className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm outline-none"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                        />
                    </div>
                    <div className="col-span-1">
                        <input 
                            placeholder="Prefijo (BEB)" 
                            className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white text-sm outline-none uppercase"
                            maxLength={3}
                            value={newCatPrefix}
                            onChange={e => setNewCatPrefix(e.target.value.toUpperCase())}
                        />
                    </div>
                </div>
                <button 
                    onClick={handleCreateCategory}
                    disabled={!newCatName || !newCatPrefix}
                    className="w-full mt-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded-lg font-bold text-sm transition-colors"
                >
                    + Agregar Nueva
                </button>
            </div>
        </div>
      )}

    </div>
  );
}`,

  // ==========================================
  // 4. PÁGINA (WRAPPER)
  // ==========================================
  'src/app/admin/productos/nuevo/page.tsx': `import ProductForm from "@/components/products/ProductForm";

export default function NuevoProductoPage() {
  return <ProductForm />;
}`
};

function createFiles() {
  console.log('🚀 Actualizando Nuevo Producto (Gestor Categorías + SKU Automático)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Generado: ${filePath}`);
  }
}
createFiles();