import sqlite3
import json
import os
from typing import Dict, Any, Optional, List

DB_FILE = os.path.join(os.path.dirname(__file__), "legallingo.db")

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Document sets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_sets (
                id TEXT PRIMARY KEY,
                title TEXT,
                state TEXT,
                language TEXT,
                status TEXT,
                created_at TEXT,
                analysis_json TEXT
            )
        """)
        
        # Legal sources vector corpus
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS legal_chunks (
                id TEXT PRIMARY KEY,
                doc_id TEXT,
                title TEXT,
                jurisdiction TEXT,
                issuing_authority TEXT,
                content TEXT,
                embedding_json TEXT
            )
        """)
        
        conn.commit()

init_db()

def save_analysis(doc_set_id: str, title: str, state: str, language: str, analysis_dict: Dict[str, Any]):
    import datetime
    now_str = datetime.datetime.now().isoformat()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO document_sets (id, title, state, language, status, created_at, analysis_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (doc_set_id, title, state, language, "completed", now_str, json.dumps(analysis_dict)))
        conn.commit()

def get_analysis_by_id(doc_set_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT analysis_json FROM document_sets WHERE id = ?", (doc_set_id,))
        row = cursor.fetchone()
        if row and row["analysis_json"]:
            return json.loads(row["analysis_json"])
    return None

def list_all_analyses() -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, state, language, status, created_at, analysis_json FROM document_sets ORDER BY created_at DESC")
        rows = cursor.fetchall()
        results = []
        for r in rows:
            data = json.loads(r["analysis_json"]) if r["analysis_json"] else {}
            results.append({
                "id": r["id"],
                "title": r["title"],
                "state": r["state"],
                "created_at": r["created_at"],
                "status": r["status"],
                "completeness_score": data.get("completeness", {}).get("overall_score", 82),
                "attention_count": len(data.get("attention_report", []))
            })
        return results
