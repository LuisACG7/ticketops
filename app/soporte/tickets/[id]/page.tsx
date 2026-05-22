import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import TicketDetailSupportClient from '@/components/TicketDetailSupportClient'

type BaseUserProfile = {
  name: string
  avatar_url: string | null
  role: string
}

type StructuredTicket = {
  id: string
  serial_number: number
  title: string
  description: string
  status: 'Abierto' | 'En proceso' | 'Resuelto' | 'Cerrado'
  priority: string
  category_id: number
  location: string | null
  usuario?: BaseUserProfile
  tecnico?: BaseUserProfile
  [key: string]: unknown 
}

type StructuredComment = {
  id: string
  ticket_id: string
  user_id: string
  message: string
  attachments: string[] | null
  created_at: string
  emisor?: BaseUserProfile
  [key: string]: unknown 
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TicketDetailSupportPage({ params }: PageProps) {
  const resolvedParams = await params
  const ticketId = resolvedParams.id

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  let ticket: StructuredTicket | null = null
  let initialComments: StructuredComment[] = []

  try {
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        usuario:user_id(name, avatar_url, role),
        tecnico:technician_id(name, avatar_url, role)
      `)
      .eq('id', ticketId)
      .maybeSingle()

    if (ticketError || !ticketData) {
      console.error("Error o Ticket no encontrado en Base de Datos:", ticketError)
      return notFound()
    }

    ticket = ticketData as unknown as StructuredTicket

    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select(`
        *,
        emisor:user_id(name, avatar_url, role)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (!commentsError && commentsData) {
      initialComments = commentsData as unknown as StructuredComment[]
    }

  } catch (error) {
    console.error("Error crítico en el servidor al recuperar datos:", error)
    return notFound()
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Header superior de la consola */}
      <header className="bg-white border-b border-gray-200 h-16 px-4 lg:px-8 flex items-center gap-3 sticky top-0 z-30 w-full">
        <Link 
          href="/soporte/tickets" 
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Consola de Soporte - Control de Incidencia</h1>
      </header>

      {/* Área del contenido del chat */}
      <main className="p-4 lg:p-6 flex-1 overflow-y-auto w-full mx-auto max-w-[1600px]">
        <TicketDetailSupportClient 
          initialTicket={ticket}
          initialComments={initialComments}
          currentUserId={user.id}
        />
      </main>
    </div>
  ) 
}