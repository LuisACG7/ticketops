'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  // Redireccionar según el rol almacenado en la metadata del usuario
  const role = data.user?.user_metadata?.role || 'Usuario'
  if (role === 'Admin') redirect('/admin')
  if (role === 'Soporte') redirect('/soporte')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const roleSelected = formData.get('role') as string // 'Usuario', 'Soporte', 'Admin'

  // VALIDACIÓN CRUCIAL: Restricción estricta de dominios institucionales de Celaya
  if (!email.endsWith('@itcelaya.edu.mx') && !email.endsWith('@itcelaya.mx')) {
    return redirect('/login?error=Solo se permiten correos institucionales (@itcelaya.edu.mx)')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Guardamos el nombre completo y el Rol directamente en la metadata
      data: {
        full_name: fullName,
        role: roleSelected || 'Usuario', 
      },
    },
  })

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/login?message=Registro exitoso. Verifica tu correo electrónico.')
}