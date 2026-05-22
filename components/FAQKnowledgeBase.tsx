'use client'

import { useState } from 'react'
import { Search, ShieldAlert, Wifi, Laptop, HardDrive, ArrowRight, FileText, MessageSquare, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { FAQItem, FAQCategory } from '@/types/faq'

// Mapeo dinámico de íconos según los IDs o nombres de tus categorías reales
const getCategoryIcon = (categoryId: number) => {
  switch (categoryId) {
    case 1: // Supongamos Cuentas e Identidad
      return <ShieldAlert className="w-5 h-5 text-blue-600" />
    case 2: // Conectividad Wi-Fi
      return <Wifi className="w-5 h-5 text-blue-600" />
    case 3: // Instalación de Software
      return <Laptop className="w-5 h-5 text-blue-600" />
    case 4: // Equipos de Cómputo
      return <HardDrive className="w-5 h-5 text-blue-600" />
    default:
      return <FileText className="w-5 h-5 text-blue-600" />
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
            <button className="absolute right-2 top-2 bottom-2 bg-[#0b3b60] hover:bg-opacity-90 text-white text-xs font-bold px-6 rounded-lg transition-all">
              Buscar
            </button>
          </div>

          {/* Búsquedas Populares */}
          <div className="flex items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-blue-200 font-semibold">Búsquedas populares:</span>
            {['Eduroam', 'Cambio NIP', 'VPN'].map((tag) => (
              <button
                key={tag}
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

      {/* CUERPO PRINCIPAL: EXPLORAR POR CATEGORÍAS */}
      <div className="max-w-6xl mx-auto px-4 mt-12 space-y-12">
        <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Explorar por Categorías</h2>
          <Link href="/faq/all" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 transition-all">
            Ver todas <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {searchQuery ? (
          /* VISTA CUANDO EL USUARIO BUSCA ALGO */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-500">Resultados de la búsqueda ({filteredFaqs.length})</h3>
            {filteredFaqs.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">No se encontraron artículos que coincidan con tu búsqueda.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFaqs.map((faq) => (
                  <Link 
                    key={faq.id} 
                    href={`/faq/articulo/${faq.id}`}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 hover:bg-slate-50 transition-all font-medium text-xs text-gray-700"
                  >
                    <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="hover:text-blue-600 transition-colors line-clamp-2">{faq.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* MIGRACIÓN EXACTA DEL DISEÑO EN CUADRÍCULA (4 CATEGORÍAS) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat) => {
              // Filtrar artículos que pertenecen a esta categoría específica
              const categoryFaqs = faqs.filter(faq => faq.category_id === cat.id).slice(0, 3)

              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    {/* Encabezado de Categoría */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 shadow-sm border border-blue-100/50">
                        {getCategoryIcon(Number(cat.id))}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-800">{cat.name}</h3>
                        <p className="text-[11px] text-gray-400 font-medium leading-tight mt-0.5">
                          Gestión, guías de acceso y reportes específicos de la sección.
                        </p>
                      </div>
                    </div>

                    {/* Lista de Artículos */}
                    <div className="space-y-2 pt-2">
                      {categoryFaqs.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic px-1">No hay artículos disponibles todavía.</p>
                      ) : (
                        categoryFaqs.map((faq) => (
                          <Link 
                            key={faq.id} 
                            href={`/faq/articulo/${faq.id}`}
                            className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-[11px] text-gray-600 font-medium transition-all group"
                          >
                            <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5 group-hover:text-blue-500 transition-colors" />
                            <span className="group-hover:text-blue-600 transition-colors line-clamp-1">{faq.title}</span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Footer de la tarjeta de Categoría */}
                  <div className="pt-3 border-t border-gray-100 mt-2">
                    <Link 
                      href={`/faq/categoria/${cat.id}`} 
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                    >
                      Ver todos los artículos...
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SECCIÓN INFERIOR: "¿NO ENCONTRASTE LO QUE BUSCABAS?" */}
        <div className="bg-gray-100/70 rounded-2xl border border-gray-200/60 p-6 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto shadow-inner">
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