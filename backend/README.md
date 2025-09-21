# API de Productos - Django REST Framework

API REST para gestión de productos con autenticación JWT, manejo de archivos PDF y funcionalidades avanzadas.

## 🚀 Características

- **Autenticación JWT** con refresh tokens
- **CRUD completo** de productos
- **Manejo de archivos PDF** para órdenes de trabajo
- **Validaciones avanzadas** y manejo de errores
- **Filtros y búsquedas** en endpoints
- **Gestión de stock** con operaciones específicas
- **Estadísticas** de productos
- **Configuración para producción** (Render)
- **Logging completo** de operaciones

## 📋 Requisitos

- Python 3.8+
- PostgreSQL
- pip

## 🛠️ Instalación

### Desarrollo Local

1. **Clonar el repositorio**
```bash
git clone <tu-repo>
cd backend
```

2. **Crear entorno virtual**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar base de datos**
```bash
# Crear base de datos PostgreSQL
createdb productos

# Ejecutar migraciones
python manage.py migrate
```

5. **Configurar variables de entorno**
```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar variables según tu configuración
```

6. **Iniciar servidor**
```bash
python start_dev.py
```

### Producción (Render)

1. **Configurar variables de entorno en Render:**
   - `DJANGO_SETTINGS_MODULE`: `mi_proyecto.settings_prod`
   - `SECRET_KEY`: Generar clave segura
   - `DEBUG`: `false`
   - `ALLOWED_HOSTS`: Tu dominio
   - `DATABASE_URL`: URL de PostgreSQL
   - `CORS_ALLOWED_ORIGINS`: URL de tu frontend

2. **Desplegar en Render:**
   - Conectar repositorio
   - Configurar build command: `pip install -r requirements.txt && python manage.py migrate`
   - Configurar start command: `gunicorn mi_proyecto.wsgi:application`

## 📚 Endpoints de la API

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Registrar usuario |
| POST | `/api/auth/login/` | Iniciar sesión |
| POST | `/api/auth/refresh/` | Renovar token |
| POST | `/api/auth/logout/` | Cerrar sesión |
| GET | `/api/auth/profile/` | Obtener perfil |

### Productos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/productos/` | Listar productos |
| POST | `/api/productos/` | Crear producto |
| GET | `/api/productos/{id}/` | Obtener producto |
| PUT | `/api/productos/{id}/` | Actualizar producto |
| PATCH | `/api/productos/{id}/` | Actualizar parcial |
| DELETE | `/api/productos/{id}/` | Eliminar producto |

### Funcionalidades Especiales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/productos/{id}/descargar-ot/` | Descargar PDF OT |
| POST | `/api/productos/{id}/reducir-stock/` | Reducir stock |
| POST | `/api/productos/{id}/aumentar-stock/` | Aumentar stock |
| GET | `/api/productos/estadisticas/` | Estadísticas |

## 🔍 Filtros y Búsquedas

### Parámetros de consulta para `/api/productos/`:

- `nombre`: Búsqueda por nombre (contiene)
- `precio_min`: Precio mínimo
- `precio_max`: Precio máximo
- `con_stock`: Solo productos con stock (true/false)
- `con_pdf`: Solo productos con PDF (true/false)

### Ejemplos:

```bash
# Buscar productos por nombre
GET /api/productos/?nombre=laptop

# Filtrar por rango de precios
GET /api/productos/?precio_min=100&precio_max=500

# Solo productos con stock
GET /api/productos/?con_stock=true

# Solo productos con PDF
GET /api/productos/?con_pdf=true
```

## 🔐 Autenticación

### Registrar usuario:
```json
POST /api/auth/register/
{
    "username": "usuario",
    "email": "usuario@example.com",
    "password": "password123",
    "first_name": "Nombre",
    "last_name": "Apellido"
}
```

### Iniciar sesión:
```json
POST /api/auth/login/
{
    "username": "usuario",
    "password": "password123"
}
```

### Usar token en requests:
```bash
curl -H "Authorization: Bearer <tu-token>" http://localhost:8000/api/productos/
```

## 📊 Modelo de Producto

```python
{
    "id": 1,
    "nombre": "Producto Ejemplo",
    "precio": 99.99,
    "descripcion": "Descripción del producto",
    "stock": 50,
    "numero_ot": 12345,
    "orden_trabajo_pdf": true,  # Indica si tiene PDF
    "fecha_creacion": "2024-01-01T00:00:00Z",
    "fecha_actualizacion": "2024-01-01T00:00:00Z",
    "activo": true,
    "precio_formateado": "$99.99",
    "tiene_pdf": true
}
```

## 🚀 Despliegue en Producción

### Render.com

1. **Crear servicio web**
2. **Configurar variables de entorno**
3. **Conectar base de datos PostgreSQL**
4. **Configurar dominio personalizado**

### Variables de entorno requeridas:

```bash
DJANGO_SETTINGS_MODULE=mi_proyecto.settings_prod
SECRET_KEY=tu-secret-key-seguro
DEBUG=false
ALLOWED_HOSTS=tu-dominio.com
DATABASE_URL=postgresql://user:pass@host:port/db
CORS_ALLOWED_ORIGINS=https://tu-frontend.vercel.app
```

## 📝 Logging

La API registra todas las operaciones importantes:

- Creación/actualización de productos
- Operaciones de stock
- Descargas de PDF
- Errores y excepciones

Los logs se guardan en `logs/django.log` y también se muestran en consola.

## 🧪 Testing

```bash
# Ejecutar tests
python manage.py test

# Ejecutar con cobertura
coverage run --source='.' manage.py test
coverage report
```

## 📈 Monitoreo

- **Logs estructurados** para análisis
- **Métricas de rendimiento** en producción
- **Alertas de errores** configurables

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

Para soporte, crear un issue en el repositorio o contactar al equipo de desarrollo.
