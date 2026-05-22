'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface SearchUser {
  id: string
  name: string
  email: string
  career: string | null
  department: string | null
}

// 1. Buscar usuarios base que tengan rol de 'Usuario'
export async function buscarUsuariosParaSoporte(term: string): Promise<SearchUser[]> {
  if (!term || term.trim().length < 2) return []

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, career, department')
    .eq('role', 'Usuario')
    .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(5)

  if (error) {
    console.error('Error al buscar usuarios:', error.message)
    return []
  }

  return data || []
}

// 2. Promover al usuario seleccionado al rol técnico
export async function promoverUsuarioATecnico(formData: {
  id: string
  role: 'Soporte' | 'Admin'
  department: string
  is_active: boolean
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      role: formData.role,
      department: formData.department || 'Centro de Cómputo',
      is_active: formData.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', formData.id)

  if (error) {
    throw new Error(error.message)
  }

  // Limpiar caché de la lista de técnicos para que aparezca de inmediato el nuevo miembro
  revalidatePath('/soporte/tecnicos')
}