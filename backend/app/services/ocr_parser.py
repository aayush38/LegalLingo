import io
from typing import List, Dict, Any
from pypdf import PdfReader

class OCRParserService:
    @staticmethod
    def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text page by page from PDF bytes using PyPDF.
        Surface confidence and OCR flags where needed.
        """
        pages_data = []
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            full_text_list = []
            
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages_data.append({
                    "page_number": i + 1,
                    "text": text,
                    "confidence": 0.95 if len(text.strip()) > 50 else 0.60
                })
                full_text_list.append(text)
                
            full_text = "\n\n".join(full_text_list)
            is_scanned = len(full_text.strip()) < 100
            
            return {
                "full_text": full_text,
                "pages": pages_data,
                "is_scanned": is_scanned,
                "overall_confidence": 0.60 if is_scanned else 0.95,
                "requires_user_verification": is_scanned
            }
        except Exception as e:
            return {
                "full_text": "",
                "pages": [],
                "error": str(e),
                "overall_confidence": 0.0,
                "requires_user_verification": True
            }

    @staticmethod
    def extract_text_from_plain_text(raw_text: str) -> Dict[str, Any]:
        return {
            "full_text": raw_text,
            "pages": [{"page_number": 1, "text": raw_text, "confidence": 0.98}],
            "is_scanned": False,
            "overall_confidence": 0.98,
            "requires_user_verification": False
        }
