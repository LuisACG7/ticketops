'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface Tecnico {
  id: string
  name: string
  email: string
  role: 'Soporte' | 'Admin' | 'Usuario'
}

// 1. Obtener lista de personal técnico activo
export async function obtenerTecnicosDisponibles(): Promise<Tecnico[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .in('role', ['Soporte', 'Admin'])
    .eq('is_active', true)

  if (error) {
    console.error('Error al traer técnicos:', error.message)
    return []
  }

  return data as Tecnico[]
}

// 2. Obtener todos los tickets vinculando el usuario que reportó y su técnico asignado
export async function obtenerTicketsConDetalles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      id,
      serial_number,
      title,
      status,
      priority,
      updated_at,
      user:profiles!tickets_user_id_fkey(id, name, email),
      technician:profiles!tickets_technician_id_fkey(id, name, email)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al mapear tickets de la BD:', error.message)
    return []
  }

  return data || []
}

// 3. Asignar el técnico seleccionado y forzar el cambio en caliente
export async function asignarTecnicoATicket(ticketId: string, technicianId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tickets')
    .update({
      technician_id: technicianId,
      status: 'En proceso',
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select(`
      id,
      serial_number,
      title,
      status,
      priority,
      updated_at,
      user:profiles!tickets_user_id_fkey(id, name, email),
      technician:profiles!tickets_technician_id_fkey(id, name, email)
    `)

  if (error) {
    console.error('Error de Supabase al guardar técnico:', error.message)
    throw new Error(error.message)
  }

  // Rompemos la caché de Next.js para renderizar los nuevos datos en el servidor
  revalidatePath('/soporte/tickets')
  return data[0]
}