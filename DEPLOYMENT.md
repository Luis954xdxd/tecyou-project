# Despliegue de Tec You paso a paso

Esta guia esta pensada para hacer tu primer despliegue sin saltarte pasos. La idea es subir Tec You a internet de forma ordenada, primero como version de pruebas (`staging`) y despues como produccion.

## 0. Que vas a subir

Tec You no es solo una pagina. Tiene estas partes:

1. Frontend React: lo que ve el usuario.
2. Backend Node/Express: la API que maneja login, chat, historias, reportes, admin e IA.
3. PostgreSQL: la base de datos.
4. Uploads: imagenes de perfil, historias, imagenes de chat, videos y evidencias.
5. Variables privadas: claves, contrasenas, URLs privadas y secretos.

Nunca subas archivos `.env` reales a GitHub. Solo se suben los `.env.example`.

## 1. Recomendacion para Tec You

Para tu primera vez, lo mas claro es:

- GitHub: guardar el codigo.
- Render: backend Node/Express.
- Render PostgreSQL: base de datos.
- Vercel: frontend React.
- Render persistent disk: uploads de prueba.

Esto te da una app real en web sin tener que administrar un servidor Linux manualmente.

Mas adelante, si el sistema crece, conviene mover uploads a Supabase Storage o S3 compatible. Para el primer despliegue, el disco persistente es suficiente.

## 2. Preparar el proyecto localmente

Abre una terminal en la raiz del proyecto:

```powershell
cd C:\Users\Usuario\Desktop\tecyou-project
```

Revisa que estes en el lugar correcto:

```powershell
dir
```

Deberias ver carpetas como:

```text
backend
frontend
database
DEPLOYMENT.md
```

Revisa el estado de Git:

```powershell
git status
```

Si salen archivos `.env`, no los subas. El `.gitignore` ya los ignora, pero revisarlo nunca sobra.

## 3. Probar antes de subir

### 3.1 Probar frontend

```powershell
cd frontend
npm install
npm run build
```

Resultado esperado:

```text
Compiled with warnings.
```

Warnings pueden existir por ESLint, pero no debe decir `Failed to compile`.

Regresa a la raiz:

```powershell
cd ..
```

### 3.2 Probar backend

```powershell
cd backend
npm install
npm test
```

Resultado esperado:

```text
pass
```

Despues prueba arrancarlo:

```powershell
npm start
```

Si todo esta bien, deberias ver algo parecido a:

```text
Servidor listo en: http://localhost:5000
Conexion a PostgreSQL exitosa
```

Para detenerlo:

```text
Ctrl + C
```

Regresa a la raiz:

```powershell
cd ..
```

## 4. Subir el codigo a GitHub

### 4.1 Crear repositorio en GitHub

1. Entra a https://github.com.
2. Inicia sesion.
3. Presiona `New repository`.
4. Nombre sugerido: `tecyou-project`.
5. Puedes dejarlo `Private` si no quieres que todos vean el codigo.
6. No marques `Add a README`, porque el proyecto ya existe localmente.
7. Presiona `Create repository`.

### 4.2 Conectar tu carpeta local con GitHub

En la raiz del proyecto:

```powershell
cd C:\Users\Usuario\Desktop\tecyou-project
git status
```

Si Git no esta inicializado:

```powershell
git init
```

Agrega el remoto de GitHub. Cambia `TU_USUARIO` y `tecyou-project` por los datos reales:

```powershell
git remote add origin https://github.com/TU_USUARIO/tecyou-project.git
```

Si ya existia un remoto y quieres verlo:

```powershell
git remote -v
```

### 4.3 Guardar cambios

Antes de hacer commit, revisa:

```powershell
git status --short
```

No deben aparecer `.env`. Si aparecen archivos de prueba en `backend/src/uploads`, decide si son contenido de prueba que quieres conservar o no.

Agrega los cambios:

```powershell
git add DEPLOYMENT.md
git add backend/.env.example backend/src frontend/.env.example frontend/src frontend/public/index.html
```

Revisa que se agrego:

```powershell
git status --short
```

Crea el commit:

```powershell
git commit -m "Prepare Tec You for web deployment"
```

Sube a GitHub:

```powershell
git branch -M main
git push -u origin main
```

## 5. Crear base de datos en Render

### 5.1 Crear cuenta y base

1. Entra a https://render.com.
2. Inicia sesion con GitHub o correo.
3. En el Dashboard, presiona `New`.
4. Elige `Postgres`.
5. Llena los datos:

```text
Name: tecyou-db
Database: tecyou
User: tecyou_user
Region: Oregon o la mas cercana disponible
Plan: Free para pruebas, pago para uso real
```

6. Presiona `Create Database`.
7. Espera a que diga `Available`.

