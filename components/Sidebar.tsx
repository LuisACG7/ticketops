'use client'

import { useState, useEffect } from 'react'
import { logout } from '@/app/login/actions'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  LayoutDashboard, 
  FileText, 
  HelpCircle, 
  LogOut, 
  Menu, 
  X,
  MessageSquare
} from 'lucide-react'

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [lastTicketId, setLastTicketId] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  // Efecto para buscar el ticket más reciente del usuario y usarlo en el botón de Chat
  useEffect(() => {
    async function fetchLastTicket() {
      // Si ya estás dentro de un ticket, memorizamos ese ID para el botón
      if (pathname.includes('/dashboard/tickets/') && !pathname.includes('/nuevo')) {
        const idFromPath = pathname.split('/').pop()
        if (idFromPath) {
          setLastTicketId(idFromPath)
          return
        }
      }

      // Si estás fuera, consultamos a Supabase el último ticket modificado/abierto
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ticket } = await supabase
        .from('tickets')
        .select('id')
        .eq('user_id', user.id) // Cambiar por tu lógica si eres soporte/admin
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (ticket) {
        setLastTicketId(ticket.id)
      }
    }

    fetchLastTicket()
  }, [pathname])

  const handleLogout = async () => {
    await logout()
  }

  // Clases CSS estables para los estados Activo e Inactivo
  const activeClass = "w-full flex items-center gap-3 px-4 py-3 text-sm font-bold bg-blue-50 text-[#0b3b60] rounded-xl transition-all border-l-4 border-[#0b3b60]"
  const inactiveClass = "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl transition-colors"

  // Helper de enrutamiento preciso para tus secciones fijas
  const getLinkClass = (targetPath: string) => {
    if (targetPath === '/dashboard') {
      return pathname === '/dashboard' ? activeClass : inactiveClass
    }
    
    if (targetPath === '/dashboard/tickets/chat') {
      // Se ilumina de azul si estás visualizando cualquier ID de ticket dinámico
      return pathname.includes('/dashboard/tickets/') && !pathname.includes('/nuevo') 
        ? activeClass 
        : inactiveClass
    }

    return pathname.startsWith(targetPath) ? activeClass : inactiveClass
  }

  // Determinar a dónde mandará el botón de chat permanente
  const chatHref = lastTicketId 
    ? `/dashboard/tickets/${lastTicketId}` 
    : '/dashboard' // Si no tiene ningún ticket creado aún, lo regresa a la lista

  return (
    <>
      {/* Botón flotante para abrir el menú en móviles (Hamburguesa) */}
      <button 
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#0f172a] text-white p-2 rounded-xl shadow-md hover:bg-gray-800 transition-all flex items-center justify-center"
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
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-screen
        transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Encabezado: Logo */}
          <div className="p-5 flex items-center justify-between border-b border-gray-100 h-16 bg-white">
            <div className="flex items-center gap-3">
              <div className="bg-[#0f172a] text-white p-2 rounded-xl flex items-center justify-center font-bold text-sm w-9 h-9">
                IT
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Soporte</h2>
                <p className="text-xs text-gray-500 font-medium">Portal del Alumno</p>
              </div>
            </div>
            {/* Botón X para cerrar en móviles */}
            <button 
              type="button"
              className="lg:hidden text-gray-500 hover:text-gray-900 p-1" 
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Menú de Opciones Fijas */}
          <nav className="p-4 space-y-1">
            
            {/* 1. Inicio / Tabla de Control */}
            <Link 
              href="/dashboard" 
              onClick={() => setIsSidebarOpen(false)}
              className={getLinkClass('/dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Inicio</span>
            </Link>

            {/* 2. Crear Nuevo Ticket */}
            <Link 
              href="/dashboard/tickets/nuevo" 
              onClick={() => setIsSidebarOpen(false)}
              className={getLinkClass('/dashboard/tickets/nuevo')}
            >
              <FileText size={18} />
              <span>Nuevo Ticket</span>
            </Link>

            {/* 3. Chat / Mensajes (Fijo y con redirección inteligente al ID) */}
            <Link 
              href={chatHref}
              onClick={() => setIsSidebarOpen(false)}
              className={getLinkClass('/dashboard/tickets/chat')}
            >
              <MessageSquare size={18} />
              <span>Mensajes / Chat</span>
            </Link>

            {/* 4. Preguntas Frecuentes */}
            <Link 
              href="/dashboard/faq" 
              onClick={() => setIsSidebarOpen(false)}
              className={getLinkClass('/dashboard/faq')}
            >
              <HelpCircle size={18} />
              <span>FAQ</span>
            </Link>

          </nav>
        </div>

        {/* Sección Inferior: Cierre de Sesión integrado */}
        <div className="p-4 border-t border-gray-100 bg-white">
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