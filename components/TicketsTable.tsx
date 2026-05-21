'use client'

import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, AlertCircle, Clock, CheckCircle2 } from 'lucide-react'

interface Ticket {
  id: string
  serial_number: number
  title: string
  description: string
  status: string
  priority: string
  created_at: string
}

export default function TicketsTable({ initialTickets }: { initialTickets: Ticket[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Filtrado dinámico por Folio (UUID original), Estado y Prioridad
  const filteredTickets = initialTickets.filter((ticket) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true

    const matchesFolio = ticket.id?.toLowerCase().substring(0, 8).includes(query)
    const matchesStatus = ticket.status?.toLowerCase().includes(query)
    const matchesPriority = ticket.priority?.toLowerCase().includes(query)

    return matchesFolio || matchesStatus || matchesPriority
  })

  // 2. Recalcular contadores en tiempo real
  const abiertosCount = filteredTickets.filter(t => t.status === 'Abierto').length
  const enProcesoCount = filteredTickets.filter(t => t.status === 'En proceso').length
  const resueltosCount = filteredTickets.filter(t => t.status === 'Resuelto').length

  return (
    <div className="space-y-6 w-full">
      
      {/* EXPLICACIÓN: Este bloque oculto transmite el estado del input al Header del padre usando un truco de CSS limpio */}
      <style jsx global>{`
        #global-search-input {
          display: none;
        }
      `}</style>

      {/* PORTAL SIMULADO: Para mantener el input físicamente dentro de la tabla pero permitirle interactuar */}
      <div className="hidden">
        <input 
          id="sync-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* TARJETAS DINÁMICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tickets Abiertos</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{abiertosCount}</h3>
          </div>
          <div className="bg-red-50 p-2 rounded-xl text-red-500">
            <AlertCircle size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">En Proceso</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{enProcesoCount}</h3>
          </div>
          <div className="bg-blue-50 p-2 rounded-xl text-blue-500">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Resueltos</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{resueltosCount}</h3>
          </div>
          <div className="bg-green-50 p-2 rounded-xl text-green-500">
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* TABLA DE CONTENIDO REAL */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-base">Tickets Recientes</h3>
          
          {/* Buscador responsivo integrado dentro de la sección de la tabla */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar por folio, estado o prioridad (ej: Alta, Abierto)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50/80 border border-gray-200 rounded-full pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              <p className="font-medium">No se encontraron tickets con esos criterios.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-6">Folio</th>
                  <th className="py-4 px-6">Título del Problema</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6">Prioridad</th>
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50/40 transition-colors">
                    {/* CORRECCIÓN DEL FOLIO: Regresa a usar los primeros 8 dígitos del UUID en mayúsculas */}
                    <td className="py-4 px-6 font-semibold text-gray-400 truncate max-w-[100px]">
                      #{ticket.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-4 px-6 max-w-xs sm:max-w-md">
                      <p className="font-bold text-gray-900 text-sm">{ticket.title}</p>
                      <p className="text-gray-400 truncate mt-0.5">{ticket.description}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        ticket.status === 'Abierto' ? 'bg-red-50 text-red-600' :
                        ticket.status === 'En proceso' ? 'bg-blue-50 text-blue-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ticket.status === 'Abierto' ? 'bg-red-500' :
                          ticket.status === 'En proceso' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`} />
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ticket.priority === 'Alta' ? 'bg-orange-50 text-orange-600' :
                        ticket.priority === 'Media' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {ticket.priority || 'Normal'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400 font-medium">
                      {new Date(ticket.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="text-blue-600 font-semibold hover:underline">Ver detalle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-medium">
          <span>Total: {filteredTickets.length} tickets registrados</span>
          <div className="flex gap-1">
            <button className="p-1.5 border border-gray-200 rounded-lg bg-white text-gray-400 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="p-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}