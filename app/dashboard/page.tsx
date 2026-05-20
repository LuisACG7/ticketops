import { logout } from '../login/actions'
import { LogOut, Ticket } from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Barra de Navegación Superior Estilo Navbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#111827] text-white p-2 rounded-lg">
            <Ticket size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Portal de Tickets</h1>
            <p className="text-xs text-gray-500">Instituto Tecnológico de Celaya</p>
          </div>
        </div>

        {/* Formulario que activa el Server Action del Logout */}
        <form action={logout}>
          <button 
            type="submit"
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all border border-red-100"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </form>
      </header>

      {/* Contenido Principal */}
      <main className="p-8 max-w-7xl mx-auto w-full flex-grow">
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel de Clientes/Alumnos</h2>
          <p className="text-gray-500 text-sm">
            Bienvenido al sistema. Aquí podrás consultar el estado de tus incidencias y levantar nuevos reportes.
          </p>
          
          {/* Espacio reservado para tu futura lista de tickets de la base de datos */}
          <div className="mt-8 border-2 border-dashed border-gray-200 rounded-xl h-64 flex items-center justify-center text-gray-400 text-sm">
            Próximamente: Lista de tus tickets activos...
          </div>
        </div>
      </main>
    </div>
  )
}