// app/api/tickets/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

interface TicketUpdatePayload {
  updated_at: string
  status?: 'Abierto' | 'En proceso' | 'Resuelto' | 'Cerrado'
  rating?: number | null
  feedback_comment?: string | null
  technician_id?: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 1. GET: Obtener un solo ticket detallado por su UUID pasándolo en la URL
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        usuario:user_id(name, avatar_url, role),
        tecnico:technician_id(name, avatar_url, role)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })

    return NextResponse.json({ success: true, ticket }, { status: 200 })
  } catch (error) {
    console.error('Error en API GET /api/tickets/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// 2. PATCH: Actualizar el ticket (Guardar estrellas, comentarios de resolución, cerrar o reabrir)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const { status, rating, feedback_comment, technician_id } = body

    const updateData: TicketUpdatePayload = {
      updated_at: new Date().toISOString()
    }

    if (status !== undefined) updateData.status = status
    if (rating !== undefined) updateData.rating = rating
    if (feedback_comment !== undefined) updateData.feedback_comment = feedback_comment
    if (technician_id !== undefined) updateData.technician_id = technician_id

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No se encontró el ticket o no tienes permisos' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Ticket actualizado correctamente',
      ticket: data[0]
    }, { status: 200 })

  } catch (error) {
    console.error('Error en API PATCH /api/tickets/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}