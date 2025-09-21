import React from 'react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
        { header: 'Número OT', key: 'numero_ot', width: 15 },
        { header: 'Fecha Creación', key: 'fecha_creacion', width: 20 },
        { header: 'Activo', key: 'activo', width: 10 }
      ];

      // Agregar datos
      products.forEach(product => {
        worksheet.addRow({
          id: product.id,
          nombre: product.nombre,
          precio: product.precio,
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
  const exportToPDF = async () => {
    try {
      if (!tableRef.current) {
        toast.error('No se encontró la tabla para exportar');
        return;
      }

      const canvas = await html2canvas(tableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#1f2937'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

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
