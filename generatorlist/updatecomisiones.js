const fs = require('fs');
const path = require('path');

const files = {
  // ==========================================
  // 1. BASE DE DATOS: AGREGAR TASA DE COMISIÓN AL USUARIO
  // ==========================================
  'prisma/schema.prisma': `
// ... (Modelos anteriores) ...

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      Role     @default(CORREDOR)
  isActive  Boolean  @default(true)
  
  isRunner  Boolean  @default(false)
  isDriver  Boolean  @default(false)

  // --- NUEVO CAMPO: COMISIÓN PERSONAL ---
  commissionRate Float @default(0) // Porcentaje fijo (ej: 5.0 para 5%)

  orders    Order[]  @relation("OrderCreatedBy")
  createdClients Customer[] @relation("ClientCreator")
  routes    DeliveryRoute[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ... (Resto igual: Order, Customer, Product...) ...
// Asegúrate de que Order tenga el campo adminFee Float @default(0) que agregamos antes
model Order {
  id              String    @id @default(cuid())
  orderNumber     String    @unique
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  status          OrderStatus @default(PENDING)
  subtotal        Float
  total           Float
  adminFee        Float     @default(0) // Aquí se guardará el valor ($) de la comisión
  shippingAddress String?
  deliveryCode    String?
  requiresCode    Boolean   @default(false)
  appliedPriceTier PriceTier @default(FINAL)
  customer        Customer  @relation(fields: [customerId], references: [id])
  customerId      String
  items           OrderItem[]
  user            User?     @relation("OrderCreatedBy", fields: [userId], references: [id])
  userId          String?
  route           DeliveryRoute? @relation(fields: [routeId], references: [id])
  routeId         String?
}

// ... (Product, OrderItem, DeliveryRoute, etc) ...
`,

  // ==========================================
  // 2. ACTIONS: CREAR Y EDITAR USUARIOS CON COMISIÓN
  // ==========================================
  'src/actions/users-actions.ts': `'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";

// CREAR USUARIO
export async function createStaff(formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const isRunner = formData.get("isRunner") === "on";
  const isDriver = formData.get("isDriver") === "on";
  
  // Capturamos la comisión (si viene vacía es 0)
  const commissionRate = parseFloat(formData.get("commissionRate") as string) || 0;

  if (!firstName || !lastName || !email || !password) return { error: "Faltan datos" };

  try {
    const hashedPassword = await hash(password, 12);
    await prisma.user.create({
      data: {
        firstName, lastName, email, 
        password: hashedPassword,
        role: "CORREDOR",
        isRunner, isDriver,
        commissionRate // Guardamos el %
      }
    });
  } catch (error) {
    return { error: "Error: Email ya existe." };
  }

  revalidatePath("/admin/equipo");
  redirect("/admin/equipo");
}

// EDITAR USUARIO (NUEVA FUNCIÓN)
export async function updateStaff(id: string, formData: FormData) {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const isRunner = formData.get("isRunner") === "on";
  const isDriver = formData.get("isDriver") === "on";
  const commissionRate = parseFloat(formData.get("commissionRate") as string) || 0;

  // Si mandan password, lo hasheamos, si no, lo ignoramos
  const password = formData.get("password") as string;
  const dataToUpdate: any = { firstName, lastName, email, isRunner, isDriver, commissionRate };
  
  if (password) {
    dataToUpdate.password = await hash(password, 12);
  }

  await prisma.user.update({
    where: { id },
    data: dataToUpdate
  });

  revalidatePath("/admin/equipo");
  redirect("/admin/equipo");
}`,

  // ==========================================
  // 3. ADMIN: PANTALLA NUEVO EMPLEADO (Con campo Comisión)
  // ==========================================
  'src/app/admin/equipo/nuevo/page.tsx': `import { createStaff } from "@/actions/users-actions";
import Link from "next/link";
import { ArrowLeft, Save, Percent } from "lucide-react";

export default function NuevoEmpleadoPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/equipo" className="p-2 hover:bg-brand-card rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold font-heading text-white">Nuevo Empleado</h1>
      </div>

      <form action={createStaff} className="bg-brand-card p-8 rounded-xl shadow-lg border border-brand-border space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium text-brand-muted mb-1 block">Nombre</label><input name="firstName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
          <div><label className="text-sm font-medium text-brand-muted mb-1 block">Apellido</label><input name="lastName" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
        </div>
        
        <div><label className="text-sm font-medium text-brand-muted mb-1 block">Email</label><input type="email" name="email" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
        <div><label className="text-sm font-medium text-brand-muted mb-1 block">Contraseña</label><input type="password" name="password" required className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>

        <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
          <p className="text-sm font-bold text-brand-primary mb-3">Roles y Comisiones</p>
          <div className="space-y-4">
            <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-white"><input type="checkbox" name="isRunner" className="w-4 h-4" /> Vendedor</label>
                <label className="flex items-center gap-2 cursor-pointer text-white"><input type="checkbox" name="isDriver" className="w-4 h-4" /> Chofer</label>
            </div>
            
            <div>
                <label className="text-xs font-bold text-brand-muted uppercase block mb-1">Comisión de Venta (%)</label>
                <div className="relative">
                    <Percent className="absolute left-3 top-3 text-brand-muted" size={16} />
                    <input type="number" step="0.1" name="commissionRate" defaultValue="0" className="w-full pl-10 p-2 bg-brand-input border border-brand-border rounded text-white" />
                </div>
                <p className="text-xs text-brand-muted mt-1">Este porcentaje se aplicará automáticamente a sus pedidos.</p>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-brand-primary text-brand-dark py-3 rounded-lg font-bold flex justify-center gap-2"><Save size={20} /> Guardar Empleado</button>
      </form>
    </div>
  );
}`,

  // ==========================================
  // 4. ADMIN: LISTA EQUIPO (Mostrar Comisión)
  // ==========================================
  'src/app/admin/equipo/page.tsx': `import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, User, ShoppingBag, Truck, Edit } from "lucide-react";

export default async function EquipoPage() {
  const staff = await prisma.user.findMany({
    where: { role: 'CORREDOR' },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold font-heading text-white">Equipo</h1><p className="text-brand-muted">Gestión de personal</p></div>
        <Link href="/admin/equipo/nuevo" className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-neon"><Plus size={20} /> Nuevo</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((user) => (
          <div key={user.id} className="bg-brand-card p-6 rounded-xl border border-brand-border relative group hover:border-brand-primary/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-dark rounded-full text-brand-muted"><User size={24} /></div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{user.firstName} {user.lastName}</h3>
                <p className="text-sm text-brand-muted mb-2">{user.email}</p>
                <div className="flex gap-2 flex-wrap mb-3">
                  {user.isRunner && <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-2 py-1 rounded flex gap-1"><ShoppingBag size={12} /> {user.commissionRate}% Com.</span>}
                  {user.isDriver && <span className="text-xs font-bold bg-green-500/20 text-green-300 px-2 py-1 rounded flex gap-1"><Truck size={12} /> Chofer</span>}
                </div>
              </div>
            </div>
            {/* Botón Editar (Simplificado: lleva a una página de edición que deberíamos crear, por ahora reutilizamos el concepto) */}
            <Link href={\`/admin/equipo/\${user.id}\`} className="absolute top-4 right-4 p-2 text-brand-muted hover:text-white"><Edit size={16} /></Link>
          </div>
        ))}
      </div>
    </div>
  );
}`,

  // ==========================================
  // 5. ADMIN: PAGINA EDITAR EMPLEADO
  // ==========================================
  'src/app/admin/equipo/[id]/page.tsx': `import { prisma } from "@/lib/prisma";
import { updateStaff } from "@/actions/users-actions";
import Link from "next/link";
import { ArrowLeft, Save, Percent } from "lucide-react";

export default async function EditarEmpleadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if(!user) return <div>No encontrado</div>;

  const updateStaffWithId = updateStaff.bind(null, id);

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/equipo" className="p-2 hover:bg-brand-card rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold font-heading text-white">Editar Empleado</h1>
      </div>

      <form action={updateStaffWithId} className="bg-brand-card p-8 rounded-xl shadow-lg border border-brand-border space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm text-brand-muted mb-1 block">Nombre</label><input name="firstName" defaultValue={user.firstName} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
          <div><label className="text-sm text-brand-muted mb-1 block">Apellido</label><input name="lastName" defaultValue={user.lastName} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
        </div>
        <div><label className="text-sm text-brand-muted mb-1 block">Email</label><input name="email" defaultValue={user.email} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" /></div>
        
        <div className="p-4 bg-brand-dark rounded-lg border border-brand-border">
          <p className="text-sm font-bold text-brand-primary mb-3">Roles y Comisiones</p>
          <div className="space-y-4">
            <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-white"><input type="checkbox" name="isRunner" defaultChecked={user.isRunner} className="w-4 h-4" /> Vendedor</label>
                <label className="flex items-center gap-2 cursor-pointer text-white"><input type="checkbox" name="isDriver" defaultChecked={user.isDriver} className="w-4 h-4" /> Chofer</label>
            </div>
            <div>
                <label className="text-xs font-bold text-brand-muted uppercase block mb-1">Comisión de Venta (%)</label>
                <div className="relative">
                    <Percent className="absolute left-3 top-3 text-brand-muted" size={16} />
                    <input type="number" step="0.1" name="commissionRate" defaultValue={user.commissionRate} className="w-full pl-10 p-2 bg-brand-input border border-brand-border rounded text-white" />
                </div>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-brand-primary text-brand-dark py-3 rounded-lg font-bold flex justify-center gap-2"><Save size={20} /> Guardar Cambios</button>
      </form>
    </div>
  );
}`,

  // ==========================================
  // 6. CHECKOUT: LÓGICA DE COMISIÓN SEGÚN ROL
  // ==========================================
  // Necesitamos pasar el usuario actual al formulario
  'src/app/corredor/pedidos/page.tsx': `import { prisma } from "@/lib/prisma";
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
}`,

  // 7. COMPONENTE CHECKOUT ACTUALIZADO
  'src/components/orders/OrderFormMobile.tsx': `'use client'
import { useState, useEffect } from "react";
import { createOrder } from "@/actions/orders-actions";
import { Plus, Minus, Search, Save, AlertCircle, Percent } from "lucide-react";

export function OrderFormMobile({ clients, products, currentUser }: { clients: any[], products: any[], currentUser: any }) {
  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- LÓGICA DE COMISIÓN ---
  // Si es ADMIN, empieza en 0 pero es editable.
  // Si es VENDEDOR, empieza en su tasa fija (currentUser.commissionRate) y NO es editable.
  const [feePercent, setFeePercent] = useState(0);

  useEffect(() => {
    if (currentUser?.role === 'CORREDOR') {
      setFeePercent(currentUser.commissionRate || 0);
    }
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'ADMIN';

  // ... (Funciones de carrito iguales) ...
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const addToCart = (p: any) => {
     const exists = cart.find(i => i.id === p.id);
     if(exists) setCart(cart.map(i => i.id === p.id ? {...i, qty: i.qty+1} : i));
     else setCart([...cart, { id: p.id, name: p.name, price: p.priceFinal, qty: 1 }]);
  };
  const updateQty = (id: string, d: number) => setCart(cart.map(i => i.id===id ? {...i, qty: Math.max(0, i.qty+d)} : i).filter(i=>i.qty>0));

  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  
  // CÁLCULO DINÁMICO
  const adminFee = subtotal * (feePercent / 100);
  const total = subtotal + adminFee;

  const handleFinish = async () => {
    if (!clientId || cart.length === 0) return;
    setIsSaving(true);
    const client = clients.find(c => c.id === clientId);
    // Pasamos el porcentaje usado al backend (o el monto calculado)
    // El action deberá actualizarse para recibir feePercent
    await createOrder(clientId, "FINAL", cart.map(i => ({ productId: i.id, quantity: i.qty, adjustmentType: "NONE" })), client?.address || "", feePercent);
  };

  // STEP 1 y 2 (Iguales, resumidos para el script)
  if (step === 1) return (
      <div className="space-y-4">
          <input placeholder="Buscar cliente..." className="w-full p-3 rounded bg-brand-input text-white border border-brand-border" onChange={e=>setSearch(e.target.value)} />
          {clients.filter(c=>(c.firstName+c.lastName).toLowerCase().includes(search.toLowerCase())).map(c=>(
              <div key={c.id} onClick={()=>{setClientId(c.id); setStep(2); setSearch("")}} className="p-4 bg-brand-card border border-brand-border rounded-xl text-white font-bold">{c.firstName} {c.lastName}</div>
          ))}
      </div>
  );

  if (step === 2) return (
      <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
              <button onClick={()=>setStep(1)} className="text-brand-muted font-bold">← Volver</button>
              <button onClick={()=>setStep(3)} className="bg-brand-primary text-brand-dark px-4 py-2 rounded-lg font-bold">Ver Resumen \$\${total.toFixed(0)}</button>
          </div>
          <input placeholder="Buscar producto..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full p-3 rounded bg-brand-input text-white border border-brand-border mb-4" />
          <div className="flex-1 overflow-y-auto space-y-2 pb-20">
              {filteredProducts.map(p => {
                  const item = cart.find(i=>i.id===p.id);
                  return (
                      <div key={p.id} className="bg-brand-card p-4 rounded-xl border border-brand-border flex justify-between items-center">
                          <div><div className="text-white font-bold">{p.name}</div><div className="text-brand-primary">\$\${p.priceFinal}</div></div>
                          {item ? <div className="flex items-center gap-3"><button onClick={()=>updateQty(p.id, -1)} className="p-2 bg-brand-dark rounded text-white"><Minus size={16}/></button><span className="text-white font-bold">{item.qty}</span><button onClick={()=>updateQty(p.id, 1)} className="p-2 bg-brand-dark rounded text-white"><Plus size={16}/></button></div> : <button onClick={()=>addToCart(p)} className="bg-brand-primary text-brand-dark p-2 rounded"><Plus/></button>}
                      </div>
                  )
              })}
          </div>
      </div>
  );

  // STEP 3: RESUMEN CON INPUT DE COMISIÓN INTELIGENTE
  return (
    <div className="space-y-6">
       <button onClick={() => setStep(2)} className="text-brand-muted text-sm font-bold">← Volver a productos</button>
       <h2 className="text-2xl font-bold text-white font-heading">Finalizar Pedido</h2>
       
       <div className="bg-brand-card rounded-xl border border-brand-border p-4 space-y-4">
          <div className="space-y-2 pb-4 border-b border-brand-border">
             {cart.map(item => (
                <div key={item.id} className="flex justify-between text-brand-text text-sm">
                   <span>{item.qty} x {item.name}</span>
                   <span>\$\${(item.qty * item.price).toFixed(2)}</span>
                </div>
             ))}
          </div>
          
          <div className="space-y-3">
              <div className="flex justify-between text-brand-muted text-lg">
                  <span>Subtotal</span>
                  <span>\$\${subtotal.toFixed(2)}</span>
              </div>
              
              {/* INPUT DE COMISIÓN CONDICIONAL */}
              <div className="bg-brand-dark/50 p-3 rounded-lg border border-brand-border">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-brand-accent flex items-center gap-2">
                          <AlertCircle size={14} /> 
                          {isAdmin ? "Comisión Todo Kiosco (Admin)" : "Comisión de Vendedor"}
                      </label>
                      <span className="font-bold text-brand-accent">\$\${adminFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <Percent size={16} className="text-brand-muted" />
                      <input 
                          type="number" 
                          value={feePercent}
                          onChange={(e) => isAdmin && setFeePercent(parseFloat(e.target.value) || 0)}
                          disabled={!isAdmin} // BLOQUEADO PARA CORREDORES
                          className={\`w-full bg-brand-input border border-brand-border rounded px-2 py-1 text-white text-right font-mono \${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'focus:border-brand-primary'}\`}
                      />
                  </div>
                  {!isAdmin && <p className="text-[10px] text-brand-muted mt-1 text-right">Tarifa fija asignada por administración.</p>}
              </div>

              <div className="flex justify-between text-2xl font-bold text-white pt-2 border-t border-brand-border">
                  <span>TOTAL FINAL</span>
                  <span>\$\${total.toFixed(2)}</span>
              </div>
          </div>
       </div>

       <button onClick={handleFinish} disabled={isSaving} className="w-full bg-brand-primary text-brand-dark py-4 rounded-xl font-bold text-lg shadow-neon flex justify-center items-center gap-2">
         {isSaving ? "Guardando..." : <><Save /> Confirmar Pedido</>}
       </button>
    </div>
  );
}`,

  // ==========================================
  // 8. UPDATE BACKEND ORDER ACTION (Recibir feePercent)
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

// Agregamos feePercent como argumento opcional
export async function createOrder(
  customerId: string, 
  priceTier: PriceTier, 
  items: OrderItemInput[],
  shippingAddress: string,
  feePercent: number = 0 // Nuevo parámetro
) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return { error: "No autorizado" };

  let newOrderId = "";

  try {
    await prisma.$transaction(async (tx) => {
      const productIds = items.map(i => i.productId);
      const dbProducts = await tx.product.findMany({ where: { id: { in: productIds } } });

      let subtotalOrder = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product || product.currentStock < item.quantity) throw new Error(\`Stock insuficiente.\`);

        let basePrice = product.priceFinal; // Simplificado
        const subtotal = basePrice * item.quantity;
        subtotalOrder += subtotal;

        await tx.product.update({ where: { id: product.id }, data: { currentStock: { decrement: item.quantity } } });

        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          basePriceTier: priceTier,
          basePrice: basePrice,
          priceAdjustmentType: "NONE",
          priceAdjustmentValue: 0,
          unitPrice: basePrice,
          subtotal: subtotal
        });
      }

      // CÁLCULO DE COMISIÓN USANDO EL PORCENTAJE RECIBIDO
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
          adminFee: adminFee,      // Guardamos valor calculado
          total: totalOrder,
          status: "CONFIRMED",
          items: { create: orderItemsData },
          user: { connect: { id: userId } }
        }
      });
      newOrderId = order.id;
    });

  } catch (error: any) {
    return { error: error.message };
  }

  revalidatePath("/admin/pedidos");
  redirect(\`/admin/pedidos/\${newOrderId}\`);
}`
};

function createFiles() {
  console.log('🚀 Implementando Lógica de COMISIONES (Admin Editable vs Corredor Fijo)...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Creado: ${filePath}`);
  }
}
createFiles();