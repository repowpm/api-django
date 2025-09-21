# Endpoints de Monitoreo

Este documento describe los endpoints de monitoreo disponibles para mantener la API activa y monitorear su estado.

## Endpoints Disponibles

### 1. Health Check Completo
**URL:** `GET /api/health/`
**Descripción:** Endpoint completo de health check que verifica todos los componentes del sistema.

**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-21T10:30:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "ok",
      "message": "Database connection successful"
    },
    "cache": {
      "status": "ok",
      "message": "Cache is working"
    },
    "response_time": {
      "status": "ok",
      "value": "45.23ms",
      "message": "Response time acceptable"
    }
  },
  "system": {
    "python_version": "3.13.4",
    "django_version": "5.2.6",
    "environment": "production"
  }
}
```

**Códigos de Estado:**
- `200 OK`: Sistema saludable
- `200 OK`: Sistema degradado (con warnings)
- `503 Service Unavailable`: Sistema no saludable

### 2. Ping Simple
**URL:** `GET /api/ping/`
**Descripción:** Endpoint ligero para monitoreo básico. Ideal para Pulsetic.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-21T10:30:00.000Z",
  "message": "API is alive"
}
```

### 3. Status Check
**URL:** `GET /api/status/`
**Descripción:** Verificación rápida del estado del servicio.

**Respuesta:**
```json
{
  "status": "online",
  "service": "Django API",
  "timestamp": "2025-01-21T10:30:00.000Z"
}
```

## Configuración para Pulsetic

### Endpoint Recomendado para Pulsetic
**URL:** `https://api-django-uwx1.onrender.com/api/ping/`
**Método:** GET
**Intervalo:** 5-10 minutos
**Timeout:** 30 segundos

### Configuración Sugerida
1. **URL de Monitoreo:** `https://api-django-uwx1.onrender.com/api/ping/`
2. **Método:** GET
3. **Intervalo de Verificación:** 5 minutos
4. **Timeout:** 30 segundos
5. **Umbral de Fallo:** 3 intentos consecutivos
6. **Notificaciones:** Email/SMS cuando el servicio esté caído

## Configuración para Render

### Evitar que Render se Duerma
Render tiene un timeout de inactividad de 15 minutos. Para evitar que se duerma:

1. **Configurar Pulsetic** para hacer ping cada 5-10 minutos
2. **Usar el endpoint `/api/ping/`** que es muy ligero
3. **Monitorear logs** para detectar problemas

### Endpoints Alternativos
Si Pulsetic no está disponible, puedes usar:
- **UptimeRobot:** `https://api-django-uwx1.onrender.com/api/ping/`
- **Pingdom:** `https://api-django-uwx1.onrender.com/api/status/`
- **Cron job local:** `curl https://api-django-uwx1.onrender.com/api/ping/`

## Monitoreo Avanzado

### Health Check Completo
Para monitoreo más detallado, usa `/api/health/` que verifica:
- ✅ Conexión a base de datos
- ✅ Estado del cache
- ✅ Tiempo de respuesta
- ✅ Versiones del sistema

### Logs de Monitoreo
Los health checks se registran en los logs con:
- Timestamp de la verificación
- Estado del sistema
- Tiempo de respuesta
- Errores detectados

## Solución de Problemas

### Error 503 Service Unavailable
- Verificar conexión a la base de datos
- Revisar logs del servidor
- Verificar estado del cache

### Timeout en Health Check
- Verificar conectividad de red
- Revisar logs de Render
- Verificar configuración de CORS

### Endpoint No Responde
- Verificar que el servicio esté desplegado
- Revisar logs de Render
- Verificar configuración de DNS
