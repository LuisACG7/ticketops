'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { LayoutDashboard, Ticket, MessageSquare, User, LogOut, ShieldCheck } from 'lucide-react'
import { logout } from '@/app/login/actions'
import { createClient } from '@/utils/supabase/client'

export default function SidebarSoporte() {
  const [lastTicketId, setLastTicketId] = useState<string | null>(null)
  const pathname = usePathname()
  const params = useParams()
  const supabase = createClient()

  // Extraemos el id del ticket si ya nos encontramos dentro de una ruta de detalle
  const currentTicketId = params?.id as string | undefined

  // Efecto para buscar de forma asíncrona el último ticket asignado al técnico
  useEffect(() => {
    async function fetchLastTechnicianTicket() {
      // 1. Si ya estás dentro del detalle de un ticket, memorizamos ese ID para mantener el flujo del chat
      if (currentTicketId) {
        setLastTicketId(currentTicketId)
        return
      }

      // 2. Si estás fuera, consultamos a Supabase el último ticket modificado asignado a este técnico
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ticket } = await supabase
        .from('tickets')
        .select('id')
        .eq('technician_id', user.id) // Filtra por los asignados al técnico actual
        .in('status', ['En proceso', 'Abierto']) // Prioriza los chats activos
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (ticket) {
        setLastTicketId(ticket.id)
      } else {
        // Si no hay ninguno "En proceso", busca el último resuelto o general de su historial
        const { data: anyTicket } = await supabase
          .from('tickets')
          .select('id')
          .eq('technician_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (anyTicket) setLastTicketId(anyTicket.id)
      }
    }

    fetchLastTechnicianTicket()
  }, [pathname, currentTicketId, supabase])

  // Determinar a dónde mandará el botón de Mensajes / Chats de forma dinámica
  const chatHref = lastTicketId 
    ? `/soporte/tickets/${lastTicketId}` 
    : '/soporte/tickets' // Si no tiene ningún ticket asignado aún, va a la lista general

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

            // Control exacto de iluminación de rutas dinámicas
            if (item.name === 'Mensajes / Chats') {
              // Se ilumina solo si estás dentro del detalle de un ticket Y coincide con la URL del chat activo
              isActive = !!currentTicketId && pathname === item.href
            } else if (item.href === '/soporte') {
              // Dashboard principal
              isActive = pathname === '/soporte'
            } else if (item.href === '/soporte/tickets') {
              // Se ilumina si estás en la lista de tickets o viendo un ticket que no es el link asignado al botón de chat
              isActive = pathname.startsWith('/soporte/tickets') && !currentTicketId
            } else {
              // Otras rutas estáticas como Técnicos
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