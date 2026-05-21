import Sidebar from '@/components/Sidebar'
import TicketsTable from '@/components/TicketsTable' // <-- Importamos la nueva tabla
import { createClient } from '@/utils/supabase/server'
import { Plus, Bell } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Obtener la sesión del usuario logueado actualmente
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Traer los tickets reales de la BD
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error cargando los tickets:', error.message)
  }

  const safeTickets = tickets || []

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-gray-900 font-sans relative">
      
      <Sidebar />

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Barra Superior Estática */}
        <header className="bg-white border-b border-gray-200 h-16 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1 pl-12 lg:pl-0">
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Panel de Control</h1>
            
            {/* El espacio del buscador queda libre aquí porque el componente hijo se posicionará de forma absoluta justo encima */}
            <div className="max-w-md w-full h-9 hidden lg:block" />
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            </button>
            
            <Link 
              href="/dashboard/tickets/nuevo" 
              className="flex items-center gap-1.5 bg-[#0f172a] text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-all shadow-sm"
            >
              <Plus size={14} />
              Nuevo Ticket
            </Link>
          </div>
        </header>

        {/* Zona del Dashboard */}
        <main className="p-4 lg:p-8 space-y-6 flex-1 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {/* Llamamos a nuestra tabla interactiva pasándole los tickets obtenidos desde el servidor */}
          <TicketsTable initialTickets={safeTickets} />

        </main>
      </div>
    </div>
  )
}