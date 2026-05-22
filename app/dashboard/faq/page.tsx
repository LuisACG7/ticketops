import { createClient } from '@/utils/supabase/server'
import FAQKnowledgeBase from '@/components/FAQKnowledgeBase'
import Sidebar from '@/components/Sidebar' // 
import { FAQCategory, FAQItem } from '@/types/faq'

// Forzar renderizado dinámico para traer cambios inmediatos de la BD
export const revalidate = 0

export default async function FAQPage() {
  const supabase = await createClient()

  // 1. Obtener todas las categorías para mapear los bloques
  const { data: categoriesData, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('id', { ascending: true })

  // 2. Obtener los artículos de soporte de la tabla faqs
  const { data: faqsData, error: faqError } = await supabase
    .from('faqs')
    .select('id, category_id, title, content, created_by, created_at')
    .order('created_at', { ascending: false })

  if (catError || faqError) {
    console.error('Error al cargar datos de FAQ de Supabase:', { catError, faqError })
  }

  // Garantizar arreglos vacíos bien tipados si los datos vienen nulos (evita fallos en render)
  const categories: FAQCategory[] = categoriesData || []
  const faqs: FAQItem[] = faqsData || []

  return (
    <div className="flex min-h-screen bg-slate-50/50 w-full">
      {/* SIDEBAR FIJO A LA IZQUIERDA */}
      <Sidebar />

      {/* CONTENEDOR FLEXIBLE PARA LA INTERFAZ DE FAQ */}
      <main className="flex-1 overflow-y-auto">
        <FAQKnowledgeBase categories={categories} faqs={faqs} />
      </main>
    </div>
  )
}