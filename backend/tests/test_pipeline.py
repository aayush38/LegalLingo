import pytest
from app.services.validation import CrossDocumentValidationEngine
from app.services.rules_engine import DeterministicRulesEngine
from app.services.rag_engine import GroundedRAGEngine
from app.models.schemas import ValidationStatus

def test_cross_document_validation():
    main_fields = {
        "seller_name": "Ramesh Vithal Patil",
        "gat_number": "Gat No. 142/3A",
        "consideration_amount": 1850000,
        "advance_amount": 350000,
        "mortgage_amount": 280000,
        "balance_amount": 1220000
    }
    supporting = [
        {"document_type": "pan", "content_text": "Ramesh V. Patil"},
        {"document_type": "previous_deed", "gat_number": "Gat No. 142/3A"}
    ]
    
    validations = CrossDocumentValidationEngine.validate_document_set(main_fields, supporting)
    assert len(validations) >= 3
    
    identity_val = next(v for v in validations if v.category == "Identity")
    assert identity_val.status == ValidationStatus.REVIEW
    
    noc_val = next(v for v in validations if v.category == "NOC / Mortgage Release")
    assert noc_val.status == ValidationStatus.HIGH_ATTENTION

def test_deterministic_rules():
    main_fields = {
        "payment_deadlines": "15 September 2026",
        "mortgage_amount": 280000
    }
    validations = CrossDocumentValidationEngine.validate_document_set(main_fields, [])
    attention_items = DeterministicRulesEngine.evaluate_rules(main_fields, validations)
    
    assert len(attention_items) >= 2
    mortgage_attn = next(a for a in attention_items if "Mortgage" in a.title)
    assert mortgage_attn.severity == "HIGH_ATTENTION"

def test_rag_retrieval():
    citations = GroundedRAGEngine.query_legal_sources("mortgage property 7/12 maharashtra")
    assert len(citations) > 0
    assert any("Maharashtra Land Revenue Code" in c.title for c in citations)
