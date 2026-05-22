'use client'

import { useState } from 'react'
import { Search, ShieldAlert, Wifi, Laptop, HardDrive, ArrowRight, FileText, PlusCircle, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { FAQItem, FAQCategory } from '@/types/faq'

// Mapeo visual dinámico basado en el category_id de cada FAQ
const getCategoryBadgeDetails = (categoryId: number) => {
  switch (Number(categoryId)) {
    case 4:
      return {
        label: 'Cuentas e Identidad',
        styles: 'bg-blue-50 text-blue-700 border-blue-100'
      }
    case 3:
      return {
        label: 'Conectividad Wi-Fi',
        styles: 'bg-indigo-50 text-indigo-700 border-indigo-100'
      }
    case 1:
      return {
        label: 'Instalación de Software',
        styles: 'bg-purple-50 text-purple-700 border-purple-100'
      }
    case 2:
      return {
        label: 'Equipos de Cómputo',
        styles: 'bg-amber-50 text-amber-700 border-amber-100'
      }
    default:
      return {
        label: 'Soporte General',
        styles: 'bg-slate-50 text-slate-700 border-slate-100'
      }
  }
}

interface FAQKnowledgeBaseProps {
  categories: FAQCategory[]
  faqs: FAQItem[]
}

export default function FAQKnowledgeBase({ categories, faqs }: FAQKnowledgeBaseProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filtrado reactivo por texto de búsqueda en título o contenido
  const filteredFaqs = faqs.filter(faq => 
    faq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full bg-slate-50/50 min-h-screen pb-16 font-sans">
      
      {/* HERO SECTION CON BUSCADOR PRINCIPAL */}
      <div className="bg-[#0b3b60] text-white py-16 px-4 text-center shadow-md relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Hola, ¿cómo podemos ayudarte hoy?
          </h1>
          <p className="text-sm md:text-base text-blue-100 max-w-2xl mx-auto font-medium opacity-90">
            Encuentra guías, tutoriales y soluciones rápidas para los servicios tecnológicos de la universidad.
          </p>

          {/* Barra de búsqueda integrada */}
          <div className="max-w-2xl mx-auto mt-4 relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="¿Cómo podemos ayudarte hoy?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-800 placeholder-gray-400 rounded-xl pl-12 pr-32 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 border-none shadow-lg transition-all"
            />
            <button type="button" className="absolute right-2 top-2 bottom-2 bg-[#0b3b60] hover:bg-opacity-90 text-white text-xs font-bold px-6 rounded-lg transition-all">
              Buscar
            </button>
          </div>

          {/* Búsquedas Populares */}
          <div className="flex items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-blue-200 font-semibold">Búsquedas populares:</span>
            {['Eduroam', 'Cambio NIP', 'VPN'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSearchQuery(tag)}
                className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full font-medium transition-colors border border-white/10"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        {/* Decoración de fondo sutil */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* CUERPO PRINCIPAL: TODOS LOS ARTÍCULOS DE LA BASE DE CONOCIMIENTO */}
      <div className="max-w-6xl mx-auto px-4 mt-12 space-y-8">
        <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">
            {searchQuery ? 'Resultados de la búsqueda' : 'Todos los Artículos de Soporte'}
          </h2>
          {!searchQuery && (
            <span className="text-xs bg-slate-200/70 text-slate-700 px-2.5 py-1 rounded-md font-bold">
              {faqs.length} disponibles
            </span>
          )}
        </div>

        {/* CONTENEDOR UNIFICADO DE FAQS */}
        {filteredFaqs.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-400 text-xs bg-white rounded-2xl border border-gray-200 shadow-sm">
            No se encontraron artículos disponibles que coincidan con los criterios.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map((faq) => {
              const badge = getCategoryBadgeDetails(faq.category_id)

              return (
                <div 
                  key={faq.id} 
                  className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Fila superior: Tag de Categoría */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.styles}`}>
                        {badge.label}
                      </span>
                      <FileText className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </div>

                    {/* Título de la FAQ */}
                    <h3 className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {faq.title}
                    </h3>

                    {/* Breve fragmento del contenido */}
                    <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                      {faq.content}
                    </p>
                  </div>

                  {/* Enlace de Acción */}
                  <div className="pt-4 mt-4 border-t border-gray-100/80 flex justify-end">
                    <Link 
                      href={`/faq/articulo/${faq.id}`}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                    >
                      Leer artículo completo <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SECCIÓN INFERIOR: "¿NO ENCONTRASTE LO QUE BUSCABAS?" */}
        <div className="bg-gray-100/70 rounded-2xl border border-gray-200/60 p-6 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto shadow-inner pt-6 mt-12">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-sm font-extrabold text-gray-900">¿No encontraste lo que buscabas?</h3>
            <p className="text-xs text-gray-500 font-medium max-w-md">
              Nuestro equipo de soporte técnico está disponible para ayudarte a resolver cualquier problema que no esté cubierto en la base de conocimientos.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <Link 
              href="/dashboard/tickets/nuevo" 
              className="flex items-center gap-1.5 bg-[#0b3b60] hover:bg-opacity-90 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm"
            >
              <PlusCircle size={14} /> Crear Nuevo Ticket
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}