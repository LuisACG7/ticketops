import SidebarSoporte from '@/components/SidebarSoporte'

export default function SoporteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50/50 w-full antialiased">
      {/* Sidebar fijo a la izquierda */}
      <SidebarSoporte />
      
      {/* Contenido dinámico del panel a la derecha */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}