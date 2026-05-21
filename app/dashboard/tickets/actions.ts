'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ==========================================
// ACCIÓN 1: Crear un nuevo Ticket
// ==========================================
export async function createTicket(formData: FormData) {
  const supabase = await createClient()

  // 1. Obtener los datos del usuario logueado
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Sesión expirada o inválida. Por favor, inicia sesión de nuevo.' }
  }

  // 2. Extraer los campos del FormData nativo
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const categoryId = formData.get('categoryId') as string
  const priority = formData.get('priority') as string // 'Baja', 'Media', 'Alta'
  const file = formData.get('evidence') as File // Archivo adjunto

  // Validaciones básicas de backend
  if (!title || !description || !categoryId) {
    return { error: 'Por favor, rellena todos los campos obligatorios.' }
  }

  if (description.length < 50) {
    return { error: 'La descripción detallada debe tener al menos 50 caracteres.' }
  }

  let finalEvidenceUrl: string | null = null

  // 3. Flujo de subida de archivos al Bucket de Supabase
  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      return { error: 'El archivo excede el límite permitido de 10MB.' }
    }

    const fileExtension = file.name.split('.').pop()
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExtension}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ticket-evidences')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error subiendo archivo:', uploadError.message)
      return { error: 'Error al procesar el archivo adjunto.' }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ticket-evidences')
      .getPublicUrl(fileName)

    finalEvidenceUrl = publicUrl
  }

  // 4. Inserción en la tabla public.tickets
  const { error: insertError } = await supabase
    .from('tickets')
    .insert([
      {
        title,
        description,
        priority,
        category_id: parseInt(categoryId, 10),
        user_id: user.id,
        evidence_url: finalEvidenceUrl,
        status: 'Abierto'
      }
    ])

  if (insertError) {
    console.error('Error de Postgres al guardar ticket:', insertError.message)
    return { error: 'Hubo un error en el servidor al guardar el ticket.' }
  }

  // 5. Revalidamos la ruta del dashboard para que pinte el nuevo ticket al volver
  revalidatePath('/dashboard')
  
  // Retornamos éxito en lugar de forzar un redirect síncrono roto
  return { success: true }
}

// ==========================================
// ACCIÓN 2: Obtener Categorías de la BD
// ==========================================
export async function getCategories() {
  try {
    const supabase = await createClient(); 
    
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error("Error en Supabase Query:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error crítico en Server Action:", err);
    return [];
  }
}