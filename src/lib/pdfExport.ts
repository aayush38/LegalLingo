import jsPDF from 'jspdf';
import { DocumentAnalysis } from './types';
import { applyPrivacyMask } from './privacy';

export function downloadLegalLingoSummaryPDF(
  analysis: DocumentAnalysis,
  privacyEnabled: boolean = false
) {
  const doc = new jsPDF();
  const title = applyPrivacyMask(analysis.documentTitle, privacyEnabled);
  const docType = analysis.documentType;

  // Header Banner
  doc.setFillColor(22, 163, 74); // Civic Green #16A34A
  doc.rect(0, 0, 210, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('LegalLingo - Simplified Document Report', 14, 18);
  doc.setFontSize(10);
  doc.text('Legal made simple. Government services made accessible.', 14, 25);

  // Metadata Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Document: ${title}`, 14, 42);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Identified Type: ${docType} (Confidence: ${analysis.classificationConfidence}%)`, 14, 49);
  doc.text(`AI Understanding Score: ${analysis.understandingScore}/100`, 14, 55);
  doc.text(`Report Generated On: ${new Date().toLocaleDateString('en-IN')}`, 14, 61);

  // Simple Summary Box
  doc.setFillColor(244, 251, 247);
  doc.roundedRect(14, 68, 182, 35, 3, 3, 'F');
  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('What is this document about?', 18, 76);

  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  const splitSummary = doc.splitTextToSize(
    applyPrivacyMask(analysis.verySimpleSummary, privacyEnabled),
    174
  );
  doc.text(splitSummary, 18, 83);

  // Important Risk & Clause Flags
  let yPos = 115;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(22, 163, 74);
  doc.text('Key Important Clauses & Risks', 14, yPos);
  yPos += 8;

  analysis.importantClauses.forEach((clause, index) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    const riskEmoji = clause.riskLevel === 'high' ? '[HIGH ATTENTION]' : clause.riskLevel === 'review' ? '[REVIEW NEEDED]' : '[STANDARD]';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(clause.riskLevel === 'high' ? 220 : 30, 38, 38);
    doc.text(`${index + 1}. ${clause.clauseTitle} ${riskEmoji}`, 14, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    const meaning = applyPrivacyMask(clause.simpleMeaning, privacyEnabled);
    const splitMeaning = doc.splitTextToSize(`Simple Meaning: ${meaning}`, 180);
    doc.text(splitMeaning, 18, yPos);
    yPos += splitMeaning.length * 5 + 4;
  });

  // Action Checklist
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(22, 163, 74);
  doc.text('Action Checklist for Citizen', 14, yPos);
  yPos += 8;

  analysis.recommendedActions.forEach((act) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);
    const maskedText = applyPrivacyMask(act.text, privacyEnabled);
    doc.text(`[  ]  ${maskedText}`, 18, yPos);
    yPos += 6;
  });

  // Footer Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(
    'Disclaimer: LegalLingo provides AI-assisted legal information for awareness. It does not constitute formal legal advice.',
    14,
    285
  );

  // Save file
  const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`LegalLingo_Report_${safeFilename}.pdf`);
}
