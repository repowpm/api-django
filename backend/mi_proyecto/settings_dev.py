"""
Configuración para desarrollo.
"""
from .settings_base import *

# Configuración específica para desarrollo
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# CORS más permisivo para desarrollo
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Configuración de base de datos para desarrollo
# PostgreSQL no necesita init_command

# Configuración de archivos estáticos para desarrollo
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# Configuración de logging para desarrollo
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['django']['level'] = 'DEBUG'
LOGGING['loggers']['productos']['level'] = 'DEBUG'

# Configuración de email para desarrollo (consola)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Configuración de cache para desarrollo
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Configuración de sesiones para desarrollo
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
