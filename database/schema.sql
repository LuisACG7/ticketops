-- =========================================================================
-- SISTEMA DE CONTROL DE INCIDENCIAS - INSTITUTO TECNOLÓGICO DE CELAYA
-- SCRIPT DE MIGRACIÓN INICIAL Y CONFIGURACIÓN DE BASE DE DATOS
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. EXTENSIONES Y ENUMERADORES (ENUMS)
-- -------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE public.ticket_status AS ENUM ('Abierto', 'En proceso', 'Resuelto', 'Cerrado');
CREATE TYPE public.ticket_priority AS ENUM ('Baja', 'Media', 'Alta', 'Crítica');
CREATE TYPE public.user_role AS ENUM ('Usuario', 'Soporte', 'Admin');

-- -------------------------------------------------------------------------
-- 2. CREACIÓN DE TABLAS PRINCIPALES
-- -------------------------------------------------------------------------

-- TABLA: Perfiles de Usuario (Se enlaza con auth.users de Supabase)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role public.user_role DEFAULT 'Usuario' NOT NULL,
    career VARCHAR(100),            -- Para Alumnos
    department VARCHAR(100),        -- Para Personal Administrativo/Docente
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- TABLA: Categorías de Incidencias
CREATE TABLE public.categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Tickets de Soporte
CREATE TABLE public.tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    serial_number SERIAL UNIQUE,                         -- Para búsquedas rápidas por ID numérico/page.tsx]
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status public.ticket_status DEFAULT 'Abierto' NOT NULL,
    priority public.ticket_priority DEFAULT 'Media' NOT NULL,
    category_id BIGINT REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL, -- Quien reporta/page.tsx]
    technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,     -- Técnico asignado/page.tsx]
    location VARCHAR(255),                               -- Ubicación física/aula del campus/page.tsx]
    evidence_url TEXT,                                   -- Evidencia adjunta al ticket
    rating INT CHECK (rating >= 1 AND rating <= 5),     -- Calificación post-resolución
    feedback_comment TEXT,                               -- Reseña del servicio
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- TABLA: Comentarios / Chat 1:1 interno del Ticket/page.tsx]
CREATE TABLE public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,/page.tsx]
    user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL, -- Emisor/page.tsx]
    message TEXT NOT NULL,/page.tsx]
    attachments TEXT[],                                  -- Array de URLs guardadas en Storage/page.tsx]
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL/page.tsx]
);

-- TABLA: Artículos de Base de Conocimientos (FAQ)
CREATE TABLE public.faqs (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA: Bitácora de Auditoría y Logs de Seguridad
CREATE TABLE public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,                       -- Ejemplo: 'LOGIN', 'STATUS_CHANGE'
    resource VARCHAR(100) NOT NULL,                     -- Tabla o recurso afectado
    resource_id VARCHAR(255),                           -- ID del elemento afectado
    ip_address VARCHAR(45),                             -- Soporta IPv4 e IPv6
    user_agent TEXT,                                    -- Detalles del navegador
    details JSONB,                                      -- Estado anterior y nuevo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- -------------------------------------------------------------------------
-- 3. OPTIMIZACIÓN (ÍNDICES)
-- -------------------------------------------------------------------------
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_priority ON public.tickets(priority);
CREATE INDEX idx_tickets_user ON public.tickets(user_id);
CREATE INDEX idx_tickets_technician ON public.tickets(technician_id);
CREATE INDEX idx_tickets_title_search ON public.tickets USING gin (to_tsvector('spanish', title));
CREATE INDEX idx_comments_ticket_created ON public.comments(ticket_id, created_at);

-- -------------------------------------------------------------------------
-- 4. AUTOMATIZACIONES (FUNCIONES Y TRIGGERS)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'Usuario'::public.user_role),
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 5. SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- -------------------------------------------------------------------------

-- Activar RLS en las tablas críticas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Políticas para: PROFILES
CREATE POLICY "Permitir lectura general de perfiles" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir al usuario modificar su propio perfil" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Permitir actualizaciones a administradores" 
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'Admin'));

CREATE POLICY "Permitir actualizaciones a soporte" 
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'Soporte'));

-- Políticas para: CATEGORIES y FAQS
CREATE POLICY "Permitir lectura pública de categorías" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Permitir lectura pública de faqs" ON public.faqs FOR SELECT USING (true);