### 5.2 Copiar DATABASE_URL

1. Abre la base `tecyou-db`.
2. Entra a `Connect` o `Info`.
3. Busca `Internal Database URL` si tu backend tambien estara en Render.
4. Copiala y guardala temporalmente en un bloc de notas.

Debe verse parecido a:

```text
postgres://usuario:password@host/tecyou
```

Para Render backend + Render PostgreSQL, usa la URL interna. Es mas rapida y privada.

## 6. Pasar el esquema de base de datos

Tu estructura inicial esta en:

```text
database/schema.sql
```

Tienes dos formas principales.

### Opcion A: usando psql desde terminal

Necesitas tener `psql` instalado. Si ya tienes PostgreSQL local, probablemente ya lo tienes.

Verifica:

```powershell
psql --version
```

Si responde version, puedes ejecutar el schema.

Render normalmente muestra un `PSQL Command` en la pagina de la base. Copialo. Se vera parecido a:

```powershell
psql "postgres://usuario:password@host/tecyou?sslmode=require"
```

Para ejecutar el schema:

```powershell
psql "postgres://usuario:password@host/tecyou?sslmode=require" -f database/schema.sql
```

Si estas en PowerShell y la ruta tiene espacios, usa comillas:

```powershell
psql "postgres://usuario:password@host/tecyou?sslmode=require" -f "C:\Users\Usuario\Desktop\tecyou-project\database\schema.sql"
```

### Opcion B: usando pgAdmin

1. Abre pgAdmin.
2. Crea una nueva conexion con los datos de Render.
3. Host, usuario, password y database salen en Render.
4. Abre la base.
5. Abre `Query Tool`.
6. Abre el archivo `database/schema.sql`.
7. Ejecuta el SQL.

### Verificar tablas

Con `psql`:

```powershell
psql "postgres://usuario:password@host/tecyou?sslmode=require"
```

Dentro de `psql`:

```sql
\dt
```

Deberias ver tablas como `users`, `recognitions`, `stories`, `reports`, etc.

Para salir:

```sql
\q
```

## 7. Crear backend en Render

### 7.1 Crear Web Service

1. En Render, presiona `New`.
2. Elige `Web Service`.
3. Conecta tu cuenta de GitHub si no lo hiciste.
4. Selecciona el repositorio `tecyou-project`.
5. Llena:

```text
Name: tecyou-api
Region: la misma que la base si se puede
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm start
```

6. En plan, puedes usar `Free` para pruebas. Para app real, conviene plan que no duerma.

### 7.2 Agregar variables del backend

En la pantalla del servicio, busca `Environment Variables`.

