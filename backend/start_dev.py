#!/usr/bin/env python
"""
Script para iniciar el servidor de desarrollo.
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

def main():
    """Configurar entorno de desarrollo y ejecutar servidor."""
    
    # Configurar variables de entorno
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mi_proyecto.settings_dev')
    
    # Cargar variables de entorno desde archivo
    try:
        from dotenv import load_dotenv
        load_dotenv('env.dev')
    except ImportError:
        print("python-dotenv no está instalado. Instalando...")
        os.system('pip install python-dotenv')
        from dotenv import load_dotenv
        load_dotenv('env.dev')
    
    # Crear directorio de logs si no existe
    os.makedirs('logs', exist_ok=True)
    
    # Configurar Django
    django.setup()
    
    # Ejecutar migraciones si es necesario
    print("Verificando migraciones...")
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Crear superusuario si no existe
    from django.contrib.auth.models import User
    if not User.objects.filter(username='admin').exists():
        print("Creando superusuario admin...")
        User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123'
        )
        print("Superusuario creado: admin/admin123")
    
    # Iniciar servidor de desarrollo
    print("Iniciando servidor de desarrollo...")
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])

if __name__ == '__main__':
    main()
