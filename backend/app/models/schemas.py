from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class DocumentRole(str, Enum):
    MAIN = "main"
    SUPPORTING = "supporting"

class DocumentType(str, Enum):
    SALE_AGREEMENT = "sale_agreement"
    PAN = "pan"
    NOC = "noc"
    PREVIOUS_DEED = "previous_deed"
    PROPERTY_RECORD = "property_record"
    RECEIPT = "receipt"
    OTHER = "other"

class ValidationStatus(str, Enum):
    CONSISTENT = "CONSISTENT"
    REVIEW = "REVIEW"
    HIGH_ATTENTION = "HIGH_ATTENTION"

class SeverityLevel(str, Enum):
    STANDARD = "STANDARD"
    REVIEW = "REVIEW"
    HIGH_ATTENTION = "HIGH_ATTENTION"

class DocumentCreate(BaseModel):
    title: str
    role: DocumentRole = DocumentRole.MAIN
    document_type: DocumentType = DocumentType.SALE_AGREEMENT
    content_text: Optional[str] = None

class DocumentSetCreate(BaseModel):
    title: str
    state: str = "Maharashtra"
    language: str = "en"
    documents: List[DocumentCreate] = []

class ExtractedField(BaseModel):
    field_name: str
    value: Any
    normalized_value: Optional[str] = None
    source_document_id: str
    page: int = 1
    confidence: float = 0.9
    raw_evidence: str = ""

class Clause(BaseModel):
    id: str
    category: str
    text: str
    simple_meaning: Optional[str] = None
    why_it_matters: Optional[str] = None
    what_to_verify: Optional[str] = None
    page: int = 1
    confidence: float = 0.9

class ValidationResult(BaseModel):
    id: str
    category: str  # Identity, Property, Financial, NOC
    field: str
    source_a: str
    source_b: str
    status: ValidationStatus
    reason: str
    confidence: float = 0.95

class AttentionItem(BaseModel):
    id: str
    severity: SeverityLevel
    title: str
    original_clause: str
    simple_meaning: str
    why_it_matters: str
    what_to_verify: str
    recommended_action: str
    evidence: str
    confidence: float = 0.9

class LegalSourceCitation(BaseModel):
    doc_id: str
    title: str
    jurisdiction: str
    issuing_authority: str
    source_type: str = "dataset"
    verification_status: str = "dataset_only"
    similarity: float = 0.85
    excerpt: str = ""

class DocumentCompleteness(BaseModel):
    identity_score: int = 80
    property_score: int = 90
    financial_score: int = 85
    clauses_score: int = 90
    witnesses_score: int = 70
    registration_score: int = 75
    overall_score: int = 82
    missing_items: List[str] = []

class AnalysisResponse(BaseModel):
    id: str
    title: str
    document_type: str = "Sale Agreement"
    confidence: float = 0.95
    state: str = "Maharashtra"
    language: str = "en"
    created_at: str
    status: str = "completed"
    
    summary: str
    simple_explanation: str
    
    citizen_summary: Dict[str, Any]
    
    extracted_fields: List[ExtractedField] = []
    clauses: List[Clause] = []
    validations: List[ValidationResult] = []
    attention_report: List[AttentionItem] = []
    legal_citations: List[LegalSourceCitation] = []
    completeness: DocumentCompleteness = DocumentCompleteness()
    
    difficult_words: List[Dict[str, str]] = []
    check_items: List[Dict[str, str]] = []

class ClauseQuestionRequest(BaseModel):
    document_set_id: str
    clause_id: str
    question: str
    language: str = "en"

class ClauseQuestionResponse(BaseModel):
    clause_id: str
    question: str
    answer: str
    grounded: bool = True
    supporting_citations: List[LegalSourceCitation] = []
    confidence: float = 0.9
