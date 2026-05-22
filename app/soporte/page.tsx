import { createClient } from '@/utils/supabase/server'
import { Ticket, Clock, CheckCircle, AlertTriangle, MessageSquare, ArrowRight, UserCheck } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// 1. Definición de interfaces para evitar el uso de 'any'
interface ProfileRelation {
  name: string | null
  email: string | null
}

interface CategoryRelation {
  name: string | null
}

interface TicketType {
  id: string
  serial_number: number
  title: string
  status: string
  priority: string
  location: string | null
  created_at: string
  profiles: ProfileRelation | null
  categories: CategoryRelation | null
}

export default async function SoporteDashboard() {
  const supabase = await createClient()

  // Obtener los últimos tickets con información de quién reporta y su categoría
  // Forzamos el tipado correcto de la respuesta usando 'as unknown as TicketType[]' si la inferencia de Supabase no es exacta
  const { data: ticketsData, error } = await supabase
    .from('tickets')
    .select(`
      id,
      serial_number,
      title,
      status,
      priority,
      location,
      created_at,
      profiles!tickets_user_id_fkey ( name, email ),
      categories ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error cargando tickets en soporte:', error.message)
  }

  // Mapeamos los datos asegurando que cumplan con la interfaz estricta
  const tickets: TicketType[] = (ticketsData as unknown as TicketType[]) || []

  // 2. Calcular contadores analíticos dinámicamente
  const totalTickets = tickets.length
  const abiertos = tickets.filter(t => t.status === 'Abierto').length
  const enProceso = tickets.filter(t => t.status === 'En proceso').length
  const resueltos = tickets.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado').length

  // Mapeos visuales para los badges de prioridad y estado
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'Crítica': return 'bg-red-50 text-red-700 border-red-200'
      case 'Alta': return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'Media': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Abierto': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'En proceso': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'Resuelto': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex items-center justify-between border-b border-gray-200/70 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Panel de Control de Soporte Técnico
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Revisión, asignación y seguimiento de incidencias tecnológicas en el campus.
          </p>
        </div>
        <div className="text-right text-xs text-gray-400 font-bold">
          Centro de Cómputo • IT Celaya
        </div>
      </div>

      {/* SECCIÓN DE TARJETAS ANALÍTICAS (METRICAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Total Recibidos</p>
            <p className="text-2xl font-black text-gray-800">{totalTickets}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
            <Ticket size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-blue-500 tracking-wider uppercase">Por Atender</p>
            <p className="text-2xl font-black text-blue-600">{abiertos}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100/60">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-indigo-500 tracking-wider uppercase">En Diagnóstico</p>
            <p className="text-2xl font-black text-indigo-600">{enProceso}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100/60">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-emerald-500 tracking-wider uppercase">Solucionados</p>
            <p className="text-2xl font-black text-emerald-600">{resueltos}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100/60">
            <CheckCircle size={18} />
          </div>
        </div>
      </div>

      {/* TABLA PRINCIPAL: MONITOREO DE INCIDENCIAS GLOBALES */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-black text-gray-800 tracking-wider uppercase">
            Bandeja de Entrada de Incidencias Recientes
          </h3>
          <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
            Actualizado en tiempo real
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-20">Folio</th>
                <th className="py-3 px-4">Incidencia</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Solicitante</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 italic font-medium">
                    No hay ningún ticket registrado en la plataforma actualmente.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/70 transition-colors font-medium text-gray-700">
                    {/* Folio Numérico */}
                    <td className="py-3.5 px-4 font-bold text-gray-400">
                      #{ticket.serial_number}
                    </td>

                    {/* Detalle de Incidencia */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-gray-900 truncate">{ticket.title}</div>
                      <div className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">
                        📍 {ticket.location || 'Reporte Remoto'}
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="py-3.5 px-4 text-gray-500 font-semibold">
                      {ticket.categories?.name || 'General'}
                    </td>

                    {/* Perfil del Alumno/Docente */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-800">{ticket.profiles?.name || 'Sin nombre'}</div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                        {ticket.profiles?.email || 'Sin correo'}
                      </div>
                    </td>

                    {/* Prioridad */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityStyle(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>

                    {/* Estado de Gestión */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Enlace para chatear o resolver */}
                        <Link
                          href={`/soporte/tickets/${ticket.id}`}
                          className="flex items-center gap-1 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-[10px] py-1.5 px-2.5 rounded-lg border border-blue-100 transition-all shadow-sm"
                        >
                          Atender <ArrowRight size={10} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}