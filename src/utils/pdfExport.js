import jsPDF from 'jspdf';

/**
 * Export data to PDF
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column definitions with header and accessor
 * @param {String} title - Title of the report
 * @param {String} filename - Name of the PDF file
 */
export const exportToPDF = (data, columns, title, filename = 'report.pdf') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Prepare table data
  const tableData = data.map(row => {
    return columns.map(col => {
      if (col.render) {
        // Use render function if available
        const rendered = col.render(row);
        // Convert React elements to string if needed
        if (typeof rendered === 'string' || typeof rendered === 'number') {
          return rendered;
        }
        // For complex renders, try to extract text
        return String(rendered).replace(/<[^>]*>/g, '') || '';
      } else if (col.accessor) {
        // Handle nested accessors
        const value = col.accessor.split('.').reduce((o, i) => (o ? o[i] : undefined), row);
        return value !== null && value !== undefined ? String(value) : '';
      }
      return '';
    });
  });
  
  // Prepare table headers
  const headers = columns.map(col => col.header);
  
  // Calculate column widths
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usableWidth = pageWidth - (2 * margin);
  const numColumns = headers.length;
  const colWidth = usableWidth / numColumns;
  
  // Table settings
  const rowHeight = 8;
  const fontSize = 9;
  let currentY = 35;
  
  // Draw table header
  doc.setFillColor(76, 175, 80); // Green color
  doc.rect(margin, currentY, usableWidth, rowHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(fontSize);
  doc.setFont(undefined, 'bold');
  
  headers.forEach((header, index) => {
    doc.text(header, margin + (index * colWidth) + 2, currentY + rowHeight / 2 + 2);
  });
  
  currentY += rowHeight;
  
  // Draw table rows
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
  
  tableData.forEach((row, rowIndex) => {
    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, currentY, usableWidth, rowHeight, 'F');
    }
    
    // Draw cell borders and content
    row.forEach((cell, colIndex) => {
      const x = margin + (colIndex * colWidth);
      const cellText = String(cell || '').substring(0, 30); // Truncate long text
      doc.text(cellText, x + 2, currentY + rowHeight / 2 + 2);
      
      // Draw cell border
      doc.setDrawColor(200, 200, 200);
      doc.rect(x, currentY, colWidth, rowHeight, 'S');
    });
    
    currentY += rowHeight;
    
    // Check if we need a new page
    if (currentY > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      currentY = 20;
    }
  });
  
  // Add footer
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
  
  // Save the PDF
  doc.save(filename);
};

