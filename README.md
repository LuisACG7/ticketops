# Sistema de Control de Incidencias y Soporte Técnico -

Este es un sistema web híbrido y robusto diseñado para la gestión, seguimiento y resolución de incidencias tecnológicas. Permite a los alumnos y al personal levantar reportes, chatear en tiempo real con el equipo de soporte técnico asignado, y calificar la atención mediante un sistema de retroalimentación de fin de ciclo.

---

## Arquitectura del Sistema

El proyecto está construido bajo una arquitectura moderna y desacoplada, utilizando el entorno de ejecución de Next.js y el poder relacional y de seguridad perimetral de Supabase (PostgreSQL).



### Stack Tecnológico
* **Frontend:** React 18, Next.js 14+ (App Router), Tailwind CSS (Diseño responsivo), Lucide React (Iconografía).
* **Backend:** Next.js Route Handlers (REST API nativa) y Server Actions para mutaciones optimizadas.
* **Base de Datos & Autenticación:** Supabase (PostgreSQL), triggers automatizados en PL/pgSQL y políticas de aislamiento de datos en la fila (Row Level Security - RLS).
* **Almacenamiento:** Supabase Storage (Buckets privados y públicos para el control de evidencias en chat y tickets).

---

## Modelo de Datos y Seguridad (PostgreSQL)

El núcleo del sistema de base de datos implementa restricciones estrictas de integridad referencial, índices de rendimiento cronológicos y búsquedas de texto indexadas (GIN). El esquema completo e inicial de la base de datos se encuentra documentado rigurosamente en el archivo [`schema.sql`](./schema.sql).

### Flujo de Seguridad Perimetral (RLS)
El acceso a la información está protegido a nivel de base de datos mediante **Políticas RLS**. Esto garantiza que:
1.  Los **Alumnos** únicamente puedan visualizar e insertar comentarios en sus propios tickets.
2.  El equipo de **Soporte** y **Administración** tenga visibilidad global y privilegios avanzados de edición y asignación técnica.
3.  Las transacciones críticas en cascada (`ON DELETE CASCADE`) aseguran que si una identidad central es eliminada, su perfil se limpie de forma íntegra sin dejar datos huérfanos.

---

## Instalación y Configuración Local

Sigue estos pasos para clonar el repositorio y levantar el entorno de desarrollo local:

### Requisitos Previos
* Node.js (versión 18.x o superior)
* Administrador de paquetes npm o pnpm
* Una cuenta activa en Supabase (o Docker si ejecutas Supabase localmente mediante WSL).

### Pasos
1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/nombre-del-repo.git](https://github.com/tu-usuario/nombre-del-repo.git)
    cd nombre-del-repo
    ```

2.  **Instalar las dependencias de Node.js:**
    ```bash
    npm install
    ```

3.  **Configurar las Variables de Entorno:**
    Crea un archivo llamado `.env.local` en la raíz del proyecto y parametriza tus llaves de conexión de Supabase (nunca las subas al repositorio público):
    ```env
    NEXT_PUBLIC_SUPABASE_URL=[https://tu-proyecto.supabase.co](https://tu-proyecto.supabase.co)
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-llave-anonima-aqui
    ```

4.  **Montar el Esquema de Base de Datos:**
    Copia el contenido de [`schema.sql`](./schema.sql) y ejecútalo directamente dentro del **SQL Editor** de tu panel de control en Supabase para estructurar las tablas, triggers, buckets de almacenamiento y políticas de seguridad automáticamente.

5.  **Iniciar el Servidor de Desarrollo:**
    ```bash
    npm run dev
    ```
    El sistema estará disponible en tu navegador web ingresando a `http://localhost:3000`.

---

## API Endpoints y Pruebas con Insomnia / Postman

El sistema expone una API REST interna mediante los controladores Route Handlers ubicados en la ruta `app/api/`. Esto permite la integración limpia con clientes externos o aplicaciones móviles futuras en Flutter.



### Endpoints Disponibles:

#### 1. Listar todos los Tickets
* **Método:** `GET`
* **URL:** `/api/tickets`
* **Descripción:** Recupera la colección completa de reportes ordenados cronológicamente, mapeando los objetos embebidos de `usuario` creador y `tecnico` asignado.

#### 2. Consultar Detalles de un Ticket Individual
* **Método:** `GET`
* **URL:** `/api/tickets/[id]`
* **Descripción:** Trae la información de un único registro filtrado por su identificador UUID.

#### 3. Actualizar Estado, Puntuación o Feedback (Acción del Alumno/Técnico)
* **Método:** `PATCH`
* **URL:** `/api/tickets/[id]`
* **Body (JSON) - Ejemplo para Cerrar y Calificar Ticket:**
    ```json
    {
      "status": "Cerrado",
      "rating": 5,
      "feedback_comment": "El ingeniero solucionó el problema de software rápidamente."
    }
    ```
* **Body (JSON) - Ejemplo para Reabrir Incidencia:**
    ```json
    {
      "status": "Abierto",
      "rating": null,
      "feedback_comment": null
    }
    ```

---

##  Desarrollo y Despliegue

* **Entorno Local:** Desarrollado sobre arquitectura **Windows Subsystem for Linux (WSL)**.
* **Despliegue Continuo (CI/CD):** Configurado e integrado nativamente con **Vercel** acoplado al repositorio principal para generar despliegues automáticos con cada `git push` a la rama `main`.