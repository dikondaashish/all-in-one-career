'use client';

/**
 * Fixed PDF generation that handles modern CSS color functions
 */

function sanitizeElementForPdf(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Create a temporary style element to override problematic CSS
  const style = document.createElement('style');
  style.textContent = `
    /* Override all problematic CSS color functions */
    * {
      color: black !important;
      background: white !important;
      border-color: #e5e7eb !important;
      box-shadow: none !important;
      text-shadow: none !important;
      filter: none !important;
      backdrop-filter: none !important;
      transform: none !important;
      animation: none !important;
      transition: none !important;
    }
    
    /* Keep structural colors for readability */
    .bg-blue-50, .bg-blue-100 { background: #f0f9ff !important; }
    .bg-green-50, .bg-green-100 { background: #f0fdf4 !important; }
    .bg-red-50, .bg-red-100 { background: #fef2f2 !important; }
    .bg-yellow-50, .bg-yellow-100 { background: #fefce8 !important; }
    .bg-purple-50, .bg-purple-100 { background: #faf5ff !important; }
    
    .text-blue-600, .text-blue-700, .text-blue-800 { color: #1d4ed8 !important; }
    .text-green-600, .text-green-700, .text-green-800 { color: #059669 !important; }
    .text-red-600, .text-red-700, .text-red-800 { color: #dc2626 !important; }
    .text-yellow-600, .text-yellow-700, .text-yellow-800 { color: #d97706 !important; }
    .text-purple-600, .text-purple-700, .text-purple-800 { color: #7c3aed !important; }
    
    .text-gray-600 { color: #4b5563 !important; }
    .text-gray-700 { color: #374151 !important; }
    .text-gray-800 { color: #1f2937 !important; }
    .text-gray-900 { color: #111827 !important; }
    
    /* Maintain basic structure */
    .rounded, .rounded-lg, .rounded-xl { border-radius: 8px !important; }
    .p-4 { padding: 16px !important; }
    .p-6 { padding: 24px !important; }
    .mb-4 { margin-bottom: 16px !important; }
    .mb-6 { margin-bottom: 24px !important; }
    
    /* Remove problematic elements */
    .sticky, .fixed { position: static !important; }
    .animate-spin, .animate-pulse, .animate-bounce { animation: none !important; }
  `;
  
  clone.appendChild(style);
  return clone;
}

export async function printElementToPdfFixed(el: HTMLElement, fileName: string = 'ats-report.pdf') {
  if (!el) {
    console.error('No element provided for PDF generation');
    return false;
  }

  console.log('Starting fixed PDF generation...');

  try {
    // Load libraries
    const [{ jsPDF }, html2canvas] = await Promise.all([
      import('jspdf').then(m => ({ jsPDF: m.jsPDF })),
      import('html2canvas').then(m => m.default),
    ]);

    console.log('Libraries loaded, sanitizing element...');
    
    // Create sanitized version of the element
    const sanitizedElement = sanitizeElementForPdf(el);
    
    // Create temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.appendChild(sanitizedElement);
    
    document.body.appendChild(container);
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('Generating canvas...');
    
    // Use very basic html2canvas options
    const canvas = await html2canvas(container, {
      scale: 1,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: false,
      useCORS: false,
      foreignObjectRendering: false,
      imageTimeout: 0,
      removeContainer: false
    });

    // Clean up
    document.body.removeChild(container);

    console.log('Canvas generated:', canvas.width, 'x', canvas.height);

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas has zero dimensions');
    }

    // Create PDF
    const imgData = canvas.toDataURL('image/png', 0.95);
    const pdf = new jsPDF('portrait', 'pt', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    
    const imgWidth = pdfWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add image to PDF
    if (imgHeight <= pdfHeight - (margin * 2)) {
      // Single page
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    } else {
      // Multiple pages
      let yPosition = 0;
      const pageHeight = pdfHeight - (margin * 2);
      
      while (yPosition < imgHeight) {
        if (yPosition > 0) {
          pdf.addPage();
        }
        
        const sourceY = (yPosition / imgHeight) * canvas.height;
        const sourceHeight = Math.min((pageHeight / imgHeight) * canvas.height, canvas.height - sourceY);
        
        // Create a temporary canvas for this page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        
        const pageCtx = pageCanvas.getContext('2d');
        if (pageCtx) {
          pageCtx.drawImage(canvas, 0, -sourceY);
          const pageImgData = pageCanvas.toDataURL('image/png', 0.95);
          pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, (sourceHeight * imgWidth) / canvas.width);
        }
        
        yPosition += pageHeight;
      }
    }

    pdf.save(fileName);
    console.log('PDF saved successfully');
    return true;

  } catch (error) {
    console.error('Fixed PDF generation failed:', error);
    return false;
  }
}
