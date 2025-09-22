import React from 'react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

const ExportButtons = ({ products, tableRef }) => {
  // Exportar a Excel
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Productos');

      // Configurar columnas
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Precio', key: 'precio', width: 15 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Número Factura', key: 'numero_ot', width: 15 },
        { header: 'Fecha Creación', key: 'fecha_creacion', width: 20 },
        { header: 'Activo', key: 'activo', width: 10 }
      ];

      // Agregar datos
      products.forEach(product => {
        worksheet.addRow({
          id: product.id,
          nombre: product.nombre,
          precio: Math.round(product.precio),
          descripcion: product.descripcion || '',
          stock: product.stock || 0,
          numero_ot: product.numero_ot || '',
          fecha_creacion: new Date(product.fecha_creacion).toLocaleDateString('es-ES'),
          activo: product.activo ? 'Sí' : 'No'
        });
      });

      // Estilizar encabezados
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' }
      };

      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productos_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Archivo Excel exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      toast.error('Error al exportar Excel');
    }
  };

  // Exportar a PDF
  const exportToPDF = () => {
    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Configuración de colores
      const headerColor = [59, 130, 246]; // Blue-500
      const textColor = [31, 41, 55]; // Gray-800
      const borderColor = [209, 213, 219]; // Gray-300
      
      // Título
      pdf.setFontSize(20);
      pdf.setTextColor(...textColor);
      pdf.text('Lista de Productos', pageWidth / 2, 20, { align: 'center' });
      
      // Fecha de exportación
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // Gray-500
      pdf.text(`Exportado el: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 30, { align: 'center' });
      
      // Configuración de la tabla
      const startY = 40;
      const rowHeight = 8;
      const colWidths = [15, 40, 20, 15, 20, 15, 25]; // ID, Nombre, Precio, Stock, Factura, PDF, Fecha
      const colHeaders = ['ID', 'Nombre', 'Precio', 'Stock', 'Factura', 'PDF', 'Fecha'];
      
      let currentY = startY;
      
      // Encabezados de la tabla
      pdf.setFillColor(...headerColor);
      pdf.rect(10, currentY - 5, pageWidth - 20, rowHeight, 'F');
      
      pdf.setTextColor(255, 255, 255); // Blanco
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      
      let xPos = 15;
      colHeaders.forEach((header, index) => {
        pdf.text(header, xPos, currentY);
        xPos += colWidths[index];
      });
      
      currentY += rowHeight;
      
      // Datos de la tabla
      pdf.setTextColor(...textColor);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      
      products.forEach((product, index) => {
        // Verificar si necesitamos una nueva página
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
        
        // Fondo alternado para filas
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251); // Gray-50
          pdf.rect(10, currentY - 5, pageWidth - 20, rowHeight, 'F');
        }
        
        // Datos de la fila
        const rowData = [
          product.id.toString(),
          product.nombre.length > 25 ? product.nombre.substring(0, 25) + '...' : product.nombre,
          `$${Math.round(product.precio).toLocaleString()}`,
          product.stock !== null ? product.stock.toString() : 'N/A',
          product.numero_ot ? product.numero_ot.toString() : 'N/A',
          product.tiene_pdf ? 'Sí' : 'No',
          new Date(product.fecha_creacion).toLocaleDateString('es-ES')
        ];
        
        xPos = 15;
        rowData.forEach((data, colIndex) => {
          pdf.text(data, xPos, currentY);
          xPos += colWidths[colIndex];
        });
        
        currentY += rowHeight;
      });
      
      // Líneas de la tabla
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(0.1);
      
      // Líneas verticales
      xPos = 10;
      colWidths.forEach((width, index) => {
        xPos += width;
        pdf.line(xPos, startY - 5, xPos, currentY - rowHeight);
      });
      
      // Líneas horizontales
      for (let y = startY - 5; y <= currentY - rowHeight; y += rowHeight) {
        pdf.line(10, y, pageWidth - 10, y);
      }
      
      // Pie de página
      const totalY = currentY + 10;
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Total de productos: ${products.length}`, 15, totalY);
      pdf.text(`Página 1 de 1`, pageWidth - 15, totalY, { align: 'right' });
      
      pdf.save(`productos_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Archivo PDF exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error('Error al exportar PDF');
    }
  };

  // Imprimir
  const printTable = () => {
    if (!tableRef.current) {
      toast.error('No se encontró la tabla para imprimir');
      return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Lista de Productos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4f46e5; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { text-align: right; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lista de Productos</h1>
            <p class="date">Generado el: ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
          ${tableRef.current.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    toast.success('Vista de impresión abierta');
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={exportToExcel}
        className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exportar Excel
      </button>

      <button
        onClick={exportToPDF}
        className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Exportar PDF
      </button>

      <button
        onClick={printTable}
        className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Imprimir
      </button>
    </div>
  );
};

export default ExportButtons;