Agrega estas:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=pega_aqui_internal_database_url_de_render
DB_SSL=false
CORS_ORIGIN=https://temporal.vercel.app
UPLOADS_DIR=/opt/render/project/src/uploads
OPENAI_API_KEY=tu_clave_si_usas_IA
OPENAI_MODEL=gpt-5.4-mini
SUPER_ADMIN_EMAIL=tu_correo_super_admin
SESSION_SECRET=una_cadena_larga_y_aleatoria
```

Nota: `CORS_ORIGIN` todavia no sabremos exacto hasta crear Vercel. Por ahora puedes poner algo temporal y luego volver a cambiarlo.

Para generar un `SESSION_SECRET` puedes usar PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copia el resultado y pegalo en `SESSION_SECRET`.

### 7.3 Disco persistente para uploads

Esto es importante para que las imagenes no se pierdan al redeploy.

En Render:

1. Entra al servicio `tecyou-api`.
2. Busca `Disks`.
3. Presiona `Add Disk`.
4. Configura:

```text
Name: tecyou-uploads
Mount Path: /opt/render/project/src/uploads
Size: 1 GB o mas
```

5. Guarda.
6. Render redeployara el servicio.

La variable debe coincidir:

```env
UPLOADS_DIR=/opt/render/project/src/uploads
```

### 7.4 Deploy backend

Presiona `Create Web Service` o `Deploy`.

Espera los logs. Busca algo parecido a:

```text
Servidor listo en: http://localhost:5000
Conexion a PostgreSQL exitosa
```

Aunque diga `localhost` en logs, no esta mal: significa que Express escucha dentro del servidor. Render lo expone con una URL publica.

### 7.5 Probar backend

Render te dara una URL como:

```text
https://tecyou-api.onrender.com
```

Abrela en el navegador. Deberia responder:

```text
Servidor de Tec You activo
```

Tambien prueba:

```text
https://tecyou-api.onrender.com/api/auth/session
```

Puede responder error de metodo o sesion, pero lo importante es que el backend exista y no sea pagina en blanco.

## 8. Crear frontend en Vercel

### 8.1 Crear proyecto

1. Entra a https://vercel.com.
2. Inicia sesion con GitHub.
3. Presiona `Add New`.
4. Elige `Project`.
5. Importa el repo `tecyou-project`.

### 8.2 Configurar Vercel

Cuando Vercel detecte el proyecto, ajusta:

```text
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
Install Command: npm install
```

### 8.3 Agregar variable del frontend

En `Environment Variables`, agrega:

```env
REACT_APP_API_BASE_URL=https://tecyou-api.onrender.com
```

Cambia la URL por la real de tu backend de Render.

Importante: no debe terminar con `/`.

Correcto:

```text
https://tecyou-api.onrender.com
```

Evita:

```text
https://tecyou-api.onrender.com/
```

### 8.4 Deploy frontend

Presiona `Deploy`.

Cuando termine, Vercel te dara una URL como:

```text
https://tecyou-project.vercel.app
```

Guardala.

## 9. Ajustar CORS final

Ahora que ya tienes URL de frontend:

1. Ve a Render.
2. Abre `tecyou-api`.
3. Ve a `Environment`.
4. Cambia:

```env
CORS_ORIGIN=https://tecyou-project.vercel.app
```

5. Guarda.
6. Presiona `Manual Deploy` o espera redeploy automatico.

Si tienes mas de un frontend, por ejemplo staging y produccion, puedes separarlos por coma:

```env
CORS_ORIGIN=https://tecyou-staging.vercel.app,https://tecyou.vercel.app
```

## 10. Probar app completa en web

Abre la URL de Vercel:

```text
https://tecyou-project.vercel.app
```

Prueba en este orden:

1. Login.
2. Registro.
3. Cargar perfil.
4. Subir foto de perfil.
5. Crear reconocimiento.
6. Comentar reconocimiento.
7. Reaccionar.
8. Crear historia.
9. Ver historia.
10. Responder historia.
11. Abrir chat.
12. Enviar mensaje.
13. Subir imagen al chat.
14. Entrar al panel admin.
15. Ver reportes.
16. Resolver o descartar reporte.
17. Revisar notificaciones.

Si algo falla, revisa:

- Consola del navegador.
- Logs de Render.
- Network del navegador.
- Variables `REACT_APP_API_BASE_URL` y `CORS_ORIGIN`.

## 11. Comandos utiles para diagnosticar

### Ver si frontend apunta bien

En el navegador, abre DevTools con `F12`, entra a `Network` y revisa que las peticiones vayan a:

```text
https://tecyou-api.onrender.com/api/...
```

No deben ir a:

```text
http://localhost:5000/api/...
```

### Probar backend desde terminal

```powershell
curl https://tecyou-api.onrender.com
```

### Probar una ruta API

```powershell
curl https://tecyou-api.onrender.com/api/chat/presence
```

Puede pedir sesion, pero no deberia decir que el host no existe.

### Ver deploy local frontend con variable de produccion

En PowerShell:

```powershell
cd frontend
$env:REACT_APP_API_BASE_URL="https://tecyou-api.onrender.com"
npm run build
```

## 12. Como seguir haciendo cambios despues

No pasa nada si sigues cambiando el proyecto. Asi se trabaja profesionalmente.

Flujo recomendado:

```text
local -> GitHub -> staging -> produccion
```

Para cambios normales:

```powershell
git status
git add .
git commit -m "Describe el cambio"
git push
```

Render y Vercel pueden desplegar automaticamente cuando haces `git push`.

Para hacerlo mas ordenado, usa ramas:

```powershell
git checkout -b staging
git push -u origin staging
```

Despues puedes configurar:

- `main`: produccion.
- `staging`: pruebas.
- ramas `feature/...`: cambios nuevos.

## 13. Alternativa: todo en Railway

Railway puede ser mas simple porque backend y PostgreSQL quedan en el mismo tablero.

### 13.0 Si ya seleccionaste el repositorio y sale error de monorepo

Si Railway muestra un error diciendo que no detecto una aplicacion compilable en la raiz del repositorio, no significa que tu proyecto este mal. Significa que Railway esta mirando esta carpeta:

```text
tecyou-project/
```

Pero el backend real esta aqui:

```text
tecyou-project/backend/
```

Desde esa pantalla:

1. No borres el proyecto.
2. En el panel del servicio `Proyecto tecyou`, busca el boton que dice `Establecer el directorio raiz en backend`.
3. Presionalo.
4. Arriba a la izquierda aparecera `Aplicar 1 cambio`.
5. Todavia no presiones deploy si no has creado la base de datos y variables. Puedes hacerlo despues.
6. Si ya presionaste deploy y fallo, no pasa nada. Corrige el directorio y vuelve a desplegar.

Si no aparece el boton automatico:

1. Entra al servicio `Proyecto tecyou`.
2. Abre la pestana `Ajustes`.
3. Busca `Source` o `Root Directory`.
4. Escribe:

```text
/backend
```

5. Guarda.
6. Vuelve al canvas y aplica los cambios.

Para este servicio backend, la configuracion debe quedar asi:

```text
Root Directory: /backend
Build Command: npm install
Start Command: npm start
```

### 13.1 Crear proyecto Railway

1. Entra a https://railway.com.
2. Inicia sesion con GitHub.
3. Presiona `New Project`.
4. Elige `Deploy from GitHub repo`.
5. Selecciona `tecyou-project`.

### 13.2 Configurar backend

En el servicio:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

### 13.3 Agregar PostgreSQL

1. Presiona `New`.
2. Elige `Database`.
3. Elige `PostgreSQL`.
4. Railway creara variables como `DATABASE_URL`.

### 13.4 Variables backend Railway

Agrega:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
DB_SSL=false
CORS_ORIGIN=https://tu-frontend.vercel.app
UPLOADS_DIR=/data/uploads
OPENAI_API_KEY=tu_clave
OPENAI_MODEL=gpt-5.4-mini
SUPER_ADMIN_EMAIL=tu_correo
SESSION_SECRET=tu_secret_largo
```

