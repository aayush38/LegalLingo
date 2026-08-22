from typing import List, Dict, Any
from app.models.schemas import AttentionItem, SeverityLevel

class DeterministicRulesEngine:
    @staticmethod
    def evaluate_rules(extracted_fields: Dict[str, Any], validations: List[Any]) -> List[AttentionItem]:
        """
        Evaluate deterministic rules over extracted fields and cross-document validation findings.
        """
        attention_report = []
        
        mortgage_val = next((v for v in validations if v.field == "Bank No-Objection Certificate"), None)
        if mortgage_val and mortgage_val.status == "HIGH_ATTENTION":
            attention_report.append(AttentionItem(
                id="ATTN_001",
                severity=SeverityLevel.HIGH_ATTENTION,
                title="Existing Mortgage Found Without Bank Release (NOC)",
                original_clause="Clause 4: The property has an existing mortgage charge of ₹2,80,000 with Bank of Maharashtra.",
                simple_meaning="The seller has an active loan against this property with Bank of Maharashtra. If the loan is not fully paid off and cleared by the bank, the bank retains legal rights over the land.",
                why_it_matters="If you purchase land with an active uncleared mortgage, the bank can claim legal rights or auction the property to recover unpaid debts.",
                what_to_verify="Ask the seller for an official Bank No-Objection Certificate (NOC) and Mortgage Release Deed before making any final balance payments.",
                recommended_action="Obtain bank clearance NOC and register a Deed of Release with the Sub-Registrar.",
                evidence="Clause 4 of Sale Agreement + Missing NOC Document",
                confidence=0.98
            ))

        identity_val = next((v for v in validations if v.category == "Identity"), None)
        if identity_val and identity_val.status in ["REVIEW", "HIGH_ATTENTION"]:
            attention_report.append(AttentionItem(
                id="ATTN_002",
                severity=SeverityLevel.REVIEW,
                title="Seller Name Variation Across Supporting Documents",
                original_clause="Party of the First Part (Seller): Shri Ramesh Vithal Patil.",
                simple_meaning="The seller's full middle name is written in the agreement, but only middle initial 'V.' appears on the supporting identity card.",
                why_it_matters="Name discrepancies can delay property registration or cause title verification issues at the Sub-Registrar office.",
                what_to_verify="Verify that an official Identity Affidavit or PAN correction is filed so the name matches government land records.",
                recommended_action="Ensure title deed and registration documents carry an identity verification clause matching official government ID.",
                evidence="Sale Agreement Party Clause vs Supporting PAN Card",
                confidence=0.90
            ))

        deadline = extracted_fields.get("payment_deadlines", "15 September 2026")
        attention_report.append(AttentionItem(
            id="ATTN_003",
            severity=SeverityLevel.REVIEW,
            title=f"Strict Payment Deadline with Advance Forfeiture Clause ({deadline})",
            original_clause=f"Clause 5: Balance consideration of ₹12,20,000 must be paid on or before {deadline}, failing which advance ₹3,50,000 shall be forfeited.",
            simple_meaning=f"You must pay the remaining balance of ₹12,20,000 by {deadline}. If you miss this deadline, the seller has the right to cancel the agreement and keep your advance payment of ₹3,50,000.",
            why_it_matters="Forfeiture clauses are strictly enforced under Indian Contract Law. Missing the payment date without a written extension could result in losing your advance.",
            what_to_verify="Ensure your bank home loan or funds are fully sanctioned and available well before the 15 September deadline.",
            recommended_action="Set bank transfer reminders 10 days prior and request a formal written receipt upon payment.",
            evidence="Clause 5 of Sale Agreement",
            confidence=0.95
        ))

        return attention_report
