'use client';

/**
 * Simplified PDF generation that's more reliable
 * Falls back to basic approach if advanced features fail
 */
export async function printElementToPdfSimple(el: HTMLElement, fileName: string = 'ats-report.pdf') {
  if (!el) {
    console.error('No element provided for PDF generation');
    return false;
  }

  console.log('Starting simple PDF generation...');

  try {
    // Load libraries
    const [{ jsPDF }, html2canvas] = await Promise.all([
      import('jspdf').then(m => ({ jsPDF: m.jsPDF })),
      import('html2canvas').then(m => m.default),
    ]);

    // Create a temporary container with simplified styling
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '800px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.lineHeight = '1.5';
    tempContainer.style.color = '#000000';

    // Clone the content and simplify it
    const clonedContent = el.cloneNode(true) as HTMLElement;
    
    // Remove all problematic styling
    const allElements = clonedContent.querySelectorAll('*');
    allElements.forEach((element: Element) => {
      const htmlElement = element as HTMLElement;
      
      // Remove animations and transforms
      htmlElement.style.animation = 'none';
      htmlElement.style.transform = 'none';
      htmlElement.style.transition = 'none';
      
      // Simplify backgrounds
      if (htmlElement.style.background && htmlElement.style.background.includes('gradient')) {
        htmlElement.style.background = '#ffffff';
      }
      if (htmlElement.style.backgroundImage) {
        htmlElement.style.backgroundImage = 'none';
      }
      
      // Remove shadows and effects
      htmlElement.style.boxShadow = 'none';
      htmlElement.style.textShadow = 'none';
      htmlElement.style.filter = 'none';
      htmlElement.style.backdropFilter = 'none';
      
      // Fix positioning
      if (htmlElement.style.position === 'fixed' || htmlElement.style.position === 'sticky') {
        htmlElement.style.position = 'static';
      }
      
      // Ensure visibility
      htmlElement.style.opacity = '1';
      htmlElement.style.visibility = 'visible';
    });

    tempContainer.appendChild(clonedContent);
    document.body.appendChild(tempContainer);

    // Wait for styles to settle
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('Generating canvas with simple options...');
    
    // Use minimal html2canvas options
    const canvas = await html2canvas(tempContainer, {
      scale: 1,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: false,
      useCORS: false,
      foreignObjectRendering: false,
      width: 800,
      height: tempContainer.scrollHeight
    });

    // Clean up
    document.body.removeChild(tempContainer);

    console.log('Canvas created:', canvas.width, 'x', canvas.height);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('portrait', 'pt', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const maxWidth = pdfWidth - (margin * 2);
    const maxHeight = pdfHeight - (margin * 2);
    
    const imgWidth = maxWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    if (imgHeight <= maxHeight) {
      // Fits on one page
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    } else {
      // Multiple pages needed
      let remainingHeight = imgHeight;
      let yPosition = 0;
      
      while (remainingHeight > 0) {
        const pageHeight = Math.min(remainingHeight, maxHeight);
        
        if (yPosition > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(
          imgData, 
          'PNG', 
          margin, 
          margin, 
          imgWidth, 
          imgHeight,
          undefined,
          'FAST',
          0,
          -yPosition
        );
        
        remainingHeight -= maxHeight;
        yPosition += maxHeight;
      }
    }

    pdf.save(fileName);
    console.log('Simple PDF generated successfully');
    return true;

  } catch (error) {
    console.error('Simple PDF generation failed:', error);
    return false;
  }
}
