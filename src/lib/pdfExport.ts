import jsPDF from 'jspdf';
import { DocumentAnalysis } from './types';
import { LanguageCode } from './types';
import { applyPrivacyMask } from './privacy';
import { getTranslatedExplanation } from './ai';
import { getTranslation } from './translations';

interface FontConfig {
  url: string;
  vfsName: string;
  fontName: string;
}

// Noto Sans Devanagari covers Hindi and Marathi; Noto Sans Gujarati covers Gujarati.
// jsPDF's built-in fonts only support Latin/WinAnsi glyphs, so Indic-script text
// must be rendered with an embedded Unicode font or it comes out as garbage.
const FONT_CONFIG: Partial<Record<LanguageCode, FontConfig>> = {
  hi: { url: '/fonts/NotoSansDevanagari.ttf', vfsName: 'NotoSansDevanagari.ttf', fontName: 'NotoSansDevanagari' },
  mr: { url: '/fonts/NotoSansDevanagari.ttf', vfsName: 'NotoSansDevanagari.ttf', fontName: 'NotoSansDevanagari' },
  gu: { url: '/fonts/NotoSansGujarati.ttf', vfsName: 'NotoSansGujarati.ttf', fontName: 'NotoSansGujarati' }
};

async function fetchFontBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch font: ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadLegalLingoSummaryPDF(
  analysis: DocumentAnalysis,
  privacyEnabled: boolean = false,
  language: LanguageCode = 'en',
  translationCache: Record<string, string> = {}
) {
  const doc = new jsPDF();
  const t = (text: string) => applyPrivacyMask(getTranslatedExplanation(text, language, translationCache), privacyEnabled);
  const tr = (key: string) => getTranslation(key, language);

  let fontFamily = 'helvetica';
  const fontConfig = FONT_CONFIG[language];
  if (fontConfig) {
    try {
      const base64 = await fetchFontBase64(fontConfig.url);
      doc.addFileToVFS(fontConfig.vfsName, base64);
      doc.addFont(fontConfig.vfsName, fontConfig.fontName, 'normal');
      doc.addFont(fontConfig.vfsName, fontConfig.fontName, 'bold');
      fontFamily = fontConfig.fontName;
    } catch (e) {
      console.warn('Failed to load PDF Unicode font, falling back to Helvetica:', e);
    }
  }
  doc.setFont(fontFamily, 'normal');

  const title = applyPrivacyMask(analysis.documentTitle, privacyEnabled);
  const docType = t(analysis.documentType);

  // Header Banner
  doc.setFillColor(22, 163, 74); // Civic Green #16A34A
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(tr('pdfReportTitle'), 14, 18);
  doc.setFontSize(10);
  doc.text(tr('navTagline'), 14, 25);

  // Metadata Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont(fontFamily, 'bold');
  doc.text(`${tr('pdfDocumentLabel')}: ${title}`, 14, 42);

  doc.setFont(fontFamily, 'normal');
  doc.setFontSize(10);
  doc.text(`${tr('pdfIdentifiedTypeLabel')}: ${docType} (${tr('confidenceSuffix')}: ${analysis.classificationConfidence}%)`, 14, 49);
  doc.text(`${tr('understandingScore')}: ${analysis.understandingScore}/100`, 14, 55);
  doc.text(`${tr('pdfReportGeneratedLabel')}: ${new Date().toLocaleDateString('en-IN')}`, 14, 61);

  // Simple Summary Box
  doc.setFillColor(244, 251, 247);
  doc.roundedRect(14, 68, 182, 35, 3, 3, 'F');
  doc.setTextColor(6, 78, 59);
  doc.setFont(fontFamily, 'bold');
  doc.text(tr('summaryTitle'), 18, 76);

  doc.setTextColor(31, 41, 55);
  doc.setFont(fontFamily, 'normal');
  const splitSummary = doc.splitTextToSize(t(analysis.verySimpleSummary), 174);
  doc.text(splitSummary, 18, 83);

  // Important Risk & Clause Flags
  let yPos = 115;
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(22, 163, 74);
  doc.text(tr('pdfKeyClausesLabel'), 14, yPos);
  yPos += 8;

  const riskTags: Record<string, string> = {
    high: `[${tr('pdfHighAttentionTag')}]`,
    review: `[${tr('pdfReviewNeededTag')}]`,
    standard: `[${tr('pdfStandardTag')}]`
  };

  analysis.importantClauses.forEach((clause, index) => {
    if (yPos > 260) {
      doc.addPage();
      doc.setFont(fontFamily, 'normal');
      yPos = 20;
    }
    const riskTag = riskTags[clause.riskLevel] || riskTags.standard;
    doc.setFont(fontFamily, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(clause.riskLevel === 'high' ? 220 : 30, 38, 38);
    doc.text(`${index + 1}. ${t(clause.clauseTitle)} ${riskTag}`, 14, yPos);
    yPos += 6;

    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    const meaning = t(clause.simpleMeaning);
    const splitMeaning = doc.splitTextToSize(`${tr('simpleMeaning')}: ${meaning}`, 180);
    doc.text(splitMeaning, 18, yPos);
    yPos += splitMeaning.length * 5 + 4;
  });

  // Action Checklist
  if (yPos > 240) {
    doc.addPage();
    doc.setFont(fontFamily, 'normal');
    yPos = 20;
  }
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(13);
  doc.setTextColor(22, 163, 74);
  doc.text(tr('pdfActionChecklistLabel'), 14, yPos);
  yPos += 8;

  analysis.recommendedActions.forEach((act) => {
    if (yPos > 270) {
      doc.addPage();
      doc.setFont(fontFamily, 'normal');
      yPos = 20;
    }
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(31, 41, 55);
    const actionText = t(act.text);
    doc.text(`[  ]  ${actionText}`, 18, yPos);
    yPos += 6;
  });

  // Footer Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const disclaimerLine = doc.splitTextToSize(`${tr('pdfDisclaimerLabel')}: ${tr('disclaimerText')}`, 182);
  doc.text(disclaimerLine, 14, 285 - (disclaimerLine.length - 1) * 4);

  // Save file
  const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`LegalLingo_Report_${safeFilename}.pdf`);
}
