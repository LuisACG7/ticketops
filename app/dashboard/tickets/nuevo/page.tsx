'use client'

import { useState, useEffect } from 'react'
import { createTicket, getCategories } from '../actions'
import { useRouter } from 'next/navigation' // 1. Importar el hook de navegación nativo
import { 
  ArrowLeft, 
  AlertCircle, 
  UploadCloud, 
  LifeBuoy,
  Send,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: number
  name: string
}

export default function NuevoTicketPage() {
  const router = useRouter() // 2. Inicializar el enrutador de Next.js
  const [priority, setPriority] = useState('Media')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  // Estado dedicado para controlar el valor seleccionado del select
  const [selectedCategory, setSelectedCategory] = useState("")

  // Cargar categorías llamando a la Server Action
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories()
        // Aseguramos que data sea un array válido antes de asignarlo
        setCategories(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error al intentar renderizar categorías:', error)
        setErrorMessage('No se pudieron cargar las categorías del servidor.')
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // Manejar el envío del formulario usando nuestra Server Action
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.append('priority', priority)

    const result = await createTicket(formData)
    
    if (result?.error) {
      setErrorMessage(result.error)
      setIsSubmitting(false)
    } else if (result?.success) {
      // 3. Si todo salió bien, redirigimos limpiamente desde el cliente
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col justify-center items-center">
      
      {/* Botón superior de regreso al panel */}
      <div className="w-full max-w-2xl mb-6 flex justify-start">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver al Panel
        </Link>
      </div>

      {/* ENCABEZADO DEL FORMULARIO */}
      <div className="text-center mb-8">
        <div className="bg-blue-50 text-blue-600 p-3 rounded-full inline-flex items-center justify-center shadow-sm border border-blue-100 mb-3">
          <LifeBuoy size={24} />
        </div>
        <p className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">Soporte Técnico</p>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Crear Nuevo Ticket</h1>
        <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
          Por favor, describe el problema detalladamente para que nuestro equipo pueda ayudarte lo más rápido posible.
        </p>
      </div>

      {/* CONTENEDOR DEL FORMULARIO */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xl p-6 sm:p-8 w-full max-w-2xl transition-all">
        
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-xs text-red-600 font-medium">
            <AlertCircle size={16} className="flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
          
          {/* Campo 1: Título */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Título del Problema *</label>
            <input 
              type="text"
              name="title"
              required
              placeholder="Ej: Error de conexión en la base de datos principal"
              className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Fila Dividida: Categoría y Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Campo 2: Categoría Dinámica Corregida */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Categoría *</label>
              <select
                name="categoryId"
                required
                disabled={loadingCategories}
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
              >
                <option value="" disabled>
                  {loadingCategories ? 'Cargando categorías...' : 'Selecciona una categoría'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo 3: Prioridad Estilizada por Botones */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Nivel de Prioridad *</label>
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                {[
                  { name: 'Baja', color: 'text-green-600 border-green-200 bg-green-50/40', dot: 'bg-green-500' },
                  { name: 'Media', color: 'text-amber-600 border-amber-200 bg-amber-50/40', dot: 'bg-amber-500' },
                  { name: 'Alta', color: 'text-red-600 border-red-200 bg-red-50/40', dot: 'bg-red-500' }
                ].map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setPriority(p.name)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                      priority === p.name 
                        ? `${p.color} shadow-sm border-transparent scale-[1.02]` 
                        : 'bg-transparent text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Campo 4: Descripción Detallada */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Descripción Detallada *</label>
              <span className="text-[10px] text-gray-400 font-medium">Mínimo 50 caracteres</span>
            </div>
            <textarea 
              name="description"
              required
              rows={4}
              placeholder="Describe los pasos para reproducir el problema, mensajes de error, etc."
              className="w-full bg-gray-50/70 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Campo 5: Subida de Evidencia */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Evidencia (Opcional)</label>
            <div className="relative border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl bg-gray-50/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
              <input 
                type="file"
                name="evidence"
                accept="image/*,application/pdf,video/mp4"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setSelectedFileName(file ? file.name : null)
                }}
              />
              <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100 group-hover:scale-110 transition-transform text-blue-500">
                <UploadCloud size={20} />
              </div>
              <p className="text-xs font-bold text-gray-700 mt-3">
                {selectedFileName ? selectedFileName : 'Haz clic para subir o arrastra y suelta'}
              </p>
              <p className="text-[10px] text-gray-400 font-medium mt-1">PNG, JPG, PDF o MP4 hasta 10MB</p>
            </div>
          </div>

          <hr className="border-gray-100 my-2" />

          {/* Acciones del Formulario */}
          <div className="flex items-center justify-between pt-2">
            <Link 
              href="/dashboard"
              className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </Link>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0f172a] text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-gray-800 active:scale-95 transition-all shadow-md flex items-center gap-2 disabled:bg-gray-400 disabled:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Guardando Reporte...
                </>
              ) : (
                <>
                  Enviar Reporte
                  <Send size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}