import { logout } from '@/app/login/actions'
import { LogOut } from 'lucide-react'

export default function AdminDashboard() {
  const handleLogout = async () => {
    'use server'
    await logout()
  }

  return (
    <div className="p-8 space-y-6">
      {/* Cabecera del Panel */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Panel de Control de Soporte Técnico
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Gestión global del sistema de soporte técnico
          </p>
        </div>

        {/* Formulario con el Server Action de Logout */}
        <form action={handleLogout}>
          <button
            type="submit"
            className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs py-2.5 px-4 rounded-xl transition-all border border-red-200/60 shadow-sm"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </form>
      </div>

      {/* Contenido principal del dashboard */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6">
        <p className="text-sm text-gray-600 italic">
          Aquí puedes renderizar las tablas de gestión de profesores, asignación de técnicos y analíticas...
        </p>
      </div>
    </div>
  )
}