/**
 * Lightweight, typed i18n — dictionaries kept inline for Phase 1.
 * Can be swapped for next-intl or i18next once translation volume grows.
 */

export const SUPPORTED_LOCALES = ["ar", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";

export const messages = {
  ar: {
    app: {
      name: "منصة توطين قطاع الطاقة",
      tagline: "ذكاء توطين المحتوى المحلي في قطاع الطاقة السعودي",
    },
    nav: {
      dashboard: "لوحة القيادة",
      products: "المنتجات",
      manufacturers: "المصنعين",
      evidence: "الأدلة والتحقق",
      gaps: "تحليل الفجوات",
      chat: "الشات الذكي",
      admin: "الإدارة",
      audit: "سجل التغييرات",
      logout: "تسجيل الخروج",
    },
    common: {
      search: "بحث",
      filter: "تصفية",
      save: "حفظ",
      cancel: "إلغاء",
      edit: "تعديل",
      delete: "حذف",
      create: "إضافة",
      yes: "نعم",
      no: "لا",
      loading: "جارٍ التحميل…",
      noData: "لا توجد بيانات.",
      signIn: "تسجيل الدخول",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      welcome: "مرحبًا بك",
      soon: "قريبًا",
    },
    dashboard: {
      title: "لوحة القيادة",
      kpi: {
        totalProducts: "إجمالي المنتجات",
        notLocalized: "منتجات غير موطّنة",
        highOpportunities: "فرص ذات أولوية عالية",
        localManufacturers: "مصنعين محليين نشطين",
      },
      topOpportunities: "أعلى فرص التوطين",
    },
    products: {
      title: "المنتجات",
      code: "الرمز",
      nameEn: "الاسم (EN)",
      nameAr: "الاسم (AR)",
      category: "الفئة",
      segment: "القطاع",
      criticality: "الحرجية",
      localized: "حالة التوطين",
      gap: "الفجوة",
      newProduct: "منتج جديد",
    },
    manufacturers: {
      title: "المصنعين",
      name: "الاسم",
      type: "النوع",
      country: "الدولة",
      city: "المدينة",
      capability: "مستوى القدرة",
      verification: "حالة التحقق",
      addLocal: "إضافة مصنع محلي",
      addGlobal: "إضافة مصنع عالمي",
    },
    evidence: {
      title: "الأدلة والتحقق",
      entity: "الكيان",
      claim: "الادعاء",
      source: "المصدر",
      status: "الحالة",
      confidence: "درجة الثقة",
      addEvidence: "إضافة دليل",
    },
    gaps: {
      title: "تحليل الفجوات",
      opportunity: "فرصة",
      level: "مستوى الفجوة",
      recommendation: "التوصية",
    },
    segments: {
      oil_gas: "النفط والغاز",
      power: "الكهرباء",
      renewables: "الطاقة المتجددة",
      cross_sector: "متعدد القطاعات",
    },
    criticality: { high: "عالية", medium: "متوسطة", low: "منخفضة" },
  },
  en: {
    app: { name: "Energy Localization Platform", tagline: "Saudi energy-sector local content intelligence" },
    nav: {
      dashboard: "Dashboard",
      products: "Products",
      manufacturers: "Manufacturers",
      evidence: "Evidence",
      gaps: "Gap Analysis",
      chat: "AI Chat",
      admin: "Admin",
      audit: "Audit log",
      logout: "Sign out",
    },
    common: {
      search: "Search",
      filter: "Filter",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      create: "Create",
      yes: "Yes",
      no: "No",
      loading: "Loading…",
      noData: "No data.",
      signIn: "Sign in",
      email: "Email",
      password: "Password",
      welcome: "Welcome",
      soon: "Coming soon",
    },
    dashboard: {
      title: "Dashboard",
      kpi: {
        totalProducts: "Total products",
        notLocalized: "Non-localized products",
        highOpportunities: "High-priority opportunities",
        localManufacturers: "Active local manufacturers",
      },
      topOpportunities: "Top localization opportunities",
    },
    products: {
      title: "Products",
      code: "Code",
      nameEn: "Name (EN)",
      nameAr: "Name (AR)",
      category: "Category",
      segment: "Segment",
      criticality: "Criticality",
      localized: "Localization",
      gap: "Gap",
      newProduct: "New product",
    },
    manufacturers: {
      title: "Manufacturers",
      name: "Name",
      type: "Type",
      country: "Country",
      city: "City",
      capability: "Capability level",
      verification: "Verification",
      addLocal: "Add local manufacturer",
      addGlobal: "Add global manufacturer",
    },
    evidence: {
      title: "Evidence & verification",
      entity: "Entity",
      claim: "Claim",
      source: "Source",
      status: "Status",
      confidence: "Confidence",
      addEvidence: "Add evidence",
    },
    gaps: { title: "Gap analysis", opportunity: "Opportunity", level: "Gap level", recommendation: "Recommendation" },
    segments: { oil_gas: "Oil & gas", power: "Power", renewables: "Renewables", cross_sector: "Cross-sector" },
    criticality: { high: "High", medium: "Medium", low: "Low" },
  },
} as const;

export type Messages = typeof messages.ar;

export function getMessages(locale: Locale): Messages {
  return (messages[locale] ?? messages[DEFAULT_LOCALE]) as Messages;
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}
