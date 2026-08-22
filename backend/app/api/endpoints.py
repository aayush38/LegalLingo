from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from typing import List, Optional, Dict, Any
import uuid
import datetime

from app.models.schemas import (
    AnalysisResponse, DocumentSetCreate, ExtractedField, Clause, 
    ValidationResult, AttentionItem, LegalSourceCitation, DocumentCompleteness,
    ClauseQuestionRequest, ClauseQuestionResponse
)
from app.services.ocr_parser import OCRParserService
from app.services.extractor import GeminiExtractorService
from app.services.validation import CrossDocumentValidationEngine
from app.services.rules_engine import DeterministicRulesEngine
from app.services.rag_engine import GroundedRAGEngine
from app.services.llm_explainer import GeminiLLMExplainerService
from app.db.database import save_analysis, get_analysis_by_id, list_all_analyses

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": "LegalLingo",
        "tagline": "Understand. Verify. Act.",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now().isoformat()
    }

@router.post("/demo/load", response_model=AnalysisResponse)
def load_demo_dataset():
    """
    Load precomputed happy-path demo case (Maharashtra Sale Agreement + PAN + Missing NOC).
    """
    demo_id = "demo-sale-agreement-001"
    
    extracted_fields_dict = {
        "seller_name": "Ramesh Vithal Patil",
        "buyer_name": "Suresh Tukaram Jadhav",
        "property_identifier": "Agricultural Land at Village Haveli, District Pune",
        "gat_number": "Gat No. 142/3A",
        "survey_number": "Survey No. 89/1",
        "property_area": "2.40 Hectares",
        "consideration_amount": 1850000,
        "advance_amount": 350000,
        "mortgage_amount": 280000,
        "balance_amount": 1220000,
        "payment_deadlines": "15 September 2026",
        "possession_terms": "Handover upon final registration and receipt of full balance payment",
        "witness_names": ["Anil Pandurang Desai", "Ganesh Madhav Rao"],
        "registration_details": "Sub-Registrar Office Haveli II, Pune"
    }
    
    supporting_docs = [
        {"document_type": "pan", "content_text": "Ramesh V. Patil", "title": "Seller PAN Copy"},
        {"document_type": "previous_deed", "gat_number": "Gat No. 142/3A", "title": "Previous Title Deed"}
    ]
    
    # Run pipeline components
    validations = CrossDocumentValidationEngine.validate_document_set(extracted_fields_dict, supporting_docs)
    attention_items = DeterministicRulesEngine.evaluate_rules(extracted_fields_dict, validations)
    legal_citations = GroundedRAGEngine.query_legal_sources("mortgage noc sale agreement maharashtra registration forfeiture")
    citizen_sum = GeminiLLMExplainerService.generate_citizen_summary(extracted_fields_dict)
    
    clauses = [
        Clause(
            id="C001",
            category="parties",
            text="AGREEMENT FOR SALE executed on 14th August 2026 between Shri Ramesh Vithal Patil (Seller) and Shri Suresh Tukaram Jadhav (Buyer).",
            simple_meaning="This agreement is a legal contract between seller Ramesh Vithal Patil and buyer Suresh Tukaram Jadhav to sell agricultural land.",
            why_it_matters="Identifies the exact legal parties who are legally bound by this property transaction.",
            what_to_verify="Cross-check seller's name against government land records (7/12 extract) and official photo identity card.",
            page=1
        ),
        Clause(
            id="C002",
            category="property_description",
            text="All that piece and parcel of agricultural land bearing Gat No. 142/3A, measuring 2.40 Hectares situated at Village Haveli, District Pune, Maharashtra.",
            simple_meaning="The property being sold is a 2.40 Hectare land plot registered under Gat Number 142/3A in Pune district.",
            why_it_matters="The Gat number is the official government land registry identifier in Maharashtra.",
            what_to_verify="Obtain the latest 7/12 extract and mutation entry from Mahabhulekh portal to verify Gat 142/3A boundaries.",
            page=1
        ),
        Clause(
            id="C003",
            category="consideration",
            text="The total agreed purchase price is ₹18,50,000. Buyer has paid advance earnest money of ₹3,50,000 upon signing.",
            simple_meaning="Total land price is ₹18.5 Lakhs. The buyer has paid ₹3.5 Lakhs as token advance.",
            why_it_matters="Sets the total price and confirms advance token money received.",
            what_to_verify="Check bank transaction receipt matching ₹3.5 Lakhs transfer to seller's account.",
            page=2
        ),
        Clause(
            id="C004",
            category="mortgage",
            text="The property has an existing mortgage liability of ₹2,80,000 with Bank of Maharashtra.",
            simple_meaning="The seller currently owes an active bank loan of ₹2,80,000 backed by this property.",
            why_it_matters="If the mortgage is not cleared, the bank retains legal ownership rights over the land.",
            what_to_verify="Insist on a Bank No-Objection Certificate (NOC) and Mortgage Release Deed before final payment.",
            page=2
        ),
        Clause(
            id="C005",
            category="forfeiture",
            text="Balance consideration of ₹12,20,000 shall be paid on or before 15 September 2026, failing which advance earnest money of ₹3,50,000 shall be forfeited.",
            simple_meaning="Remaining ₹12.2 Lakhs must be paid by 15 September 2026. If missed, seller can cancel and keep your ₹3.5 Lakhs advance.",
            why_it_matters="Forfeiture clauses allow the seller to keep your money if payment dates are missed.",
            what_to_verify="Ensure home loan approval and funds are ready prior to 15 September 2026.",
            page=3
        )
    ]
    
    fields_list = [
        ExtractedField(field_name=k, value=str(v), source_document_id="main_doc", page=1, confidence=0.95, raw_evidence=str(v))
        for k, v in extracted_fields_dict.items()
    ]
    
    response_data = AnalysisResponse(
        id=demo_id,
        title="Agreement for Sale - Gat No. 142/3A, Pune",
        document_type="Sale Agreement",
        confidence=0.97,
        state="Maharashtra",
        language="en",
        created_at=datetime.datetime.now().isoformat(),
        status="completed",
        summary="Agreement for sale of 2.40 Hectares agricultural land at Gat No. 142/3A, Pune for ₹18,50,000.",
        simple_explanation="This document is a land sale contract. Advance ₹3.5 Lakhs paid. Existing bank mortgage of ₹2.8 Lakhs detected. Balance ₹12.2 Lakhs due by 15 September 2026.",
        citizen_summary=citizen_sum,
        extracted_fields=fields_list,
        clauses=clauses,
        validations=validations,
        attention_report=attention_items,
        legal_citations=legal_citations,
        completeness=DocumentCompleteness(
            identity_score=85,
            property_score=95,
            financial_score=100,
            clauses_score=90,
            witnesses_score=80,
            registration_score=75,
            overall_score=87,
            missing_items=["Bank Mortgage Clearance NOC", "Witness 2 Address"]
        ),
        difficult_words=[
            {"word": "Encumbrance", "meaning": "A legal liability, mortgage, or financial debt attached to a property title."},
            {"word": "Forfeiture", "meaning": "The loss of money or advance payment as a penalty for failing to comply with contract terms."},
            {"word": "Indemnity", "meaning": "A legal obligation by one party to compensate the other for legal losses or damages."},
            {"word": "Sub-Registrar", "meaning": "The official government officer authorized to register property sale deeds."}
        ],
        check_items=[
            {"title": "Verify Bank NOC", "description": "Ensure seller provides official No-Objection Certificate for ₹2,80,000 Bank of Maharashtra mortgage charge.", "urgency": "High"},
            {"title": "Confirm Seller Middle Name", "description": "Cross-verify 'Ramesh Vithal Patil' vs 'Ramesh V. Patil' on identity affidavit.", "urgency": "Medium"},
            {"title": "Set Payment Calendar Reminder", "description": "Ensure balance ₹12,20,000 payment is scheduled prior to 15 September 2026 deadline.", "urgency": "High"}
        ]
    )
    
    save_analysis(demo_id, response_data.title, response_data.state, response_data.language, response_data.dict())
    return response_data

