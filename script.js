// Fixed PDF download function with proper content handling
function downloadReportAsPDF(applicantId) {
    const applicant = applicantsData[applicantId];
    const reportElement = document.getElementById('report-page-container');
    
    // Create a clone of the report element to avoid modifying the original
    const clonedReport = reportElement.cloneNode(true);
    
    // Ensure all content is visible and properly sized
    clonedReport.style.opacity = '1';
    clonedReport.style.height = 'auto';
    clonedReport.style.overflow = 'visible';
    clonedReport.style.position = 'static';
    clonedReport.style.transform = 'none';
    
    // Fix any elements that might be cut off
    const allElements = clonedReport.querySelectorAll('*');
    allElements.forEach(element => {
        // Remove any transform animations that might interfere
        element.style.transform = 'none';
        element.style.opacity = '1';
        element.style.height = 'auto';
        element.style.overflow = 'visible';
    });

    // Temporarily add the cloned element to the document for proper rendering
    clonedReport.style.position = 'absolute';
    clonedReport.style.left = '-9999px';
    clonedReport.style.top = '0';
    clonedReport.style.width = '210mm'; // A4 width
    document.body.appendChild(clonedReport);

    const options = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `RISKON_Report_${applicantId}_${applicant.personal.name.replace(/\s+/g, '_')}.pdf`,
        image: { 
            type: 'jpeg', 
            quality: 0.98 
        },
        html2canvas: { 
            scale: 1, // Reduced scale to avoid memory issues
            useCORS: true, 
            allowTaint: true,
            backgroundColor: '#1f2937',
            width: 794, // A4 width in pixels at 96 DPI
            height: null, // Let it calculate height automatically
            scrollX: 0,
            scrollY: 0,
            windowWidth: 794,
            windowHeight: window.innerHeight,
            onrendered: function(canvas) {
                console.log('Canvas rendered successfully');
            }
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        },
        pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy'],
            before: '.page-break-before',
            after: '.page-break-after'
        }
    };

    // Generate PDF with proper error handling
    html2pdf()
        .from(clonedReport)
        .set(options)
        .toPdf()
        .get('pdf')
        .then(function (pdf) {
            // Optional: Add page numbers or other enhancements
            const totalPages = pdf.internal.getNumberOfPages();
            console.log(`PDF generated with ${totalPages} pages`);
        })
        .save()
        .then(() => {
            console.log('PDF saved successfully');
            // Clean up the cloned element
            document.body.removeChild(clonedReport);
        })
        .catch((error) => {
            console.error('Error generating PDF:', error);
            // Clean up the cloned element even if there's an error
            if (document.body.contains(clonedReport)) {
                document.body.removeChild(clonedReport);
            }
            alert('Error generating PDF. Please try again.');
        });
}

// Alternative approach: Wait for all content to load before generating PDF
function downloadReportAsPDFAlternative(applicantId) {
    const applicant = applicantsData[applicantId];
    const reportElement = document.getElementById('report-page-container');
    
    // Wait for any animations or dynamic content to complete
    setTimeout(() => {
        // Ensure all images are loaded
        const images = reportElement.querySelectorAll('img');
        let imagesLoaded = 0;
        const totalImages = images.length;
        
        if (totalImages === 0) {
            // No images, proceed directly
            generatePDF();
        } else {
            // Wait for all images to load
            images.forEach(img => {
                if (img.complete) {
                    imagesLoaded++;
                    if (imagesLoaded === totalImages) {
                        generatePDF();
                    }
                } else {
                    img.onload = () => {
                        imagesLoaded++;
                        if (imagesLoaded === totalImages) {
                            generatePDF();
                        }
                    };
                    img.onerror = () => {
                        imagesLoaded++;
                        if (imagesLoaded === totalImages) {
                            generatePDF();
                        }
                    };
                }
            });
        }
        
        function generatePDF() {
            const options = {
                margin: 10,
                filename: `RISKON_Report_${applicantId}_${applicant.personal.name.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#1f2937',
                    logging: true,
                    width: reportElement.scrollWidth,
                    height: reportElement.scrollHeight
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                }
            };
            
            html2pdf().from(reportElement).set(options).save()
                .then(() => {
                    console.log('PDF generated successfully');
                })
                .catch((error) => {
                    console.error('PDF generation failed:', error);
                    alert('Failed to generate PDF. Please try again.');
                });
        }
    }, 1000); // Wait 1 second for any animations to complete
}

// CSS improvements for better PDF rendering (add to your CSS)
const pdfStyles = `
    @media print {
        .report-container {
            background: white !important;
            color: black !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
        }
        
        .report-section {
            page-break-inside: avoid;
            margin-bottom: 20px !important;
        }
        
        .graph-container img {
            max-width: 100% !important;
            height: auto !important;
        }
        
        .score-box {
            page-break-inside: avoid;
        }
        
        .payment-history-grid {
            page-break-inside: avoid;
        }
        
        /* Hide buttons in PDF */
        button {
            display: none !important;
        }
        
        /* Ensure proper spacing */
        .section {
            margin-bottom: 30px !important;
        }
    }
`;

// Inject the CSS for better PDF rendering
function injectPDFStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = pdfStyles;
    document.head.appendChild(styleElement);
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', function() {
    injectPDFStyles();
});

// Updated createDossierReport function with better PDF preparation
function createDossierReportWithPDFSupport(applicantId) {
    const applicant = applicantsData[applicantId];
    const latestRecord = applicant.history.reduce((latest, current) => 
        (current.Month_Offset > latest.Month_Offset) ? current : latest, applicant.history[0]);
    
    // ... (keep your existing code for generating the report HTML) ...
    
    // After setting the HTML content, prepare for PDF generation
    reportContentWrapper.innerHTML = reportHTML;
    
    // Update the download button event listener to use the fixed function
    document.getElementById('download-pdf-btn').addEventListener('click', () => {
        // Use the alternative approach for better reliability
        downloadReportAsPDFAlternative(applicantId);
    });
    
    // ... (rest of your existing animation code) ...
