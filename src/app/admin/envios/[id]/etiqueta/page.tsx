import { prisma } from "@/lib/prisma";
import { ShippingLabel } from "@/components/shipping/ShippingLabel";
import { notFound } from "next/navigation";

export default async function EtiquetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { order: { include: { customer: true } } }
  });

  if (!shipment) return notFound();

  return <ShippingLabel shipment={shipment} />;
}