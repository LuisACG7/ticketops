export interface FAQCategory {
  id: number;
  name: string;
  slug: string;
  icon?: string; // Por si guardas nombres de lucide-react en base de datos
  [key: string]: unknown; // Tolerancia estricta sin usar 'any'
}

export interface FAQItem {
  id: number;
  category_id: number;
  title: string;
  content: string;
  created_by: string | null;
  created_at: string;
  [key: string]: unknown; // Evita errores de indexación de Supabase
}

export interface FAQWithCategory extends FAQItem {
  categories?: {
    id: number;
    name: string;
  } | null;
}