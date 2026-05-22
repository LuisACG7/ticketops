// app/api/tickets/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// 1. GET: Obtener un solo ticket detallado por su UUID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

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

// 2. PATCH: Actualizar el ticket (Puntuación, comentarios, estados de cierre y reapertura)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Mapeamos los campos exactos que maneja tu BD en el esquema SQL enviado
    const { status, rating, feedback_comment, technician_id } = body

    // Construimos un objeto de actualización dinámico para no sobreescribir con valores nulos
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (status !== undefined) updateData.status = status
    if (rating !== undefined) updateData.rating = rating
    if (feedback_comment !== undefined) updateData.feedback_comment = feedback_comment
    if (technician_id !== undefined) updateData.technician_id = technician_id

    // Realizamos la mutación en Supabase golpeando las RLS
    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No se encontró el ticket o no tienes permisos (RLS)' }, { status: 404 })
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