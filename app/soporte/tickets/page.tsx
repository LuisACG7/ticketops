'use client'

import { useState, useEffect } from 'react'
import { obtenerTecnicosDisponibles, obtenerTicketsConDetalles, asignarTecnicoATicket } from './actions'
import { Loader2, AlertCircle, Check, Calendar, User, ShieldCheck } from 'lucide-react'

// Interfaces internas para el manejo de estado en la UI del Cliente
interface PerfilBasico {
  id: string
  name: string
  email: string
}

interface TicketData {
  id: string
  serial_number: number
  title: string
  status: 'Abierto' | 'En proceso' | 'Resuelto' | 'Cerrado'
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  updated_at: string
  user: PerfilBasico | null
  technician: PerfilBasico | null
}

interface Tecnico {
  id: string
  name: string
  email: string
  role: 'Soporte' | 'Admin' | 'Usuario'
}

// Interfaces de la estructura cruda que retorna Supabase en los Joins (Evita usar 'any')
interface SupabasePerfilRaw {
  id: string
  name?: string | null
  full_name?: string | null
  email?: string | null
}

interface SupabaseTicketRaw {
  id: string
  serial_number: number
  title: string
  status: 'Abierto' | 'En proceso' | 'Resuelto' | 'Cerrado'
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  updated_at: string
  user: SupabasePerfilRaw | null
  technician: SupabasePerfilRaw | null
}

