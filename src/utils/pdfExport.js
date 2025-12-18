import jsPDF from 'jspdf';


export const exportToPDF = (data, columns, title, filename = 'report.pdf') => {
  const doc = new jsPDF();
  
  

  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  

  const tableData = data.map(row => {
    return columns.map(col => {
      if (col.render) {
        

        const rendered = col.render(row);
        

        if (typeof rendered === 'string' || typeof rendered === 'number') {
          return rendered;
        }
        

        return String(rendered).replace(/<[^>]*>/g, '') || '';
      } else if (col.accessor) {
        

        const value = col.accessor.split('.').reduce((o, i) => (o ? o[i] : undefined), row);
        return value !== null && value !== undefined ? String(value) : '';
      }
      return '';
    });
  });
  
  

  const headers = columns.map(col => col.header);
  
  

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usableWidth = pageWidth - (2 * margin);
  const numColumns = headers.length;
  const colWidth = usableWidth / numColumns;
  
  

  const rowHeight = 8;
  const fontSize = 9;
  let currentY = 35;
  
  

  doc.setFillColor(76, 175, 80); 

  doc.rect(margin, currentY, usableWidth, rowHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(fontSize);
  doc.setFont(undefined, 'bold');
  
  headers.forEach((header, index) => {
    doc.text(header, margin + (index * colWidth) + 2, currentY + rowHeight / 2 + 2);
  });
  
  currentY += rowHeight;
  
  

  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  
  tableData.forEach((row, rowIndex) => {
    

    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, currentY, usableWidth, rowHeight, 'F');
    }
    
    

    row.forEach((cell, colIndex) => {
      const x = margin + (colIndex * colWidth);
      const cellText = String(cell || '').substring(0, 30); 

      doc.text(cellText, x + 2, currentY + rowHeight / 2 + 2);
      
      

      doc.setDrawColor(200, 200, 200);
      doc.rect(x, currentY, colWidth, rowHeight, 'S');
    });
    
    currentY += rowHeight;
    
    

    if (currentY > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      currentY = 20;
    }
  });
  
  

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  

  doc.save(filename);
};