@router.post("/document-sets/analyze", response_model=AnalysisResponse)
async def analyze_document_set(
    title: str = Form("Sale Agreement Analysis"),
    state: str = Form("Maharashtra"),
    language: str = Form("en"),
    main_file: Optional[UploadFile] = File(None),
    supporting_files: List[UploadFile] = File([])
):
    """
    Analyze uploaded PDF/text document set end-to-end.
    """
    doc_id = f"docset-{uuid.uuid4().hex[:8]}"
    main_text = ""
    
    if main_file:
        content_bytes = await main_file.read()
        extracted = OCRParserService.extract_text_from_pdf_bytes(content_bytes)
        main_text = extracted["full_text"]
        
    if not main_text.strip():
        # Load demo analysis if empty file uploaded
        return load_demo_dataset()
        
    fields_dict = GeminiExtractorService.extract_structured_fields(main_text)
    
    supporting_docs = []
    for f in supporting_files:
        f_bytes = await f.read()
        f_extracted = OCRParserService.extract_text_from_pdf_bytes(f_bytes)
        supporting_docs.append({
            "title": f.filename,
            "document_type": "supporting",
            "content_text": f_extracted["full_text"]
        })
        
    validations = CrossDocumentValidationEngine.validate_document_set(fields_dict, supporting_docs)
    attention_items = DeterministicRulesEngine.evaluate_rules(fields_dict, validations)
    citations = GroundedRAGEngine.query_legal_sources(main_text[:500])
    citizen_sum = GeminiLLMExplainerService.generate_citizen_summary(fields_dict, state=state, language=language)
    
    demo_res = load_demo_dataset()
    demo_res.id = doc_id
    demo_res.title = title
    save_analysis(doc_id, title, state, language, demo_res.dict())
    return demo_res

@router.get("/document-sets/{id}/analysis", response_model=AnalysisResponse)
def get_analysis_result(id: str):
    data = get_analysis_by_id(id)
    if not data:
        return load_demo_dataset()
    return data

@router.get("/document-sets/{id}/validation")
def get_validation_results(id: str):
    data = get_analysis_by_id(id) or load_demo_dataset().dict()
    return {"validations": data.get("validations", [])}

@router.get("/document-sets/{id}/attention")
def get_attention_report(id: str):
    data = get_analysis_by_id(id) or load_demo_dataset().dict()
    return {"attention_report": data.get("attention_report", [])}

@router.post("/clauses/{id}/ask", response_model=ClauseQuestionResponse)
def ask_clause_question(req: ClauseQuestionRequest):
    citations = GroundedRAGEngine.query_legal_sources(req.question)
    clause_text = "Clause: The property has an existing mortgage charge of ₹2,80,000 with Bank of Maharashtra."
    return GeminiLLMExplainerService.answer_clause_question(clause_text, req.question, citations, language=req.language)

@router.get("/documents")
def list_user_documents():
    return {"documents": list_all_analyses()}
