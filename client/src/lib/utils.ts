import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function getDaysUntilDeadline(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const diffTime = d.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} dias em atraso`;
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Amanhã";
  return `Em ${diffDays} dias`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDocument(doc: string): string {
  const cleanDoc = doc.replace(/\D/g, "");
  if (cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  } else if (cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return doc;
}

export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, "");
  if (cleanCEP.length === 8) {
    return cleanCEP.replace(/(\d{5})(\d{3})/, "$1-$2");
  }
  return cep;
}

export function generateProtocol(): string {
  const timestamp = Date.now();
  return `FAR${timestamp}`;
}

export function calculateTileArea(length: number, width: number, quantity: number): number {
  const grossArea = length * width * quantity;
  const correctedArea = grossArea * 0.88; // 12% overlap correction
  return correctedArea;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDocument(doc: string): string {
  const cleanDoc = doc.replace(/\D/g, "");
  if (cleanDoc.length === 14) {
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  } else if (cleanDoc.length === 11) {
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return doc;
}

export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, "");
  if (cleanCEP.length === 8) {
    return cleanCEP.replace(/(\d{5})(\d{3})/, "$1-$2");
  }
  return cep;
}

export function generateProtocol(): string {
  const timestamp = Date.now();
  return `FAR${timestamp}`;
}

export function calculateTileArea(length: number, width: number, quantity: number): number {
  const grossArea = length * width * quantity;
  const correctedArea = grossArea * 0.88; // 12% overlap correction
  return correctedArea;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}