### 13.5 Volumen para uploads

1. Entra al servicio backend.
2. Busca `Volumes`.
3. Crea un volumen.
4. Montalo en:

```text
/data/uploads
```

5. Asegurate de tener:

```env
UPLOADS_DIR=/data/uploads
```

### 13.6 Dominio backend

1. Ve a `Settings`.
2. Busca `Networking`.
3. Presiona `Generate Domain`.
4. Copia la URL.
5. Pegala en Vercel como:

```env
REACT_APP_API_BASE_URL=https://tu-backend.up.railway.app
```

## 14. Que hacer si algo falla

### Error de CORS

Mensaje tipico:

```text
Access to XMLHttpRequest has been blocked by CORS policy
```

Solucion:

1. Copia la URL exacta del frontend.
2. Pegala en Render/Railway como `CORS_ORIGIN`.
3. No agregues `/` al final.
4. Redeploy backend.

### Login no funciona

Revisa:

1. Que `REACT_APP_API_BASE_URL` apunte al backend.
2. Que backend este vivo.
3. Que base de datos tenga tablas.
4. Que `SESSION_SECRET` exista.
5. Que DevTools no muestre error 500.

### Imagenes no se guardan

Revisa:

1. Que `UPLOADS_DIR` exista.
2. Que el disco/volumen este montado.
3. Que la ruta coincida exactamente.
4. Que el hosting no este usando filesystem temporal.

### Base de datos no conecta

Revisa:

1. `DATABASE_URL`.
2. Si el proveedor requiere SSL, usa `DB_SSL=true`.
3. En Render, usa Internal URL si backend y DB estan en Render.
4. Si usas External URL, normalmente agrega `?sslmode=require`.

### El frontend sigue usando localhost

Revisa en Vercel:

```env
REACT_APP_API_BASE_URL=https://tu-backend.com
```

Despues haz redeploy. Las variables de React se leen al compilar, asi que cambiar la variable sin redeploy no actualiza el frontend viejo.

## 15. Checklist final de primera publicacion

- [ ] Codigo en GitHub.
- [ ] `.env` reales fuera de GitHub.
- [ ] Base PostgreSQL creada.
- [ ] `database/schema.sql` ejecutado.
- [ ] Backend creado en Render/Railway.
- [ ] `DATABASE_URL` configurado.
- [ ] `SESSION_SECRET` configurado.
- [ ] `SUPER_ADMIN_EMAIL` configurado.
- [ ] `OPENAI_API_KEY` configurado si se usara IA.
- [ ] `UPLOADS_DIR` configurado.
- [ ] Disco persistente o volumen creado.
- [ ] Backend abre en navegador.
- [ ] Frontend creado en Vercel.
- [ ] `REACT_APP_API_BASE_URL` configurado.
- [ ] `CORS_ORIGIN` actualizado con URL real de Vercel.
- [ ] Login probado.
- [ ] Registro probado.
- [ ] Perfil probado.
- [ ] Upload de foto probado.
- [ ] Historias probadas.
- [ ] Chat probado.
- [ ] Reportes probados.
- [ ] Admin probado.

## 16. Decision final

Para Tec You, no esperes a que ya no haya cambios. Sube primero a staging. Te servira para detectar errores reales de navegadores, celulares, redes y usuarios. Cuando staging este estable, entonces haces produccion.

Mi recomendacion concreta:

```text
Primero: GitHub + Render PostgreSQL + Render backend + Vercel frontend.
Despues: dominio propio + storage externo + backups + rama staging/main.
```
