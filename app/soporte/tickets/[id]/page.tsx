'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Ticket, MessageSquare, User, LogOut, ShieldCheck } from 'lucide-react'
import { logout } from '@/app/login/actions'

// Definimos la estructura de un Ticket para evitar errores de TypeScript de tipo 'any'
interface PerfilBasico {
  id: string
  name: string
  email: string
}

interface TicketData {
  id: string
  serial_number: string
  title: string
  status: string
  priority: string
  updated_at: string
  user: PerfilBasico
  technician: PerfilBasico | null
}

interface SidebarSoporteProps {
  tickets?: TicketData[] // Recibe la lista de tickets actuales opcionalmente para buscar el chat activo
}

export default function SidebarSoporte({ tickets = [] }: SidebarSoporteProps) {
  const pathname = usePathname()

  // 1. Buscamos si hay algún ticket activo ("En proceso" o "Abierto") para obtener su ID de chat dinámico
  const ticketConChatActivo = tickets.find(
    (t) => t.status === 'En proceso' || t.status === 'Abierto'
  )

  // Si encuentra un ticket del técnico, lo manda al chat interno de ese ticket. Si no, a la lista.
  const rutaChatDinamico = ticketConChatActivo 
    ? `/soporte/tickets/${ticketConChatActivo.id}`
    : '/soporte/tickets'

  const menuItems = [
    { name: 'Dashboard', href: '/soporte', icon: LayoutDashboard },
    { name: 'Tickets Asignados', href: '/soporte/tickets', icon: Ticket },
    { name: 'Mensajes / Chats', href: rutaChatDinamico, icon: MessageSquare },
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
            
            // Lógica de iluminación de rutas
            let isActive = false
            if (item.name === 'Mensajes / Chats') {
              // Si estás dentro de un detalle de ticket específico, iluminamos "Mensajes / Chats" o "Tickets Asignados"
              // Aquí decidimos que si estás viendo el chat de un ticket, se quede prendido Mensajes/Chats
              isActive = pathname.startsWith('/soporte/tickets/') && pathname === item.href
            } else if (item.href === '/soporte') {
              isActive = pathname === item.href
            } else {
              isActive = pathname.startsWith(item.href) && !pathname.startsWith('/soporte/tickets/')
            }

            // Forzar que 'Tickets Asignados' se ilumine si estás en un sub-ticket y el chat no capturó la ruta
            if (item.href === '/soporte/tickets' && pathname.startsWith('/soporte/tickets') && !isActive) {
              // Si no está activo el chat pero estamos en un ticket, activamos el menú de Tickets
              const esChatActivo = menuItems.find(i => i.name === 'Mensajes / Chats')?.href === pathname
              if (!esChatActivo) isActive = true
            }

            return (
              <Link
                key={item.name + item.href}
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