import { createClient } from '@/utils/supabase/server'
import { Users, Shield, UserCheck, Mail, Circle, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// 1. Interfaces estrictas para evitar el uso de 'any'
interface TecnicoProfile {
  id: string
  name: string
  email: string
  role: 'Soporte' | 'Admin' | 'Usuario'
  department: string | null
  is_active: boolean
  avatar_url: string | null
}

export default async function TecnicosDashboard() {
  const supabase = await createClient()

  // 2. Consultar perfiles que pertenezcan al equipo de TI (Soporte o Admin)
  const { data: usuariosData, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, department, is_active, avatar_url')
    .in('role', ['Soporte', 'Admin'])
    .order('name', { ascending: true })

  if (error) {
    console.error('Error cargando el personal técnico:', error.message)
  }

  const tecnicos: TecnicoProfile[] = (usuariosData as unknown as TecnicoProfile[]) || []

  // Metrics calculadas dinámicamente
  const totalPersonal = tecnicos.length
  const activos = tecnicos.filter(t => t.is_active).length
  const administradores = tecnicos.filter(t => t.role === 'Admin').length
  const equipoSoporte = tecnicos.filter(t => t.role === 'Soporte').length

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex items-center justify-between border-b border-gray-200/70 pb-5">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Personal Técnico y Soporte
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Gestión del equipo del Centro de Cómputo, roles asignados y estado de actividad.
          </p>
        </div>
        <div className="text-right text-xs text-gray-400 font-bold">
          Centro de Cómputo • IT Celaya
        </div>
      </div>

      {/* TARJETAS ANALÍTICAS (METRICAS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Total Staff</p>
            <p className="text-2xl font-black text-gray-800">{totalPersonal}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-emerald-500 tracking-wider uppercase">Disponibles / Activos</p>
            <p className="text-2xl font-black text-emerald-600">{activos}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100/60">
            <UserCheck size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-blue-500 tracking-wider uppercase">Técnicos Soporte</p>
            <p className="text-2xl font-black text-blue-600">{equipoSoporte}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100/60">
            <Users size={18} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-indigo-500 tracking-wider uppercase">Administradores</p>
            <p className="text-2xl font-black text-indigo-600">{administradores}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100/60">
            <Shield size={18} />
          </div>
        </div>
      </div>

      {/* TABLA DE PERSONAL TÉCNICO */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-xs font-black text-gray-800 tracking-wider uppercase">
            Miembros del Equipo con Permisos de Soporte
          </h3>
          <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
            Lista ordenada alfabéticamente
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Nombre / Técnico</th>
                <th className="py-3 px-4">Correo Electrónico</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4">Rol del Sistema</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Historial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {tecnicos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 italic font-medium">
                    No se encontraron perfiles registrados con el rol de Soporte o Administrador.
                  </td>
                </tr>
              ) : (
                tecnicos.map((tecnico) => (
                  <tr key={tecnico.id} className="hover:bg-slate-50/70 transition-colors font-medium text-gray-700">
                    
                    {/* Nombre e Identidad Visual */}
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
                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-400" />
                        {tecnico.email}
                      </div>
                    </td>

                    {/* Departamento de Adscripción */}
                    <td className="py-3.5 px-4 text-gray-500 font-semibold">
                      {tecnico.department || 'Centro de Cómputo'}
                    </td>

                    {/* Badge de Rol */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        tecnico.role === 'Admin' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {tecnico.role}
                      </span>
                    </td>

                    {/* Estado de Actividad */}
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

                    {/* Acciones de revisión interna */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center">
                        <Link
                          href={`/dashboard/soporte/tickets?tech=${tecnico.id}`}
                          className="flex items-center gap-1 bg-slate-50 hover:bg-slate-200 text-slate-600 font-bold text-[10px] py-1.5 px-2.5 rounded-lg border border-slate-200 transition-all shadow-sm"
                        >
                          Ver Asignados <ArrowRight size={10} />
                        </Link>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}