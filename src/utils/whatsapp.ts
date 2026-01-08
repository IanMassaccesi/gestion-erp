
export function getWhatsAppLink(phone: string | null | undefined, message: string) {
  if (!phone) return "#";
  
  // Limpieza básica de número (Argentina)
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone.startsWith('54')) cleanPhone = '54' + cleanPhone; // Asumimos AR por defecto
  
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
