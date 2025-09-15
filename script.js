// COMPLETE FIX FOR PDF GENERATION ISSUES

// Step 1: Add CSS styles to prevent content cutoff
function addPDFStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* PDF-specific styles */
        .pdf-container {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-sizing: border-box !important;
            background: white !important;
            color: black !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            overflow: visible !important;
        }
        
        .pdf-container * {
            box-sizing: border-box !important;
            max-width: 100% !important;
        }
        
        .pdf-container .report-section {
            page-break-inside: avoid !important;
            margin-bottom: 15px !important;
            padding: 10px !important;
            border: 1px solid #ddd !important;
            background: white !important;
        }
        
        .pdf-container .report-section-title {
            color: #333 !important;
            font-size: 14px !important;
            font-weight: bold !important;
            margin-bottom: 10px !important;
        }
        
        .pdf-container .score-box {
            border: 2px solid #333 !important;
            padding: 15px !important;
            text-align: center !important;
            margin: 10px 0 !important;
        }
        
        .pdf-container .score-value {
            font-size: 24px !important;
            font-weight: bold !important;
            color: #333 !important;
        }
        
        .pdf-container .graph-container img {
            max-width: 100% !important;
            height: auto !important;
            display: block !important;
            margin: 10px auto !important;
        }
        
        .pdf-container .payment-history-grid {
            display: block !important;
        }
        
        .pdf-container .info-pair {
            display: block !important;
            margin-bottom: 5px !important;
            padding: 3px 0 !important;
            border-bottom: 1px dotted #ccc !important;
        }
        
        .pdf-container .label {
            font-weight: bold !important;
            color: #333 !important;
        }
        
        .pdf-container .value {
            color: #666 !important;
            margin-left: 10px !important;
        }
        
        .pdf-container button {
            display: none !important;
        }
        
        .pdf-container .grid-2-col {
            display: block !important;
        }
        
        .pdf-container .grid-2-col > div {
            width: 100% !important;
            margin-bottom: 15px !important;
        }
        
        /* Risk color classes for PDF */
        .pdf-container .risk-low { color: #28a745 !important; }
        .pdf-container .risk-medium { color: #ffc107 !important; }
        .pdf-container .risk-high { color: #dc3545 !important; }
    `;
    document.head.appendChild(style);
}

// Step 2: Create a PDF-optimized version of the report
function createPDFOptimizedReport(applicantId) {
    const applicant = applicantsData[applicantId];
    const latestRecord = applicant.history.reduce((latest, current) => 
        (current.Month_Offset > latest.Month_Offset) ? current : latest, applicant.history[0]);
    
    const prob = latestRecord.Predicted_Prob_Default;
    let cibilScore;
    if (prob <= 0.15) { cibilScore = 780 + (1 - prob/0.15) * 120; } 
    else if (prob <= 0.70) { cibilScore = 650 + (1 - (prob - 0.15)/0.55) * 130; } 
    else { cibilScore = 300 + (1 - (prob - 0.70)/0.30) * 350; }
    cibilScore = Math.round(cibilScore);

    const riskCategory = latestRecord.Risk_Category;
    const riskColorClass = riskCategory === 'Low' ? 'risk-low' : riskCategory === 'Medium' ? 'risk-medium' : 'risk-high';

    const paymentHistoryHTML = applicant.history
        .sort((a, b) => b.Month_Offset - a.Month_Offset)
        .map(h => {
            const probPercent = (h.Predicted_Prob_Default * 100).toFixed(1);
            const historyRiskColor = h.Risk_Category === 'Low' ? 'risk-low' : h.Risk_Category === 'Medium' ? 'risk-medium' : 'risk-high';
            return `<div class="info-pair"><span class="label">Month ${h.Month_Offset}:</span><span class="value ${historyRiskColor}">${probPercent}% (${h.Risk_Category})</span></div>`;
        })
        .join('');

    return `
        <div class="pdf-container">
            <div class="report-header">
                <h1 style="text-align: center; margin-bottom: 20px; color: #333;">RISKON™ Intelligence Report</h1>
                <div class="report-info" style="text-align: center; margin-bottom: 30px;">
                    <strong>Applicant ID:</strong> ${applicantId}<br>
                    <strong>Report Date:</strong> ${new Date().toLocaleDateString('en-GB')}
                </div>
            </div>
            
            <div class="report-section">
                <h3 class="report-section-title">Personal Details</h3>
                <div class="report-section-content">
                    <div class="info-pair"><span class="label">Name:</span><span class="value">${applicant.personal.name}</span></div>
                    <div class="info-pair"><span class="label">Date of Birth:</span><span class="value">${applicant.personal.dob}</span></div>
                    <div class="info-pair"><span class="label">Gender:</span><span class="value">${applicant.personal.gender}</span></div>
                </div>
            </div>
            
            <div class="report-section">
                <h3 class="report-section-title">RISKON Score</h3>
                <div class="score-box">
                    <div class="score-value ${riskColorClass}">${cibilScore}</div>
                    <div class="score-label">CIBIL Equivalent</div>
                </div>
            </div>
            
            <div class="report-section">
                <h3 class="report-section-title">RISK ANALYSIS & TRACKING</h3>
                <div class="report-section-content">
                    <div class="graph-container">
                        <img src="${applicant.graphImage}" alt="Risk Trend Graph for Applicant ${applicantId}">
                    </div>
                </div>
            </div>
            
            <div class="report-section">
                <h3 class="report-section-title">RECENT RISK HISTORY</h3>
                <div class="report-section-content">
                    <div class="payment-history-grid">
                        ${paymentHistoryHTML}
                    </div>
                </div>
            </div>
            
            ${applicant.geminiSummary ? `
            <div class="report-section">
                <h3 class="report-section-title">QUICK SUMMARY</h3>
                <div class="report-section-content">
                    <p>${applicant.geminiSummary}</p>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// Step 3: Fixed PDF download function
function downloadReportAsPDF(applicantId) {
    const applicant = applicantsData[applicantId];
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.backgroundColor = 'white';
    
    // Add PDF-optimized content
    tempContainer.innerHTML = createPDFOptimizedReport(applicantId);
    document.body.appendChild(tempContainer);
    
    // Wait for images to load
    const images = tempContainer.querySelectorAll('img');
    let imagesLoaded = 0;
    const totalImages = images.length;
    
    function checkAllImagesLoaded() {
        if (totalImages === 0 || imagesLoaded === totalImages) {
            generatePDF();
        }
    }
    
    if (totalImages > 0) {
        images.forEach(img => {
            if (img.complete && img.naturalWidth > 0) {
                imagesLoaded++;
                checkAllImagesLoaded();
            } else {
                img.onload = () => {
                    imagesLoaded++;
                    checkAllImagesLoaded();
                };
                img.onerror = () => {
                    console.warn('Failed to load image:', img.src);
                    imagesLoaded++;
                    checkAllImagesLoaded();
                };
            }
        });
    } else {
        generatePDF();
    }
    
    function generatePDF() {
        const options = {
            margin: [5, 5, 5, 5], // top, left, bottom, right in mm
            filename: `RISKON_Report_${applicantId}_${applicant.personal.name.replace(/\s+/g, '_')}.pdf`,
            image: { 
                type: 'jpeg', 
                quality: 0.95 
            },
            html2canvas: { 
                scale: 1, // Lower scale to avoid memory issues
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                width: 794, // A4 width at 96 DPI
                height: null, // Auto height
                scrollX: 0,
                scrollY: 0,
                windowWidth: 794,
                windowHeight: window.innerHeight,
                onrendered: function() {
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
                before: '.report-section',
                after: '.page-break-after',
                avoid: '.report-section'
            }
        };
        
        html2pdf()
            .set(options)
            .from(tempContainer)
            .toPdf()
            .get('pdf')
            .then(function (pdf) {
                const totalPages = pdf.internal.getNumberOfPages();
                console.log(`PDF generated successfully with ${totalPages} pages`);
                
                // Add page numbers
                for (let i = 1; i <= totalPages; i++) {
                    pdf.setPage(i);
                    pdf.setFontSize(8);
                    pdf.setTextColor(128);
                    pdf.text(`Page ${i} of ${totalPages}`, 200, 287, { align: 'right' });
                }
            })
            .save()
            .then(() => {
                console.log('PDF saved successfully');
                document.body.removeChild(tempContainer);
            })
            .catch((error) => {
                console.error('Error generating PDF:', error);
                document.body.removeChild(tempContainer);
                alert('Error generating PDF. Please try again.');
            });
    }
}

// Step 4: Alternative solution using jsPDF directly (if html2pdf still fails)
function downloadReportAsPDFAlternative(applicantId) {
    const applicant = applicantsData[applicantId];
    const latestRecord = applicant.history.reduce((latest, current) => 
        (current.Month_Offset > latest.Month_Offset) ? current : latest, applicant.history[0]);
    
    // Create PDF using jsPDF directly
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    let yPosition = 20;
    const pageHeight = 297;
    const margin = 20;
    
    function addText(text, x = margin, fontSize = 12, style = 'normal') {
        if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
        }
        
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', style);
        pdf.text(text, x, yPosition);
        yPosition += fontSize * 0.5;
    }
    
    function addSection(title, content) {
        yPosition += 10;
        addText(title, margin, 16, 'bold');
        yPosition += 5;
        
        if (Array.isArray(content)) {
            content.forEach(item => {
                addText(item, margin + 5, 11);
            });
        } else {
            addText(content, margin + 5, 11);
        }
    }
    
    // Add header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RISKON™ Intelligence Report', 105, 20, { align: 'center' });
    
    yPosition = 40;
    addText(`Applicant ID: ${applicantId}`, margin, 12, 'bold');
    addText(`Report Date: ${new Date().toLocaleDateString('en-GB')}`, margin, 12, 'bold');
    
    // Add sections
    addSection('Personal Details', [
        `Name: ${applicant.personal.name}`,
        `Date of Birth: ${applicant.personal.dob}`,
        `Gender: ${applicant.personal.gender}`
    ]);
    
    const prob = latestRecord.Predicted_Prob_Default;
    let cibilScore;
    if (prob <= 0.15) { cibilScore = 780 + (1 - prob/0.15) * 120; } 
    else if (prob <= 0.70) { cibilScore = 650 + (1 - (prob - 0.15)/0.55) * 130; } 
    else { cibilScore = 300 + (1 - (prob - 0.70)/0.30) * 350; }
    cibilScore = Math.round(cibilScore);
    
    addSection('RISKON Score', `CIBIL Equivalent: ${cibilScore}`);
    
    const historyData = applicant.history
        .sort((a, b) => b.Month_Offset - a.Month_Offset)
        .map(h => `Month ${h.Month_Offset}: ${(h.Predicted_Prob_Default * 100).toFixed(1)}% (${h.Risk_Category})`);
    
    addSection('Recent Risk History', historyData);
    
    if (applicant.geminiSummary) {
        addSection('Quick Summary', applicant.geminiSummary);
    }
    
    // Add page numbers
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Page ${i} of ${totalPages}`, 200, 287, { align: 'right' });
    }
    
    pdf.save(`RISKON_Report_${applicantId}_${applicant.personal.name.replace(/\s+/g, '_')}.pdf`);
}

// Step 5: Initialize PDF styles when page loads
document.addEventListener('DOMContentLoaded', function() {
    addPDFStyles();
});

// Step 6: Update the report creation function
function createDossierReportFixed(applicantId) {
    // Your existing createDossierReport function code...
    // Just update the download button event listener:
    
    // After creating the report HTML and adding it to reportContentWrapper:
    const downloadBtn = document.getElementById('download-pdf-btn');
    if (downloadBtn) {
        // Remove existing event listeners
        downloadBtn.replaceWith(downloadBtn.cloneNode(true));
        
        // Add new event listener
        document.getElementById('download-pdf-btn').addEventListener('click', () => {
            // Show loading state
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Generating PDF...';
            downloadBtn.disabled = true;
            
            // Try the main method first
            try {
                downloadReportAsPDF(applicantId);
            } catch (error) {
                console.error('Main PDF method failed, trying alternative:', error);
                downloadReportAsPDFAlternative(applicantId);
            } finally {
                // Reset button state after a delay
                setTimeout(() => {
                    downloadBtn.textContent = originalText;
                    downloadBtn.disabled = false;
                }, 3000);
            }
        });
    }
}
