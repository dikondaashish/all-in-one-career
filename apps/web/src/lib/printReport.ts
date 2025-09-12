'use client';

export async function printElementToPdf(el: HTMLElement, fileName: string = 'ats-report.pdf') {
  if (!el) {
    console.error('No element provided for PDF generation');
    return;
  }

  try {
    // Dynamic imports to avoid bloating the bundle
    const [{ jsPDF }, html2canvas] = await Promise.all([
      import('jspdf').then(m => ({ jsPDF: m.jsPDF })),
      import('html2canvas').then(m => m.default),
    ]);

    // Temporarily apply print styles to hide non-printable elements
    const printClass = 'generating-pdf';
    document.body.classList.add(printClass);

    // High-DPI canvas render for crisp output on retina displays
    const canvas = await html2canvas(el, {
      scale: Math.min(2, window.devicePixelRatio || 1.5),
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: document.documentElement.scrollWidth,
      height: el.scrollHeight,
      logging: false, // Disable console logging from html2canvas
      allowTaint: true,
      removeContainer: true,
      onclone: (clonedDoc) => {
        // Ensure all styles are applied to the cloned document
        const clonedElement = clonedDoc.getElementById('print-area');
        if (clonedElement) {
          clonedElement.style.maxWidth = 'none';
          clonedElement.style.width = '100%';
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.border = 'none';
        }
        
        // Remove any sticky/fixed positioned elements that might interfere
        const stickyElements = clonedDoc.querySelectorAll('[style*="position: sticky"], [style*="position: fixed"]');
        stickyElements.forEach(elem => {
          (elem as HTMLElement).style.position = 'static';
        });
      }
    });

    const imgData = canvas.toDataURL('image/png', 1.0);

    // A4 dimensions in points: 595.28 x 841.89
    const pdf = new jsPDF({ 
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', 
      unit: 'pt', 
      format: 'a4' 
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions to fit within page with margins
    const margin = 40; // 40pt margin on all sides
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);

    const imgAspectRatio = canvas.width / canvas.height;
    const pageAspectRatio = maxWidth / maxHeight;

    let imgWidth, imgHeight;

    if (imgAspectRatio > pageAspectRatio) {
      // Image is wider than page ratio - fit to width
      imgWidth = maxWidth;
      imgHeight = maxWidth / imgAspectRatio;
    } else {
      // Image is taller than page ratio - fit to height
      imgHeight = maxHeight;
      imgWidth = maxHeight * imgAspectRatio;
    }

    // Center the image on the page
    const x = (pageWidth - imgWidth) / 2;
    const y = margin;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', x, y + position, imgWidth, imgHeight);
    heightLeft -= maxHeight;

    // Additional pages if content exceeds one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', x, y + position, imgWidth, imgHeight);
      heightLeft -= maxHeight;
    }

    // Save the PDF with the provided filename
    pdf.save(fileName);

    // Remove print class
    document.body.classList.remove(printClass);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Fallback to browser print if PDF generation fails
    if (window.confirm('PDF generation failed. Would you like to use the browser print dialog instead?')) {
      // Show only the print area
      const printContents = el.innerHTML;
      const originalContents = document.body.innerHTML;
      
      document.body.innerHTML = `
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .print-break { page-break-before: always; }
          }
        </style>
        <div style="max-width: none; margin: 0; padding: 0;">
          ${printContents}
        </div>
      `;
      
      window.print();
      
      // Restore original content
      document.body.innerHTML = originalContents;
      
      // Reload the page to restore all event handlers
      window.location.reload();
    }

    // Remove print class if it was added
    document.body.classList.remove(printClass);
    
    return false;
  }
}
