// BULLETPROOF PDF GENERATION - Multiple fallback methods

// Method 1: Manual jsPDF creation (Most reliable)
function generatePDFManually(applicantId) {
    const applicant = applicantsData[applicantId];
    const latestRecord = applicant.history.reduce((latest, current) => 
        (current.Month_Offset > latest.Month_Offset) ? current : latest, applicant.history[0]);
    
    // Calculate CIBIL score
    const prob = latestRecord.Predicted_Prob_Default;
    let cibilScore;
    if (prob <= 0.15) { cibilScore = 780 + (1 - prob/0.15) * 120; } 
    else if (prob <= 0.70) { cibilScore = 650 + (1 - (prob - 0.15)/0.55) * 130; } 
    else { cibilScore = 300 + (1 - (prob - 0.70)/0.30) * 350; }
    cibilScore = Math.round(cibilScore);

    const riskCategory = latestRecord.Risk_Category;
    const riskColor = riskCategory === 'Low' ? [40, 167, 69] : 
                     riskCategory === 'Medium' ? [255, 193, 7] : [220, 53, 69];

    // Create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // Helper functions
    function checkPageBreak(neededHeight = 20) {
        if (currentY + neededHeight > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
            return true;
        }
        return false;
    }

    function addTitle(text, fontSize = 16, color = [0, 0, 0]) {
        checkPageBreak(fontSize);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        doc.setFont('helvetica', 'bold');
        doc.text(text, pageWidth / 2, currentY, { align: 'center' });
        currentY += fontSize * 0.8;
    }

    function addSubtitle(text, fontSize = 14, color = [51, 51, 51]) {
        checkPageBreak(fontSize);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        doc.setFont('helvetica', 'bold');
        doc.text(text, margin, currentY);
        currentY += fontSize * 0.8;
    }

    function addText(text, fontSize = 11, indent = 0, color = [51, 51, 51]) {
        checkPageBreak(fontSize);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        doc.setFont('helvetica', 'normal');
        
        // Handle long text with wrapping
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        lines.forEach(line => {
            checkPageBreak(fontSize);
            doc.text(line, margin + indent, currentY);
            currentY += fontSize * 0.6;
        });
    }

    function addKeyValue(key, value, fontSize = 11) {
        checkPageBreak(fontSize * 2);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 51, 51);
        doc.text(key + ':', margin + 5, currentY);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(85, 85, 85);
        doc.text(value, margin + 60, currentY);
        currentY += fontSize * 0.8;
    }

    function addBox(x, y, width, height, borderColor = [200, 200, 200]) {
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.5);
        doc.rect(x, y, width, height);
    }

    function addSection() {
        currentY += 8;
        addBox(margin, currentY - 5, contentWidth, 1, [220, 220, 220]);
        currentY += 5;
    }

    // Start building PDF
    // Header
    addTitle('RISKON™ INTELLIGENCE REPORT', 20, [59, 130, 246]);
    currentY += 5;
    
    // Report info box
    const infoBoxY = currentY;
    addBox(margin, currentY, contentWidth, 25, [200, 200, 200]);
    currentY += 8;
    addText(`Applicant ID: ${applicantId}`, 12, 10, [0, 0, 0]);
    addText(`Report Date: ${new Date().toLocaleDateString('en-GB')}`, 12, 10, [0, 0, 0]);
    addText(`Risk Category: ${riskCategory}`, 12, 10, riskColor);
    currentY = infoBoxY + 30;

    addSection();

    // Personal Details Section
    addSubtitle('PERSONAL DETAILS');
    addKeyValue('Name', applicant.personal.name);
    addKeyValue('Date of Birth', applicant.personal.dob);
    addKeyValue('Gender', applicant.personal.gender);

    addSection();

    // RISKON Score Section
    addSubtitle('RISKON SCORE');
    
    // Score box
    const scoreBoxX = margin + 20;
    const scoreBoxY = currentY;
    const scoreBoxWidth = 60;
    const scoreBoxHeight = 40;
    
    addBox(scoreBoxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, riskColor);
    
    // Score value
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...riskColor);
    doc.text(cibilScore.toString(), scoreBoxX + scoreBoxWidth/2, scoreBoxY + 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(85, 85, 85);
    doc.text('CIBIL Equivalent', scoreBoxX + scoreBoxWidth/2, scoreBoxY + 35, { align: 'center' });
    
    currentY = scoreBoxY + scoreBoxHeight + 10;

    addSection();

    // Risk Analysis Section
    addSubtitle('RISK ANALYSIS');
    addText('Current Risk Probability: ' + (prob * 100).toFixed(2) + '%', 12, 5, riskColor);
    addText('Risk assessment based on historical payment patterns and financial behavior.', 11, 5);

    // Add graph placeholder (since we can't easily embed images)
    checkPageBreak(50);
    addBox(margin + 10, currentY, contentWidth - 20, 40, [200, 200, 200]);
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('Risk Trend Graph', pageWidth/2, currentY + 22, { align: 'center' });
    doc.text('(Visual representation of risk over time)', pageWidth/2, currentY + 32, { align: 'center' });
    currentY += 50;

    addSection();

    // Payment History Section
    addSubtitle('RECENT RISK HISTORY');
    
    // Table header
    checkPageBreak(30);
    const tableY = currentY;
    const col1X = margin + 5;
    const col2X = margin + 80;
    const col3X = margin + 140;
    const rowHeight = 8;
    
    // Header row
    addBox(margin, currentY, contentWidth, rowHeight, [100, 100, 100]);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Period', col1X, currentY + 6);
    doc.text('Risk Probability', col2X, currentY + 6);
    doc.text('Category', col3X, currentY + 6);
    currentY += rowHeight;
    
    // Data rows
    applicant.history
        .sort((a, b) => b.Month_Offset - a.Month_Offset)
        .slice(0, 10) // Limit to 10 most recent records
        .forEach((record, index) => {
            checkPageBreak(rowHeight + 2);
            
            if (index % 2 === 0) {
                doc.setFillColor(250, 250, 250);
                doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
            }
            
            addBox(margin, currentY, contentWidth, rowHeight, [220, 220, 220]);
            
            const recordRiskColor = record.Risk_Category === 'Low' ? [40, 167, 69] : 
                                   record.Risk_Category === 'Medium' ? [255, 193, 7] : [220, 53, 69];
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 51, 51);
            doc.text(`Month ${record.Month_Offset}`, col1X, currentY + 6);
            doc.text(`${(record.Predicted_Prob_Default * 100).toFixed(1)}%`, col2X, currentY + 6);
            
            doc.setTextColor(...recordRiskColor);
            doc.text(record.Risk_Category, col3X, currentY + 6);
            
            currentY += rowHeight;
        });

    addSection();

    // Summary Section (if available)
    if (applicant.geminiSummary) {
        addSubtitle('EXECUTIVE SUMMARY');
        addText(applicant.geminiSummary, 11, 5);
    }

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`RISKON™ Report - Confidential`, margin, pageHeight - 10);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Save the PDF
    doc.save(`RISKON_Report_${applicantId}_${applicant.personal.name.replace(/\s+/g, '_')}.pdf`);
    console.log('PDF generated successfully using manual jsPDF method');
}

