import { createClient } from '@/utils/supabase/server'
import { Users, Shield, UserCheck, Mail, Circle, ArrowRight, Star, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Interfaces estrictas para el tipado de datos de Supabase
interface TicketRating {
  rating: number | null
}

interface TecnicoProfile {
  id: string
  name: string
  email: string
  role: 'Soporte' | 'Admin' | 'Usuario'
  department: string | null
  is_active: boolean
  avatar_url: string | null
  tickets_as_tech: TicketRating[] // Para recibir las calificaciones de sus tickets
}

// Props para capturar los parámetros de búsqueda y paginación desde la URL
interface PageProps {
  searchParams: Promise<{
    search?: string
    page?: string
  }>
}

export default async function TecnicosDashboard({ searchParams }: PageProps) {
  const supabase = await createClient()
  
  // Resolver los parámetros de la URL de manera segura
  const resolvedParams = await searchParams
  const querySearch = resolvedParams.search || ''
  const currentPage = Number(resolvedParams.page) || 1
  const itemsPerPage = 5 // Cantidad de técnicos por página
  
  const from = (currentPage - 1) * itemsPerPage
  const to = from + itemsPerPage - 1

  // 1. Consulta base a la tabla profiles de técnicos (Soporte o Admin)
  // Agregamos un subquery interno para traer la columna 'rating' de los tickets donde este usuario sea el técnico
  let query = supabase
    .from('profiles')
    .select(`
      id, name, email, role, department, is_active, avatar_url,
      tickets_as_tech:tickets!technician_id(rating)
    `, { count: 'exact' })
    .in('role', ['Soporte', 'Admin'])
    .order('name', { ascending: true })

  // Aplicar filtro de búsqueda si el usuario escribió algo
  if (querySearch.trim() !== '') {
    query = query.ilike('name', `%${querySearch}%`)
  }

  // Aplicar paginación desde el servidor
  const { data: usuariosData, error, count } = await query.range(from, to)

  if (error) {
    console.error('Error cargando el personal técnico:', error.message)
  }

  const rawTecnicos = (usuariosData as unknown as TecnicoProfile[]) || []
  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // 2. Procesar los técnicos para calcular el promedio real del Rating
  const tecnicos = rawTecnicos.map(tecnico => {
    // Filtrar los tickets que sí tengan una calificación numérica dada por el alumno
    const calificacionesValidas = tecnico.tickets_as_tech
      .map(t => t.rating)
      .filter((r): r is number => r !== null && r > 0)

    // Calcular el promedio aritmético
    const promedio = calificacionesValidas.length > 0
      ? Number((calificacionesValidas.reduce((acc, curr) => acc + curr, 0) / calificacionesValidas.length).toFixed(1))
      : 0

    return {
      ...tecnico,
      ratingPromedio: promedio,
      totalEvaluaciones: calificacionesValidas.length
    }
  })

  // Métricas generales rápidas (basadas en todo el universo de staff técnico)
  const { data: metricsData } = await supabase
    .from('profiles')
    .select('role, is_active')
    .in('role', ['Soporte', 'Admin'])

  const totalPersonal = metricsData?.length || 0
  const activos = metricsData?.filter(t => t.is_active).length || 0
  const equipoSoporte = metricsData?.filter(t => t.role === 'Soporte').length || 0
  const administradores = metricsData?.filter(t => t.role === 'Admin').length || 0

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200/70 pb-5 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Personal Técnico y Soporte
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Gestión del equipo del Centro de Cómputo, calificaciones del servicio y control de actividad.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Botón estructural para promover/añadir técnicos */}
          <Link 
            href="/dashboard/soporte/tecnicos/nuevo"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-sm shadow-blue-100"
          >
            <Plus size={14} />
            Agregar Técnico
          </Link>
        </div>
      </div>

      {/* TARJETAS ANALÍTICAS (MÉTRICAS RESPONSIVAS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase">Total Staff</p>
            <p className="text-xl sm:text-2xl font-black text-gray-800">{totalPersonal}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 hidden sm:flex">
            <Users size={16} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-[11px] font-bold text-emerald-500 tracking-wider uppercase">Activos</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600">{activos}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100/60 hidden sm:flex">
            <UserCheck size={16} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-[11px] font-bold text-blue-500 tracking-wider uppercase">Soporte</p>
            <p className="text-xl sm:text-2xl font-black text-blue-600">{equipoSoporte}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100/60 hidden sm:flex">
            <Users size={16} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] sm:text-[11px] font-bold text-indigo-500 tracking-wider uppercase">Admins</p>
            <p className="text-xl sm:text-2xl font-black text-indigo-600">{administradores}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100/60 hidden sm:flex">
            <Shield size={16} />
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y CONTROL */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center max-w-md">
        <form method="GET" className="w-full flex items-center gap-2">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input 
            type="text"
            name="search"
            defaultValue={querySearch}
            placeholder="Buscar técnico por nombre..."
            className="w-full bg-transparent text-xs text-gray-700 font-medium placeholder-gray-400 focus:outline-none"
          />
          {querySearch && (
            <Link href="/soporte/tecnicos" className="text-[10px] text-gray-400 hover:text-gray-600 font-bold px-1">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* CONTENEDOR DE LA TABLA CON RESPONSIVIDAD ANTE EL SIDEBAR */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[11px] font-black text-gray-800 tracking-wider uppercase">
            Personal Autorizado en el Sistema
          </h3>
          <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
            Total en vista: {tecnicos.length}
          </span>
        </div>

        {/* CLAVE RESPONSIVA: overflow-x-auto para que no descuadre ningún sidebar */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Técnico / Integrante</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Calificación (Rating)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {tecnicos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 italic font-medium">
                    No se encontraron técnicos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                tecnicos.map((tecnico) => (
                  <tr key={tecnico.id} className="hover:bg-slate-50/70 transition-colors font-medium text-gray-700">
                    
                    {/* Identidad */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center text-slate-700 font-bold uppercase text-[11px]">
                          {tecnico.name ? tecnico.name.substring(0, 2) : 'TI'}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{tecnico.name}</div>
                          <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-tight">
                            ID: {tecnico.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Correo */}
                    <td className="py-3.5 px-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-400" />
                        {tecnico.email}
                      </div>
                    </td>

                    {/* Departamento */}
                    <td className="py-3.5 px-4 text-gray-500 font-semibold">
                      {tecnico.department || 'Centro de Cómputo'}
                    </td>

                    {/* Badge Rol */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        tecnico.role === 'Admin' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {tecnico.role}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Circle 
                          size={8} 
                          className={tecnico.is_active ? "fill-emerald-500 text-emerald-500" : "fill-gray-300 text-gray-300"} 
                        />
                        <span className={`text-[10px] font-bold ${tecnico.is_active ? "text-emerald-700" : "text-gray-400"}`}>
                          {tecnico.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>

                    {/* CAMBIO LOGRADO: RATING EN LUGAR DE HISTORIAL */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <div className="flex items-center gap-1">
                          <Star size={13} className={`${tecnico.ratingPromedio > 0 ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                          <span className="font-bold text-gray-900 text-xs">
                            {tecnico.ratingPromedio > 0 ? tecnico.ratingPromedio : 'N/A'}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold">
                          {tecnico.totalEvaluaciones} {tecnico.totalEvaluaciones === 1 ? 'voto' : 'votos'}
                        </span>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* COMPONENTE DE PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-slate-50/30">
            <span className="text-[10px] font-bold text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/soporte/tecnicos?page=${currentPage - 1}${querySearch ? `&search=${querySearch}` : ''}`}
                className={`p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 transition-all ${
                  currentPage <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'
                }`}
              >
                <ChevronLeft size={14} />
              </Link>
              <Link
                href={`/dashboard/soporte/tecnicos?page=${currentPage + 1}${querySearch ? `&search=${querySearch}` : ''}`}
                className={`p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 transition-all ${
                  currentPage >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'
                }`}
              >
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}