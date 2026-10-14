export const SITE_CONFIG = {
  name: import.meta.env.VITE_SITE_NAME || "Haven Property Co.",
  url: (import.meta.env.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173")).replace(/\/$/, ""),
  phone: import.meta.env.VITE_COMPANY_PHONE || "",
  email: import.meta.env.VITE_COMPANY_EMAIL || "",
  whatsapp: import.meta.env.VITE_COMPANY_WHATSAPP || "",
  cities: (import.meta.env.VITE_CITIES || "Mumbai,Pune,Bengaluru,Alibaug")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export function toTel(value) {
  return String(value || "").replace(/[^+\d]/g, "");
}

export function toWhatsApp(value) {
  return String(value || "").replace(/\D/g, "");
}
