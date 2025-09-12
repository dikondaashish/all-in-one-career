'use client';

export async function printElementToPdf(el: HTMLElement, fileName: string = 'ats-report.pdf') {
  if (!el) {
    console.error('No element provided for PDF generation');
    return false;
  }

  console.log('Starting PDF generation for element:', el);

  try {
    // Dynamic imports to avoid bloating the bundle
    console.log('Loading PDF libraries...');
    const [{ jsPDF }, html2canvas] = await Promise.all([
      import('jspdf').then(m => ({ jsPDF: m.jsPDF })),
      import('html2canvas').then(m => m.default),
    ]);
    console.log('PDF libraries loaded successfully');

    // Temporarily apply print styles to hide non-printable elements
    const printClass = 'generating-pdf';
    document.body.classList.add(printClass);

    // Wait for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Generating canvas from element...');
    
    // Simplified html2canvas options to avoid common issues
    const canvas = await html2canvas(el, {
      scale: 1.5, // Reduced scale to avoid memory issues
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: true, // Enable logging to see what's happening
      allowTaint: false, // Disable to avoid CORS issues
      foreignObjectRendering: false, // Disable to avoid SVG issues
      removeContainer: true,
      width: el.offsetWidth,
      height: el.offsetHeight,
      onclone: (clonedDoc) => {
        console.log('Cloning document for canvas rendering...');
        
        // Ensure all styles are applied to the cloned document
        const clonedElement = clonedDoc.getElementById('print-area');
        if (clonedElement) {
          clonedElement.style.maxWidth = 'none';
          clonedElement.style.width = '100%';
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.border = 'none';
          clonedElement.style.transform = 'none';
          clonedElement.style.animation = 'none';
        }
        
        // Remove problematic elements
        const problematicElements = clonedDoc.querySelectorAll('iframe, video, embed, object');
        problematicElements.forEach(elem => elem.remove());
        
        // Remove any sticky/fixed positioned elements that might interfere
        const stickyElements = clonedDoc.querySelectorAll('[style*="position: sticky"], [style*="position: fixed"]');
        stickyElements.forEach(elem => {
          (elem as HTMLElement).style.position = 'static';
        });

        // Remove any transform animations that might cause issues
        const animatedElements = clonedDoc.querySelectorAll('[style*="transform"], [class*="animate-"]');
        animatedElements.forEach(elem => {
          (elem as HTMLElement).style.transform = 'none';
          (elem as HTMLElement).style.animation = 'none';
        });
      }
    });

    console.log('Canvas generated successfully:', canvas.width, 'x', canvas.height);

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

    console.log('PDF saved successfully:', fileName);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      elementDimensions: el ? { width: el.offsetWidth, height: el.offsetHeight } : 'Element not found'
    });
    
    // Remove print class if it was added
    document.body.classList.remove(printClass);
    
    // Show detailed error message based on the type of error
    let errorMessage = 'PDF generation failed. ';
    if (error instanceof Error) {
      if (error.message.includes('Canvas')) {
        errorMessage += 'Canvas rendering failed - this might be due to complex animations or large content size. ';
      } else if (error.message.includes('CORS')) {
        errorMessage += 'Cross-origin resource sharing issue detected. ';
      } else if (error.message.includes('Memory')) {
        errorMessage += 'Memory limit exceeded - try refreshing the page. ';
      }
    }
    errorMessage += 'Would you like to use the browser print dialog instead?';
    
    // Fallback to browser print if PDF generation fails
    if (window.confirm(errorMessage)) {
      try {
        // Show only the print area
        const printContents = el.innerHTML;
        const originalContents = document.body.innerHTML;
        
        document.body.innerHTML = `
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .print-break { page-break-before: always; }
              * { box-shadow: none !important; }
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
      } catch (printError) {
        console.error('Browser print also failed:', printError);
        alert('Both PDF generation and browser print failed. Please try refreshing the page and try again.');
      }
    }
    
    return false;
  }
}
