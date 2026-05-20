'use client'

import { useState } from 'react'
import { logout } from '@/app/login/actions'
import { 
  LayoutDashboard, 
  FileText, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react'

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {/* Botón flotante para abrir el menú en móviles (Hamburguesa) */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#0f172a] text-white p-2 rounded-xl shadow-md hover:bg-gray-800 transition-all"
        onClick={() => setIsSidebarOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Overlay translúcido para móviles cuando el sidebar está abierto */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Contenedor del Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col justify-between
        transition-transform duration-300 lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Encabezado: Logo */}
          <div className="p-5 flex items-center justify-between border-b border-gray-100 h-16">
            <div className="flex items-center gap-3">
              <div className="bg-[#0f172a] text-white p-2 rounded-xl flex items-center justify-center font-bold text-sm w-9 h-9">
                IT
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Soporte</h2>
                <p className="text-xs text-gray-500">Portal del Alumno</p>
              </div>
            </div>
            {/* Botón X para cerrar en móviles */}
            <button className="lg:hidden text-gray-500 hover:text-gray-900" onClick={() => setIsSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Menú de Opciones */}
          <nav className="p-4 space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium bg-blue-50/70 text-blue-600 rounded-xl transition-colors">
              <LayoutDashboard size={18} />
              Inicio
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <FileText size={18} />
              Mis Tickets
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors">
              <HelpCircle size={18} />
              FAQ
            </button>
          </nav>
        </div>

        {/* Sección Inferior: Cierre de Sesión integrado */}
        <div className="p-4 border-t border-gray-100">
          <form onSubmit={(e) => { e.preventDefault(); handleLogout(); }}>
            <button 
              type="submit" 
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}