// Method 2: Canvas-based approach (Fallback)
function generatePDFFromCanvas(applicantId) {
    const reportElement = document.getElementById('report-page-container');
    if (!reportElement) {
        console.error('Report element not found');
        return;
    }

    // Create a canvas from the element
    html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportElement.scrollWidth,
        height: reportElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        onrendered: function() {
            console.log('Canvas rendered');
        }
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add additional pages if needed
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const applicant = applicantsData[applicantId];
        pdf.save(`RISKON_Report_${applicantId}_${applicant.personal.name.replace(/\s+/g, '_')}.pdf`);
        console.log('PDF generated successfully using canvas method');
    }).catch(error => {
        console.error('Canvas generation failed:', error);
        // Fall back to manual method
        generatePDFManually(applicantId);
    });
}

// Method 3: Print-based approach (Last resort)
function generatePDFFromPrint(applicantId) {
    const applicant = applicantsData[applicantId];
    const reportElement = document.getElementById('report-page-container');
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>RISKON Report - ${applicantId}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    background: white; 
                    color: black; 
                }
                .report-container { 
                    max-width: 100%; 
                    background: white; 
                    color: black; 
                }
                .report-section { 
                    margin-bottom: 20px; 
                    page-break-inside: avoid; 
                    border: 1px solid #ddd;
                    padding: 15px;
                    background: white;
                }
                .report-section-title { 
                    font-size: 16px; 
                    font-weight: bold; 
                    color: #333; 
                    margin-bottom: 10px;
                }
                .score-value { 
                    font-size: 24px; 
                    font-weight: bold; 
                    text-align: center;
                    border: 2px solid #333;
                    padding: 20px;
                    margin: 10px 0;
                }
                .info-pair { 
                    margin-bottom: 5px; 
                    padding: 3px 0;
                    border-bottom: 1px dotted #ccc;
                }
                .label { 
                    font-weight: bold; 
                }
                .value { 
                    margin-left: 20px; 
                }
                .risk-low { color: #28a745; }
                .risk-medium { color: #ffc107; }
                .risk-high { color: #dc3545; }
                button { display: none; }
                @media print {
                    body { margin: 0; }
                    .report-section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            ${reportElement.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    printWindow.onload = function() {
        printWindow.print();
        setTimeout(() => {
            printWindow.close();
        }, 1000);
    };
    
    alert('Please use your browser\'s print dialog to save as PDF');
}

// Main download function with multiple fallbacks
function downloadReportAsPDF(applicantId) {
    const applicant = applicantsData[applicantId];
    
    console.log('Starting PDF generation for applicant:', applicantId);
    
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        alert('PDF library not loaded. Please refresh the page and try again.');
        return;
    }
    
    // Show loading state
    const downloadBtn = document.getElementById('download-pdf-btn');
    if (downloadBtn) {
        downloadBtn.textContent = 'Generating PDF...';
        downloadBtn.disabled = true;
    }
    
    try {
        // Try Method 1: Manual jsPDF (most reliable)
        generatePDFManually(applicantId);
    } catch (error) {
        console.error('Manual PDF generation failed:', error);
        
        try {
            // Try Method 2: Canvas-based
            generatePDFFromCanvas(applicantId);
        } catch (error2) {
            console.error('Canvas PDF generation failed:', error2);
            
            // Try Method 3: Print-based (last resort)
            generatePDFFromPrint(applicantId);
        }
    }
    
    // Reset button state
    setTimeout(() => {
        if (downloadBtn) {
            downloadBtn.textContent = 'Download as PDF';
            downloadBtn.disabled = false;
        }
    }, 3000);
}

// Make sure jsPDF is loaded
function ensureJsPDFLoaded() {
    if (typeof window.jspdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = function() {
            console.log('jsPDF loaded successfully');
        };
        script.onerror = function() {
            console.error('Failed to load jsPDF');
        };
        document.head.appendChild(script);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    ensureJsPDFLoaded();
});
