import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.api.endpoints import load_demo_dataset

def main():
    print("=== Seeding LegalLingo Demo Data ===")
    demo = load_demo_dataset()
    print(f"[SUCCESS] Demo Case Seeded: '{demo.title}' (ID: {demo.id})")
    print(f"  - Document Type: {demo.document_type}")
    print(f"  - State: {demo.state}")
    print(f"  - Cross-Doc Validations: {len(demo.validations)} checks")
    print(f"  - Attention Items: {len(demo.attention_report)} flags")

if __name__ == "__main__":
    main()
