'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { LayoutDashboard, Ticket, MessageSquare, User, LogOut, ShieldCheck } from 'lucide-react'
import { logout } from '@/app/login/actions'

export default function SidebarSoporte() {
  const pathname = usePathname()
  const params = useParams()
  
  // Extraemos el id del ticket si el usuario se encuentra actualmente dentro de la ruta [id]
  const currentTicketId = params?.id as string | undefined

  // Determinamos la ruta del chat: si está dentro de un ticket, se queda ahí; si no, va a la lista a elegir uno
  const chatHref = currentTicketId 
    ? `/soporte/tickets/${currentTicketId}` 
    : '/soporte/tickets?select_ticket_to_chat=true'

  const menuItems = [
    { name: 'Dashboard', href: '/soporte', icon: LayoutDashboard },
    { name: 'Tickets Asignados', href: '/soporte/tickets', icon: Ticket },
    { name: 'Mensajes / Chats', href: chatHref, icon: MessageSquare },
    { name: 'Tecnicos', href: '/soporte/tecnicos', icon: User },
  ]

  return (
    <aside className="w-64 bg-[#0b3b60] text-white flex flex-col justify-between min-h-screen shadow-xl shrink-0">
      <div className="p-5 space-y-6">
        {/* Identificador Institucional */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-md">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wider">IT CELAYA</h2>
            <p className="text-[10px] text-blue-200 font-bold tracking-tight">SOPORTE TÉCNICO</p>
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            
            let isActive = false

            // Lógica avanzada de iluminación basada en la estructura real de tus carpetas
            if (item.name === 'Mensajes / Chats') {
              // Se ilumina "Mensajes / Chats" únicamente si el técnico está viendo un ticket en específico
              isActive = !!currentTicketId && pathname === item.href
            } else if (item.href === '/soporte') {
              // Dashboard: Coincidencia exacta
              isActive = pathname === '/soporte'
            } else if (item.href === '/soporte/tickets') {
              // Tickets Asignados: Se ilumina si está en la lista de tickets 
              // O si está en un ticket individual pero "Mensajes / Chats" NO está activo
              isActive = pathname.startsWith('/soporte/tickets') && !currentTicketId
            } else {
              // Técnicos y demás rutas estándar
              isActive = pathname.startsWith(item.href)
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-[#0b3b60] shadow-md scale-[1.02]'
                    : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#0b3b60]' : 'text-blue-200'} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Botón de Cerrar Sesión en el Footer */}
      <div className="p-4 border-t border-white/10">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-200 hover:text-white text-xs font-bold py-3 px-4 rounded-xl transition-all border border-red-500/20"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </form>
      </div>
    </aside>
  )
}