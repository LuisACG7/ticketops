'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { buscarUsuariosParaSoporte, promoverUsuarioATecnico } from './actions'
import { ArrowLeft, Search, User, Shield, Briefcase, Mail, Check, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface SelectedUser {
  id: string
  name: string
  email: string
  career: string | null
  department: string | null
}

export default function AgregarTecnicoPage() {
  const router = useRouter()
  
  // Estados de control
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SelectedUser[]>([])
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Campos del formulario
  const [role, setRole] = useState<'Soporte' | 'Admin'>('Soporte')
  const [department, setDepartment] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Efecto debounce para no saturar Supabase mientras se escribe
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true)
        const results = await buscarUsuariosParaSoporte(searchTerm)
        setSearchResults(results)
        setIsSearching(false)
      } else {
        if (searchResults.length > 0) {
          setSearchResults([])
        }
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, searchResults.length])

  const handleSelectUser = (user: SelectedUser) => {
    setSelectedUser(user)
    setDepartment(user.department || 'Centro de Cómputo')
    setSearchTerm('')
    setSearchResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setIsSubmitting(true)
    setError(null)

    try {
      await promoverUsuarioATecnico({
        id: selectedUser.id,
        role,
        department,
        is_active: isActive
      })
      
      router.push('/dashboard/soporte/tecnicos')
      router.refresh()
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ocurrió un error inesperado al guardar.')
      }
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full min-h-screen bg-slate-50/50">
      <div className="p-4 sm:p-8 space-y-6 max-w-3xl mx-auto">
        
        {/* BOTÓN REGRESAR Y ENCABEZADO */}
        <div className="space-y-3">
          <Link 
            href="/dashboard/soporte/tecnicos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm"
          >
            <ArrowLeft size={12} /> Regresar al listado
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Asignar Nuevo Personal Técnico
            </h1>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              Busca un alumno o administrativo registrado para otorgarle privilegios de soporte en el Centro de Cómputo.
            </p>
          </div>
        </div>

        {/* ALERTAS DE ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <span>Error: {error}</span>
          </div>
        )}

        <div className="space-y-6">
          
          {/* PASO 1: BUSCAR USUARIO */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
            <label className="block text-xs font-black text-gray-800 uppercase tracking-wider">
              1. Buscar Usuario Registrado
            </label>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                {isSearching ? <Loader2 size={16} className="animate-spin text-blue-500" /> : <Search size={16} />}
              </div>
              <input
                type="text"
                placeholder="Escribe el nombre o correo del alumno/personal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-50 text-xs text-gray-700 font-medium placeholder-gray-400 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* RESULTADOS DEL BUSCADOR */}
            {searchResults.length > 0 && (
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden bg-white shadow-lg shadow-slate-100/60 max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between transition-colors text-xs font-medium"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-gray-900">{user.name}</div>
                      <div className="text-gray-400 text-[11px] flex items-center gap-1">
                        <Mail size={10} /> {user.email}
                      </div>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-lg font-bold">
                      Seleccionar
                    </span>
                  </button>
                ))}
              </div>
            )}

            {searchTerm.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
              <p className="text-[11px] text-gray-400 italic">No se encontraron cuentas de base con ese nombre o rol de usuario.</p>
            )}
          </div>

          {/* PASO 2: CONFIGURACIÓN DEL ROL (SOLO SI HAY ALGUIEN SELECCIONADO) */}
          {selectedUser && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tarjeta Informativa del Usuario Seleccionado */}
              <div className="bg-slate-50 border border-gray-200/60 p-4 rounded-2xl flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm uppercase">
                  {selectedUser.name.substring(0, 2)}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">Usuario Seleccionado</p>
                  <h3 className="text-sm font-black text-gray-900">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">{selectedUser.email}</p>
                  {selectedUser.career && (
                    <p className="text-[11px] text-gray-400 font-semibold">Carrera: {selectedUser.career}</p>
                  )}
                </div>
              </div>

              {/* Configuración de privilegios */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-5">
                <label className="block text-xs font-black text-gray-800 uppercase tracking-wider">
                  2. Configurar Roles y Asignación de TI
                  </label>

                {/* Selector de Rol */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500">Rol del Sistema (Nivel de Permisos)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    <button
                      type="button"
                      onClick={() => setRole('Soporte')}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        role === 'Soporte' 
                          ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500' 
                          : 'border-gray-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <User size={16} className={`mt-0.5 ${role === 'Soporte' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-gray-900">Personal de Soporte Técnico</p>
                        <p className="text-[11px] text-gray-400 font-medium">Asignación de tickets, atención en laboratorios y resolución en campus.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('Admin')}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        role === 'Admin' 
                          ? 'border-purple-500 bg-purple-50/40 ring-1 ring-purple-500' 
                          : 'border-gray-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Shield size={16} className={`mt-0.5 ${role === 'Admin' ? 'text-purple-600' : 'text-gray-400'}`} />
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-gray-900">Administrador de TI</p>
                        <p className="text-[11px] text-gray-400 font-medium">Control total del sistema, bitácoras de auditoría, FAQs y reasignaciones.</p>
                      </div>
                    </button>

                  </div>
                </div>

                {/* Input Departamento de Adscripción */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500">Ubicación / Departamento de Trabajo</label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Ej. Centro de Cómputo, Módulo de Idiomas, Planta Alta..."
                      className="w-full bg-slate-50 text-xs text-gray-700 font-medium border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Switch de Disponibilidad Inicial */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-gray-800">Estado de Disponibilidad Inicial</label>
                    <p className="text-[11px] text-gray-400 font-medium">Define si el técnico puede empezar a recibir tickets de inmediato.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
                      isActive ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex items-center justify-end gap-3">
                <Link
                  href="/dashboard/soporte/tecnicos"
                  className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all shadow-sm shadow-blue-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Confirmar Alta de Técnico
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  )
}