import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm text-gray-400">
            © 2025 Sistema de Gestión de Productos
          </div>
          <div className="text-sm text-gray-400 mt-2 sm:mt-0">
            Desarrollado con React + Django
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
