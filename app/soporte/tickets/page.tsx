'use client'

import { useState, useEffect } from 'react'
import { obtenerTecnicosDisponibles, asignarTecnicoATicket } from './actions'
import { 
  Wrench, Shield, Users, Ticket, CheckSquare, 
  Settings, LogOut, ChevronRight, UserPlus, 
  Loader2, AlertCircle, Check, MapPin, Tag
} from 'lucide-react'
import Link from 'next/link'

// Tipados estrictos para evitar fallos de TypeScript / ESLint
interface Tecnico {
  id: string
  name: string
  email: string
  role: 'Soporte' | 'Admin' | 'Usuario'
}

interface TicketData {
  id: string
  serial_number: number
  title: string
  status: 'Abierto' | 'En proceso' | 'Resuelto' | 'Cerrado'
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica'
  location: string | null
  technician_id: string | null
}

export default function DashboardTicketsPage() {
  // Datos simulados iniciales basados en tus Inserts SQL
  const [tickets, setTickets] = useState<TicketData[]>([
    {
      id: '27a1754b-d776-42fe-8cf1-994f99115bf4',
      serial_number: 1024,
      title: 'Licencia de software expirada en Adobe Creative Cloud',
      status: 'Abierto',
      priority: 'Media',
      location: 'Laboratorio de Cómputo B',
      technician_id: null
    },
    {
      id: '8a91254c-e887-43fe-9cf2-114f99225ca1',
      serial_number: 1025,
      title: 'Cuenta institucional bloqueada por intentos fallidos',
      status: 'En proceso',
      priority: 'Alta',
      location: 'Remoto / Plataforma Web',
      technician_id: null
    }
  ])

  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [ticketSeleccionado, setTicketSeleccionado] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Cargar técnicos disponibles al montar el componente
  useEffect(() => {
    async function cargarDatos() {
      const lista = await obtenerTecnicosDisponibles()
      setTecnicos(lista)
    }
    cargarDatos()
  }, [])

  const handleAsignar = async (ticketId: string, techId: string) => {
    if (!techId) return
    setLoadingId(ticketId)
    setError(null)
    setSuccess(null)

    try {
      await asignarTecnicoATicket(ticketId, techId)
      
      // Actualizar estado local si Supabase responde de manera exitosa
      setTickets(prev => prev.map(t => t.id === ticketId ? { 
        ...t, 
        technician_id: techId, 
        status: 'En proceso' 
      } : t))
      
      setSuccess('¡Técnico asignado correctamente al reporte!')
      setTicketSeleccionado(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cambios.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* SIDEBAR COMPLETO */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="p-6 space-y-7">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Wrench size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-gray-900">IT Celaya</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Centro de Cómputo</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 mb-2">Módulos</p>
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-500 rounded-xl hover:bg-slate-50 hover:text-gray-900 transition-all">
              <CheckSquare size={16} /> Panel de Control
            </Link>
            <Link href="/soporte/tickets" className="flex items-center gap-3 px-3 py-2.5 text-xs font-black bg-blue-50/70 text-blue-700 rounded-xl transition-all">
              <Ticket size={16} /> Gestión de Tickets
            </Link>
            <Link href="/soporte/tecnicos" className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-500 rounded-xl hover:bg-slate-50 hover:text-gray-900 transition-all">
              <Users size={16} /> Personal Técnico
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 border border-slate-200">LA</div>
            <div>
              <p className="text-xs font-bold text-gray-800">Luis Angel</p>
              <p className="text-[10px] text-gray-400 font-medium">Administrador de TI</p>
            </div>
          </div>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CUERPO PRINCIPAL DEL DASHBOARD */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 overflow-x-hidden">
        
        {/* ENCABEZADO */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Consola de Incidencias</h1>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Asigna personal de soporte y monitorea las fallas del campus.</p>
          </div>
        </div>

        {/* NOTIFICACIONES FLOTANTES DE ESTADO */}
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

        {/* TABLA DE REPORTES */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="p-4 w-20">Folio</th>
                  <th className="p-4 max-w-sm">Detalles del Reporte</th>
                  <th className="p-4">Ubicación</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Asignar Técnico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-medium">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Folio */}
                    <td className="p-4 font-mono font-bold text-blue-600">
                      #{ticket.serial_number}
                    </td>

                    {/* Título */}
                    <td className="p-4 max-w-sm space-y-1">
                      <div className="font-bold text-gray-900 line-clamp-1">{ticket.title}</div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold border ${
                          ticket.priority === 'Crítica' ? 'bg-red-50 text-red-700 border-red-100' :
                          ticket.priority === 'Alta' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          Prioridad {ticket.priority}
                        </span>
                      </div>
                    </td>

                    {/* Ubicación */}
                    <td className="p-4 text-gray-500">
                      <div className="flex items-center gap-1 text-[11px] font-semibold">
                        <MapPin size={12} className="text-gray-400" />
                        {ticket.location || 'No especificada'}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold ${
                        ticket.status === 'Abierto' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/10' :
                        ticket.status === 'En proceso' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/10' :
                        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ticket.status === 'Abierto' ? 'bg-blue-500' :
                          ticket.status === 'En proceso' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        {ticket.status}
                      </span>
                    </td>

                    {/* Acción Interactiva In-situ */}
                    <td className="p-4 text-right relative">
                      {ticketSeleccionado === ticket.id ? (
                        <div className="inline-flex items-center gap-1 bg-white border border-gray-300 rounded-xl p-1 shadow-md z-10 animate-in fade-in zoom-in-95 duration-150">
                          <select
                            defaultValue=""
                            disabled={loadingId === ticket.id}
                            onChange={(e) => handleAsignar(ticket.id, e.target.value)}
                            className="bg-transparent border-none text-[11px] font-bold text-gray-700 focus:outline-none focus:ring-0 pr-6 pl-2 py-1 cursor-pointer"
                          >
                            <option value="" disabled>Selecciona Técnico...</option>
                            {tecnicos.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ({t.role})
                              </option>
                            ))}
                          </select>
                          <button 
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
                              <Loader2 size={12} className="animate-spin" /> Guardando...
                            </>
                          ) : ticket.technician_id ? (
                            <>
                              <Check size={12} className="text-emerald-600" /> Reasignar Personal
                            </>
                          ) : (
                            <>
                              <UserPlus size={12} /> Asignar Técnico
                            </>
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

      </main>
    </div>
  )
}