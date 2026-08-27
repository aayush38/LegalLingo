/**
 * Generated from the LegalLingo Supabase schema. Do not hand-edit.
 *
 * Regenerate after any migration:
 *   npx supabase gen types typescript --project-id sdxhtyryvlxqlowbbhnk > src/lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          date_of_birth: string | null;
          gender: string | null;
          address_line: string | null;
          city: string | null;
          pincode: string | null;
          father_or_spouse_name: string | null;
          display_name: string | null;
          preferred_language: Database['public']['Enums']['language_code'];
          state: string | null;
          district: string | null;
          occupation: string | null;
          aadhaar_last4: string | null;
          aadhaar_name: string | null;
          aadhaar_verified_at: string | null;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          address_line?: string | null;
          city?: string | null;
          pincode?: string | null;
          father_or_spouse_name?: string | null;
          display_name?: string | null;
          preferred_language?: Database['public']['Enums']['language_code'];
          state?: string | null;
          district?: string | null;
          occupation?: string | null;
          aadhaar_last4?: string | null;
          aadhaar_name?: string | null;
          aadhaar_verified_at?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          address_line?: string | null;
          city?: string | null;
          pincode?: string | null;
          father_or_spouse_name?: string | null;
          display_name?: string | null;
          preferred_language?: Database['public']['Enums']['language_code'];
          state?: string | null;
          district?: string | null;
          occupation?: string | null;
          aadhaar_last4?: string | null;
          aadhaar_name?: string | null;
          aadhaar_verified_at?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_sets: {
        Row: {
          id: string;
          auth_uid: string;
          title: string;
          document_type: string | null;
          status: Database['public']['Enums']['doc_status'] | null;
          understanding_score: number | null;
          classification_confidence: number | null;
          ocr_confidence: number | null;
          is_scanned: boolean;
          analysis_status: Database['public']['Enums']['processing_status'];
          analysis_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_uid: string;
          title: string;
          document_type?: string | null;
          status?: Database['public']['Enums']['doc_status'] | null;
          understanding_score?: number | null;
          classification_confidence?: number | null;
          ocr_confidence?: number | null;
          is_scanned?: boolean;
          analysis_status?: Database['public']['Enums']['processing_status'];
          analysis_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_uid?: string;
          title?: string;
          document_type?: string | null;
          status?: Database['public']['Enums']['doc_status'] | null;
          understanding_score?: number | null;
          classification_confidence?: number | null;
          ocr_confidence?: number | null;
          is_scanned?: boolean;
          analysis_status?: Database['public']['Enums']['processing_status'];
          analysis_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          document_set_id: string;
          auth_uid: string;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          storage_path: string | null;
          role: Database['public']['Enums']['document_role'];
          doc_type: string | null;
          start_page: number | null;
          end_page: number | null;
          page_count: number;
          position: number;
          extraction_summary: string | null;
          extraction_failed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_set_id: string;
          auth_uid: string;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          storage_path?: string | null;
          role?: Database['public']['Enums']['document_role'];
          doc_type?: string | null;
          start_page?: number | null;
          end_page?: number | null;
          page_count?: number;
          position?: number;
          extraction_summary?: string | null;
          extraction_failed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_set_id?: string;
          auth_uid?: string;
          file_name?: string;
          file_size?: number | null;
          mime_type?: string | null;
          storage_path?: string | null;
          role?: Database['public']['Enums']['document_role'];
          doc_type?: string | null;
          start_page?: number | null;
          end_page?: number | null;
          page_count?: number;
          position?: number;
          extraction_summary?: string | null;
          extraction_failed?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_document_set_id_fkey';
            columns: ['document_set_id'];
            isOneToOne: false;
            referencedRelation: 'document_sets';
            referencedColumns: ['id'];
          }
        ];
      };
      document_pages: {
        Row: {
          id: string;
          document_id: string;
          document_set_id: string;
          auth_uid: string;
          page_number: number;
          source_page: number | null;
          text_content: string;
          char_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          document_set_id: string;
          auth_uid: string;
          page_number: number;
          source_page?: number | null;
          text_content?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          document_set_id?: string;
          auth_uid?: string;
          page_number?: number;
          source_page?: number | null;
          text_content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'document_pages_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'documents';
            referencedColumns: ['id'];
          }
        ];
      };
      analyses: {
        Row: {
          id: string;
          document_set_id: string;
          auth_uid: string;
          analysis_json: Json;
          summary: string | null;
          very_simple_summary: string | null;
          five_questions: Json | null;
          parties: Json;
          key_information: Json;
          legal_terms: Json;
          missing_information: Json;
          completeness_breakdown: Json | null;
          fully_analyzed: boolean;
          total_pages: number | null;
          total_files: number | null;
          supporting_files: number | null;
          total_chunks: number | null;
          chunks_succeeded: number | null;
          chunks_failed: number | null;
          warnings: string[];
          llm_calls: number | null;
          provider: string | null;
          model: string | null;
          total_ms: number | null;
          risk_engine_version: string | null;
          is_current: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_set_id: string;
          auth_uid: string;
          analysis_json: Json;
          summary?: string | null;
          very_simple_summary?: string | null;
          five_questions?: Json | null;
          parties?: Json;
          key_information?: Json;
          legal_terms?: Json;
          missing_information?: Json;
          completeness_breakdown?: Json | null;
          fully_analyzed?: boolean;
          total_pages?: number | null;
          total_files?: number | null;
          supporting_files?: number | null;
          total_chunks?: number | null;
          chunks_succeeded?: number | null;
          chunks_failed?: number | null;
          warnings?: string[];
          llm_calls?: number | null;
          provider?: string | null;
          model?: string | null;
          total_ms?: number | null;
          risk_engine_version?: string | null;
          is_current?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['analyses']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'analyses_document_set_id_fkey';
            columns: ['document_set_id'];
            isOneToOne: false;
            referencedRelation: 'document_sets';
            referencedColumns: ['id'];
          }
        ];
      };
      clauses: {
        Row: {
          id: string;
          analysis_id: string;
          document_set_id: string;
          auth_uid: string;
          clause_key: string | null;
          position: number;
          title: Json;
          original_text: string;
          simple_meaning: Json;
          why_it_matters: Json;
          recommended_action: Json;
          risk_level: Database['public']['Enums']['attention_level'];
          category: string | null;
          page: number | null;
          source_file: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          document_set_id: string;
          auth_uid: string;
          clause_key?: string | null;
          position?: number;
          title?: Json;
          original_text: string;
          simple_meaning?: Json;
          why_it_matters?: Json;
          recommended_action?: Json;
          risk_level?: Database['public']['Enums']['attention_level'];
          category?: string | null;
          page?: number | null;
          source_file?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['clauses']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'clauses_analysis_id_fkey';
            columns: ['analysis_id'];
            isOneToOne: false;
            referencedRelation: 'analyses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'clauses_document_set_id_fkey';
            columns: ['document_set_id'];
            isOneToOne: false;
            referencedRelation: 'document_sets';
            referencedColumns: ['id'];
          }
        ];
      };
      risk_findings: {
        Row: {
          id: string;
          analysis_id: string;
          document_set_id: string;
          auth_uid: string;
          finding_key: string;
          rule_id: string;
          category: string;
          title: string;
          severity: Database['public']['Enums']['attention_level'];
          score: number;
          reason: string;
          simple_meaning: string | null;
          recommended_verification: string[];
          evidence: Json;
          related_fields: string[];
          confidence: Database['public']['Enums']['risk_confidence'] | null;
          source_type: string;
          legal_basis: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          document_set_id: string;
          auth_uid: string;
          finding_key: string;
          rule_id: string;
          category: string;
          title: string;
          severity: Database['public']['Enums']['attention_level'];
          score?: number;
          reason: string;
          simple_meaning?: string | null;
          recommended_verification?: string[];
          evidence?: Json;
          related_fields?: string[];
          confidence?: Database['public']['Enums']['risk_confidence'] | null;
          source_type?: string;
          legal_basis?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['risk_findings']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'risk_findings_analysis_id_fkey';
            columns: ['analysis_id'];
            isOneToOne: false;
            referencedRelation: 'analyses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'risk_findings_document_set_id_fkey';
            columns: ['document_set_id'];
            isOneToOne: false;
            referencedRelation: 'document_sets';
            referencedColumns: ['id'];
          }
        ];
      };
      extracted_facts: {
        Row: {
          id: string;
          analysis_id: string;
          document_id: string | null;
          document_set_id: string;
          auth_uid: string;
          label: string;
          value: string;
          page: number | null;
          source_file: string | null;
          doc_type: string | null;
          confidence: number | null;
          verified: boolean;
          evidence_snippet: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          document_id?: string | null;
          document_set_id: string;
          auth_uid: string;
          label: string;
          value: string;
          page?: number | null;
          source_file?: string | null;
          doc_type?: string | null;
          confidence?: number | null;
          verified?: boolean;
          evidence_snippet?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['extracted_facts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'extracted_facts_analysis_id_fkey';
            columns: ['analysis_id'];
            isOneToOne: false;
            referencedRelation: 'analyses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'extracted_facts_document_set_id_fkey';
            columns: ['document_set_id'];
            isOneToOne: false;
            referencedRelation: 'document_sets';
            referencedColumns: ['id'];
          }
        ];
      };
      checklist_items: {
        Row: {
          id: string;
          analysis_id: string;
          document_set_id: string;
          auth_uid: string;
          item_key: string;
          position: number;
          text: Json;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          document_set_id: string;
          auth_uid: string;
          item_key: string;
          position?: number;
          text?: Json;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['checklist_items']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'checklist_items_analysis_id_fkey';
            columns: ['analysis_id'];
            isOneToOne: false;
            referencedRelation: 'analyses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'checklist_items_document_set_id_fkey';
            columns: ['document_set_id'];
            isOneToOne: false;
            referencedRelation: 'document_sets';
            referencedColumns: ['id'];
          }
        ];
      };
      translation_cache: {
        Row: {
          id: number;
          source_hash: string;
          target_language: Database['public']['Enums']['language_code'];
          source_text: string;
          translated_text: string;
          provider: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          source_hash: string;
          target_language: Database['public']['Enums']['language_code'];
          source_text: string;
          translated_text: string;
          provider?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['translation_cache']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      attention_level: 'STANDARD' | 'REVIEW' | 'HIGH_ATTENTION';
      doc_status: 'Looks Standard' | 'Needs Attention' | 'High Risk';
      document_role: 'primary' | 'supporting';
      language_code: 'en' | 'hi' | 'mr' | 'gu';
      processing_status: 'pending' | 'processing' | 'complete' | 'failed';
      risk_confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row'];

export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];

export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
