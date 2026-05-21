import Sidebar from '@/components/Sidebar'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import TicketDetailClient from '@/components/TicketDetailClient'

// 1. Tipar params de forma correcta como una Promesa para Next.js 15
interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TicketDetailPage({ params }: PageProps) {
  // 2. LA SOLUCIÓN: Resolver la promesa de params antes de interactuar con sus propiedades
  const resolvedParams = await params
  const ticketId = resolvedParams.id

  const supabase = await createClient()

  // 1. Validar la sesión del usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // 2. Traer la información del ticket incluyendo perfiles asociados (Usando ticketId)
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      *,
      usuario:user_id(name, avatar_url, role),
      tecnico:technician_id(name, avatar_url, role)
    `)
    .eq('id', ticketId)
    .single()

  if (ticketError || !ticket) {
    return notFound()
  }

  // 3. Obtener el historial completo de comentarios (Usando ticketId)
  const { data: initialComments } = await supabase
    .from('comments')
    .select(`
      *,
      emisor:user_id(name, avatar_url, role)
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-[#f8fafc] flex text-gray-900 font-sans">
      {/* Tu Sidebar compartido */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior */}
        <header className="bg-white border-b border-gray-200 h-16 px-4 lg:px-8 flex items-center gap-3 sticky top-0 z-30">
          <Link href="/dashboard" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Detalles de la Incidencia</h1>
        </header>

        {/* Pasamos toda la data estructurada al gestor interactivo del cliente */}
        <main className="p-4 lg:p-6 flex-1 overflow-y-auto w-full mx-auto max-w-[1600px]">
          <TicketDetailClient 
            initialTicket={ticket}
            initialComments={initialComments || []}
            currentUserId={user.id}
          />
        </main>
      </div>
    </div>
  )
}