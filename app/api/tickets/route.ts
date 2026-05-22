// app/api/tickets/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inicializamos el cliente directamente con las variables de entorno del servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 1. GET: Listar todos los tickets (Ideal para ver todo en Insomnia)
export async function GET() {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        usuario:user_id(name, avatar_url, role),
        tecnico:technician_id(name, avatar_url, role)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, tickets }, { status: 200 })
  } catch (error) {
    console.error('Error en API GET /api/tickets:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// 2. POST: Crear un nuevo ticket desde Insomnia o desde tu formulario
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Extraemos los campos requeridos mapeados de tu interfaz de "Crear Nuevo Ticket"
    const { title, description, priority, category_id, location, user_id } = body

    if (!title || !description || !category_id || !user_id) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (title, description, category_id, user_id)' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert([
        {
          title,
          description,
          priority: priority || 'Media',
          category_id,
          location,
          user_id,
          status: 'Abierto'
        }
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: 'Ticket creado exitosamente', ticket: data[0] },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en API POST /api/tickets:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}