export default function DashboardTicketsPage() {
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [ticketSeleccionado, setTicketSeleccionado] = useState<string | null>(null)
  
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingPagina, setLoadingPagina] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Carga inicial desde las Server Actions
  useEffect(() => {
    async function sincronizarServidor() {
      try {
        const [listaTickets, listaTecnicos] = await Promise.all([
          obtenerTicketsConDetalles(),
          obtenerTecnicosDisponibles()
        ])
        
        // Mapeo seguro utilizando tipos explícitos de la respuesta relacional de Supabase
        const ticketsMapeados: TicketData[] = ((listaTickets as unknown as SupabaseTicketRaw[]) || []).map((ticket) => ({
          id: ticket.id,
          serial_number: ticket.serial_number,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          updated_at: ticket.updated_at,
          user: ticket.user ? {
            id: ticket.user.id,
            name: ticket.user.name || ticket.user.full_name || 'Usuario',
            email: ticket.user.email || ''
          } : null,
          technician: ticket.technician ? {
            id: ticket.technician.id,
            name: ticket.technician.name || ticket.technician.full_name || 'Técnico',
            email: ticket.technician.email || ''
          } : null
        }))

        setTickets(ticketsMapeados)
        setTecnicos(listaTecnicos as Tecnico[])
      } catch (err) {
        setError('No se pudo establecer conexión con las tablas de Supabase.')
      } finally {
        setLoadingPagina(false)
      }
    }
    sincronizarServidor()
  }, [])

  const handleAsignar = async (ticketId: string, techId: string) => {
    if (!techId) return
    setLoadingId(ticketId)
    setError(null)
    setSuccess(null)

    try {
      // Forzamos el tipado a la interfaz de Supabase en lugar de 'any'
      const respuestaServer = await asignarTecnicoATicket(ticketId, techId) as unknown as SupabaseTicketRaw
      
      const ticketActualizado: TicketData = {
        id: respuestaServer.id,
        serial_number: respuestaServer.serial_number,
        title: respuestaServer.title,
        status: respuestaServer.status,
        priority: respuestaServer.priority,
        updated_at: respuestaServer.updated_at,
        user: respuestaServer.user ? {
          id: respuestaServer.user.id,
          name: respuestaServer.user.name || respuestaServer.user.full_name || 'Usuario',
          email: respuestaServer.user.email || ''
        } : null,
        technician: respuestaServer.technician ? {
          id: respuestaServer.technician.id,
          name: respuestaServer.technician.name || respuestaServer.technician.full_name || 'Técnico',
          email: respuestaServer.technician.email || ''
        } : null
      }
      
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? ticketActualizado : t))
      )
      
      setSuccess(`¡Ticket #${ticketActualizado.serial_number} asignado correctamente en la base de datos!`)
      setTicketSeleccionado(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la actualización.')
    } finally {
      setLoadingId(null)
    }
  }

  const formatearFecha = (isoString: string) => {
    if (!isoString) return 'Sin fecha'
    const fecha = new Date(isoString)
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loadingPagina) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-xs font-bold text-gray-500">Sincronizando incidencias con Supabase...</p>
      </div>
    )
  }

  return (
    <div className="w-full p-2 sm:p-6 space-y-6 bg-slate-50 min-h-screen">
      
      {/* HEADER DE LA SECCIÓN */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Consola de Incidencias</h1>
        <p className="text-xs text-gray-500 font-semibold mt-0.5">Asignación directa de técnicos y control de estados de reparación.</p>
      </div>

      {/* FEEDBACK DE ACCIONES */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
          <Check size={16} className="text-emerald-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* TABLA OPTIMIZADA */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <th className="p-4 w-16">Folio</th>
                <th className="p-4">Título de Incidencia</th>
                <th className="p-4">Usuario Reporta</th>
                <th className="p-4">Técnico Asignado</th>
                <th className="p-4">Prioridad</th>
                <th className="p-4">Última Actualización</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                  
                  {/* Folio */}
                  <td className="p-4 font-mono font-bold text-blue-600">
                    #{ticket.serial_number}
                  </td>

                  {/* Título de la Incidencia */}
                  <td className="p-4 max-w-xs">
                    <div className="font-bold text-gray-900 line-clamp-1">{ticket.title}</div>
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md font-bold ${
                        ticket.status === 'Abierto' ? 'bg-blue-50 text-blue-700' :
                        ticket.status === 'En proceso' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </td>

                  {/* Usuario que Reportó */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-gray-600 shrink-0">
                        <User size={12} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{ticket.user?.name || 'Desconocido'}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{ticket.user?.email || '-'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Técnico Asignado */}
                  <td className="p-4">
                    {ticket.technician ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                          <ShieldCheck size={12} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{ticket.technician.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">Soporte asignado</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 font-semibold italic text-[11px]">Sin asignar todavía</span>
                    )}
                  </td>

                  {/* Prioridad */}
                  <td className="p-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-lg font-black border ${
                      ticket.priority === 'Crítica' ? 'bg-red-50 text-red-700 border-red-100' :
                      ticket.priority === 'Alta' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      ticket.priority === 'Media' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>

                  {/* Última Actualización */}
                  <td className="p-4 text-gray-500">
                    <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                      <Calendar size={12} className="text-gray-400" />
                      {formatearFecha(ticket.updated_at)}
                    </div>
                  </td>

                  {/* Columna Acciones */}
                  <td className="p-4 text-right relative">
                    {ticketSeleccionado === ticket.id ? (
                      <div className="inline-flex items-center gap-1 bg-white border border-gray-300 rounded-xl p-1 shadow-md z-20 animate-in fade-in zoom-in-95 duration-150">
                        <select
                          defaultValue=""
                          disabled={loadingId === ticket.id}
                          onChange={(e) => handleAsignar(ticket.id, e.target.value)}
                          className="bg-transparent border-none text-[11px] font-bold text-gray-700 focus:outline-none focus:ring-0 pr-6 pl-2 py-1 cursor-pointer"
                        >
                          <option value="" disabled>Selecciona Técnico...</option>
                          {tecnicos.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                        <button 
                          type="button"
                          onClick={() => setTicketSeleccionado(null)}
                          className="p-1 text-gray-400 hover:text-gray-600 font-bold text-[10px] px-1.5 border-l border-gray-200"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={loadingId === ticket.id}
                        onClick={() => setTicketSeleccionado(ticket.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-xl transition-all"
                      >
                        {loadingId === ticket.id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" /> Actualizando...
                          </>
                        ) : ticket.technician ? (
                          <>Reasignar Técnico</>
                        ) : (
                          <>Asignar Técnico</>
                        )}
                      </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}