import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener la sesión del usuario de forma segura
  const { data: { user } } = await supabase.auth.getUser()
  const nextUrl = request.nextUrl.pathname

  // Proteger rutas según roles de usuario (Guardados en user_metadata del JWT)
  const userRole = user?.user_metadata?.role || 'Usuario'

  // 1. Si intenta ir a rutas protegidas y no está logueado
  if (!user && (nextUrl.startsWith('/dashboard') || nextUrl.startsWith('/admin') || nextUrl.startsWith('/soporte'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Restricción de ruta para Administradores
  if (nextUrl.startsWith('/admin') && userRole !== 'Admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 3. Restricción de ruta para Soporte Técnico
  if (nextUrl.startsWith('/soporte') && userRole !== 'Soporte' && userRole !== 'Admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 4. Si ya está logueado e intenta ir al Login, mandarlo a su Dashboard correspondiente
  if (user && nextUrl === '/login') {
    if (userRole === 'Admin') return NextResponse.redirect(new URL('/admin', request.url))
    if (userRole === 'Soporte') return NextResponse.redirect(new URL('/soporte', request.url))
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

// Configurar qué rutas activarán este Middleware
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}