-- Políticas para: TICKETS
CREATE POLICY "Usuarios ven sus propios tickets y Soporte/Admin ven todos" 
ON public.tickets FOR SELECT TO authenticated 
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('Soporte', 'Admin'))
);

CREATE POLICY "Cualquier usuario autenticado puede crear tickets" 
ON public.tickets FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir actualizaciones de técnicos a Soporte y Admin"
ON public.tickets FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('Soporte', 'Admin')));

CREATE POLICY "Permitir a los usuarios actualizar sus propios tickets"
ON public.tickets FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Políticas para: COMMENTS (CHAT)
CREATE POLICY "Permitir lectura a usuarios involucrados en el ticket"
ON public.comments FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tickets
        WHERE tickets.id = comments.ticket_id
        AND (tickets.user_id = auth.uid() OR tickets.technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
    )
);

CREATE POLICY "Permitir inserción a usuarios involucrados en el ticket"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.tickets
        WHERE tickets.id = ticket_id
        AND (tickets.user_id = auth.uid() OR tickets.technician_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'))
    )
);

-- -------------------------------------------------------------------------
-- 6. CONFIGURACIÓN DE STORAGE (BUCKETS)
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) 
VALUES 
('ticket-evidences', 'ticket-evidences', true),
('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Permitir subida a usuarios autenticados" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ticket-evidences');
CREATE POLICY "Permitir lectura pública de evidencias" ON storage.objects FOR SELECT TO authenticated, anon USING (bucket_id = 'ticket-evidences');
CREATE POLICY "Permitir subida a usuarios autenticados chat" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ticket-attachments');
CREATE POLICY "Permitir lectura a usuarios autenticados chat" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'ticket-attachments');

-- -------------------------------------------------------------------------
-- 7. INSERCIÓN DE DATOS MAESTROS (SEED DATA)
-- -------------------------------------------------------------------------
INSERT INTO public.categories (name, description) VALUES
('Soporte de Software', 'Problemas con sistemas operativos, paquetería de oficina, errores de código o instalación de programas.'),
('Hardware y Equipos', 'Fallas físicas en monitores, computadoras, teclados, mouse, componentes internos o periféricos.'),
('Redes y Conectividad', 'Problemas con el acceso a internet, conexión a la VPN institucional, cables de red o redes Wi-Fi.'),
('Cuentas y Accesos', 'Bloqueo de usuarios, restablecimiento de contraseñas, permisos de rol o problemas de inicio de sesión (Auth).'),
('Bases de Datos', 'Errores de conexión con PostgreSQL/Supabase, lentitud en consultas, problemas con triggers o restauración de backups.'),
('Servidores y Hosting', 'Caídas del sistema, problemas de despliegue en Vercel/plataformas, almacenamiento lleno o fallas en entornos Cloud.'),
('Seguridad Informática', 'Reportes de phishing, sospecha de virus/malware, vulnerabilidades encontradas o auditorías de accesos.'),
('Mantenimiento Preventivo', 'Solicitudes de limpieza de equipos, actualización de componentes físicos o revisión periódica de hardware.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.faqs (category_id, title, content) VALUES
(4, 'Cómo recuperar mi contraseña @itcelaya.mx', 'Para recuperar tu contraseña institucional, ingresa al portal de autoservicio de TI, haz clic en "Olvidé mi contraseña" e introduce tu correo alternativo registrado.'),
(4, 'Activación de cuenta de nuevo ingreso', 'Los alumnos de nuevo ingreso reciben sus credenciales temporales en su correo de contacto proporcionado durante el proceso de admisión.'),
(3, 'Configuración de red Eduroam en Windows/Mac', 'Para conectarte a la red inalámbrica segura Eduroam, selecciona la red desde los ajustes de Wi-Fi de tu dispositivo e introduce tus credenciales institucionales.'),
(1, 'Descarga e instalación de Microsoft Office 365', 'Inicia sesión en portal.office.com con tu cuenta institucional, localiza el botón "Instalar Office" y sigue el asistente.'),
(2, 'Reglamento interno de laboratorios de cómputo', 'Está estrictamente prohibido introducir alimentos o bebidas a las salas de cómputo. Cada estudiante debe registrarse al ingresar.');