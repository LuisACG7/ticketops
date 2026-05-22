'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface Tecnico {
  id: string
  name: string
  email: string
  role: 'Soporte' | 'Admin' | 'Usuario'
}

// 1. Obtener lista de personal calificado para resolver incidencias
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

// 2. Asignar el técnico seleccionado al ticket correspondiente
export async function asignarTecnicoATicket(ticketId: string, technicianId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tickets')
    .update({
      technician_id: technicianId,
      status: 'En proceso', // Cambia de estado automáticamente al asignar
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()

  if (error) {
    console.error('Error de Supabase al actualizar ticket:', error.message)
    throw new Error(error.message)
  }

  if (!data || data.length === 0) {
    throw new Error('No se modificó el ticket. Verifica los permisos RLS de la tabla tickets.')
  }

  // Revalidar las rutas para romper el caché de Next.js
  revalidatePath('/', 'layout')
  return data[0]
}