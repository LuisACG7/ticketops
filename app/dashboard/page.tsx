import Sidebar from '@/components/Sidebar'
import { createClient } from '@/utils/supabase/server'
import { 
  Plus, 
  Search, 
  Bell,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Obtener la sesión del usuario logueado actualmente
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Traer los tickets reales filtrados EXCLUSIVAMENTE por el ID del usuario actual
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user?.id) // Trae solo los tickets del alumno logueado
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error cargando los tickets:', error.message)
  }

  // 3. Agrupadores o contadores rápidos basados en tus datos reales
  const abiertosCount = tickets?.filter(t => t.status === 'Abierto').length || 0
  const enProcesoCount = tickets?.filter(t => t.status === 'En Proceso').length || 0
  const resueltosCount = tickets?.filter(t => t.status === 'Resuelto').length || 0

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-gray-900 font-sans">
      
      {/* Importamos el Sidebar Limpio que creamos aparte */}
      <Sidebar />

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Barra Superior Estática */}
        <header className="bg-white border-b border-gray-200 h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1 pl-12 lg:pl-0">
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Panel de Control</h1>
            
            {/* Buscador */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Buscar ticket o folio..."
                className="w-full bg-gray-50/80 border border-gray-200 rounded-full pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            </button>
            
            <button className="flex items-center gap-1.5 bg-[#0f172a] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-all shadow-sm">
              <Plus size={14} />
              Nuevo Ticket
            </button>
          </div>
        </header>

        {/* Zona del Dashboard */}
        <main className="p-4 lg:p-8 space-y-6 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* TARJETAS DINÁMICAS (Contadas directamente de tu BD) */}
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
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Tickets Recientes</h3>
            </div>

            <div className="overflow-x-auto">
              {(!tickets || tickets.length === 0) ? (
                /* Estado vacío si el alumno no ha levantado incidencias */
                <div className="p-12 text-center text-gray-400 text-sm">
                  <p className="font-medium">No has registrado ningún ticket todavía.</p>
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
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50/40 transition-colors">
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
                            ticket.status === 'En Proceso' ? 'bg-blue-50 text-blue-600' :
                            'bg-green-50 text-green-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              ticket.status === 'Abierto' ? 'bg-red-500' :
                              ticket.status === 'En Proceso' ? 'bg-blue-500' :
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
              <span>Total: {tickets?.length || 0} tickets registrados</span>
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
        </main>
      </div>
    </div>
  )
}