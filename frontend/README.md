# Frontend - Sistema de Gestión de Productos

Frontend React para el sistema de gestión de productos con autenticación JWT.

## 🚀 Características

- **React 18** con Vite
- **Tailwind CSS** para estilos
- **Autenticación JWT** con axios
- **Gestión de productos** con CRUD completo
- **Exportación de datos** (Excel, PDF, Print)
- **Tema oscuro** profesional
- **Responsive design**

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build
```

## 🌐 Despliegue en Vercel

### Variables de entorno requeridas:
- `VITE_API_URL`: URL de la API de backend

### Configuración automática:
1. Conectar repositorio con Vercel
2. Configurar variables de entorno
3. Deploy automático desde GitHub

## 📱 Funcionalidades

- **Login/Logout** con JWT
- **Dashboard** con formulario y lista de productos
- **CRUD completo** de productos
- **Subida de archivos PDF**
- **Exportación de datos**
- **Filtros y búsqueda**
- **Paginación**

## 🔧 Configuración

### Variables de entorno:
```bash
VITE_API_URL=https://api-django-uwx1.onrender.com/api
```

### Build para producción:
```bash
npm run build
```

## 📦 Dependencias principales

- **React**: Framework principal
- **Vite**: Build tool
- **Tailwind CSS**: Estilos
- **Axios**: HTTP client
- **React Router**: Navegación
- **React Hot Toast**: Notificaciones
- **ExcelJS**: Exportación Excel
- **jsPDF**: Exportación PDF
- **html2canvas**: Captura de pantalla

## 🚀 Deploy

### Vercel (Recomendado):
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático

### Netlify:
1. Conectar repositorio
2. Configurar build command: `npm run build`
3. Configurar publish directory: `dist`

### GitHub Pages:
1. Configurar GitHub Actions
2. Build automático en push
3. Deploy a GitHub Pages