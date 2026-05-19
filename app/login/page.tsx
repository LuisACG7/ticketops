import { login, signup } from './actions'
import { Mail, Lock, Info } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#111827] px-4 py-12">
      {/* Fondo con patrón de puntos (Pattern) */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Encabezado: Logo y Títulos */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-2 rounded-lg mb-4 shadow-lg">
            {/* Icono de logo (puedes reemplazar con tu imagen de logo real) */}
            <div className="w-10 h-10 bg-[#1e293b] rounded flex items-center justify-center text-white font-bold">
              <div className="border-2 border-white w-5 h-5 rounded-sm"></div>
            </div>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Portal de Tickets</h1>
          <p className="text-gray-400 text-sm">Instituto Tecnológico de Celaya</p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-white rounded-[24px] p-10 shadow-2xl">
          <h2 className="text-[#111827] text-2xl font-bold mb-2">Bienvenido de nuevo</h2>
          <p className="text-gray-500 text-sm mb-8">
            Ingresa tus credenciales institucionales para continuar.
          </p>

          <form className="space-y-6">
            {/* Mensajes de Error o Éxito */}
            {params.error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
                <Info size={16} /> {params.error}
              </div>
            )}
            {params.message && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100">
                <Info size={16} /> {params.message}
              </div>
            )}

            {/* Campo: Correo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Institucional</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Mail size={18} />
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="ejemplo@itcelaya.edu.mx"
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Contraseña</label>
                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">¿Olvidé mi contraseña?</a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <Lock size={18} />
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Checkbox: Mantener sesión */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                Mantener sesión iniciada
              </label>
            </div>

            {/* Botones de Acción */}
            <div className="space-y-3 pt-2">
              <button
                formAction={login}
                className="w-full bg-[#111827] text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-lg"
              >
                Iniciar Sesión
              </button>
              
              {/* Botón secundario para registro (si quieres mantenerlo) */}
              <button
                formAction={signup}
                className="w-full bg-white text-gray-700 border border-gray-200 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-all"
              >
                Registrar nueva cuenta
              </button>
            </div>
          </form>

          {/* Footer de la tarjeta */}
          <p className="mt-8 text-center text-sm text-gray-500">
            ¿Problemas para acceder? <a href="#" className="text-blue-600 font-semibold hover:underline">Contactar a soporte IT</a>
          </p>
        </div>

        {/* Footer de la página */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-gray-500 uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Términos de Servicio</a>
          <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
          <span>© 2026 Instituto Tecnológico de Celaya</span>
        </div>
      </div>
    </div>
  )
}