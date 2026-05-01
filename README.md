# Circuito Escolar de Ajedrez Paranaense

Aplicacion web para administrar fechas escolares de ajedrez, importar clasificaciones desde Chess-Results/Swiss-Manager, revisar datos antes de guardar y publicar rankings individuales y por colegios.

## Stack

- Next.js 16.2.4 con App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase Auth + Postgres
- Recharts
- Exportacion CSV/XLSX

## Instalacion local

1. Instalar dependencias:

```bash
npm install
```

2. Crear variables de entorno:

```bash
cp .env.example .env.local
```

3. Para probar sin Supabase, deje vacias las variables o use:

```bash
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true
```

4. Iniciar el servidor:

```bash
npm run dev
```

5. Abrir `http://localhost:3000`.

## Supabase

1. Crear un proyecto en Supabase.
2. En SQL Editor, ejecutar `supabase/schema.sql`.
3. Para datos de prueba, ejecutar `supabase/seed.sql`.
4. Crear un usuario administrador en Supabase Auth.
5. Copiar las credenciales a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false
ADMIN_PASSWORD=...
```

La app usa `SUPABASE_SERVICE_ROLE_KEY` solo en rutas del servidor para importar, crear jugadores/colegios, recalcular puntos y registrar `audit_logs`.

## Flujo principal

1. Ingresar a `/login`.
2. Abrir `Importar Chess-Results`.
3. Pegar el link publico de Chess-Results.
4. Seleccionar Fecha, Categoria y Rama.
5. Leer la tabla.
6. Revisar y editar puestos, jugadores, colegios, puntos de torneo y desempates.
7. Corregir duplicados o campos vacios.
8. Confirmar carga.

Al confirmar, se guardan `imported_results`, se crean jugadores/colegios nuevos, se actualizan `circuit_points` y se registra un evento en `audit_logs`.

## Reglas implementadas

- Categorias: Sub 6, Sub 8, Sub 10, Sub 12, Sub 14, Abierto.
- Ramas: Absoluto, Femenino.
- Solo puntuan los puestos 1 al 10.
- Puntaje: 12, 11, 10, 9, 8, 7, 6, 5, 4, 3.
- El colegio suma automaticamente los puntos de sus alumnos.
- Desempates individuales: total, primeros puestos, podios, fechas jugadas y mejor resultado mas reciente.

## Secciones

- Dashboard
- Importar Chess-Results
- Revision de importacion
- Fechas
- Jugadores
- Colegios
- Ranking Individual
- Ranking Colegios
- Configuracion de puntos
- Reportes / Exportar
- Pagina publica en `/rankings`

## Tests

```bash
npm run test
```

## Build

```bash
npm run lint
npm run build
```

## Despliegue en Vercel

1. Subir el repositorio a GitHub.
2. Crear un proyecto en Vercel e importar el repositorio.
3. Configurar estas variables en Project Settings > Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false`
4. Deploy.

Vercel detecta Next.js automaticamente. Para CI manual se puede usar:

```bash
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod
```

## Notas de seguridad

- `/admin/*` requiere sesion de administrador o cookie demo local.
- `/rankings` es publica.
- Las rutas de importacion validan sesion antes de escribir.
- Los cambios manuales importantes se registran en `audit_logs`.
- En produccion, mantenga `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=false`.
- Si no usa Supabase Auth, configure `ADMIN_PASSWORD` en Vercel para proteger el panel.
