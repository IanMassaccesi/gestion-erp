const fs = require('fs');
const path = require('path');

const files = {
  'src/app/admin/clientes/[id]/page.tsx': `import { prisma } from "@/lib/prisma";
import { updateClient } from "@/actions/clients-actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const client = await prisma.customer.findUnique({ where: { id } });

  if (!client) return <div className="text-white p-4">Cliente no encontrado</div>;

  const updateClientWithId = updateClient.bind(null, id);

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/clientes" className="p-2 hover:bg-brand-card rounded-full text-brand-muted"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold font-heading text-white">Editar Cliente</h1>
      </div>

      <form action={updateClientWithId} className="bg-brand-card p-8 rounded-xl shadow-lg border border-brand-border space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-brand-muted block mb-1">Nombre</label>
            <input name="firstName" defaultValue={client.firstName} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" />
          </div>
          <div>
            <label className="text-sm font-bold text-brand-muted block mb-1">Apellido</label>
            <input name="lastName" defaultValue={client.lastName} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" />
          </div>
        </div>
        
        <div>
            <label className="text-sm font-bold text-brand-muted block mb-1">DNI / CUIT</label>
            <input name="dniCuit" defaultValue={client.dniCuit} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" />
        </div>
        
        <div>
            <label className="text-sm font-bold text-brand-muted block mb-1">Dirección</label>
            <input name="address" defaultValue={client.address} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" />
        </div>

        {/* CORRECCIÓN: Usamos || "" para evitar errores de NULL en TypeScript */}
        <div>
            <label className="text-sm font-bold text-brand-muted block mb-1">Ciudad / Localidad</label>
            <input name="city" defaultValue={client.city || ""} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" />
        </div>

        <div>
            <label className="text-sm font-bold text-brand-muted block mb-1">Teléfono</label>
            <input name="phone" defaultValue={client.phone || ""} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" />
        </div>

        <div>
            <label className="text-sm font-bold text-brand-muted block mb-1">Email (Opcional)</label>
            <input name="email" defaultValue={client.email || ""} className="w-full p-3 bg-brand-input border border-brand-border rounded-lg text-white" />
        </div>

        <button type="submit" className="w-full bg-brand-primary text-brand-dark py-3 rounded-lg font-bold flex justify-center gap-2">
            <Save size={20} /> Guardar Cambios
        </button>
      </form>
    </div>
  );
}`
};

function createFiles() {
  console.log('🚀 Corrigiendo Errores de TypeScript en Edición de Clientes...');
  for (const [filePath, content] of Object.entries(files)) {
    const absolutePath = path.join(process.cwd(), filePath);
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(absolutePath, content);
    console.log(`✅ Corregido: ${filePath}`);
  }
}
createFiles();