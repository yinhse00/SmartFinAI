export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      interpretation_guidance: {
        Row: {
          applicable_rules: string[] | null
          content: string
          created_at: string
          guidance_number: string | null
          id: string
          issue_date: string | null
          source_document_id: string | null
          title: string
        }
        Insert: {
          applicable_rules?: string[] | null
          content: string
          created_at?: string
          guidance_number?: string | null
          id?: string
          issue_date?: string | null
          source_document_id?: string | null
          title: string
        }
        Update: {
          applicable_rules?: string[] | null
          content?: string
          created_at?: string
          guidance_number?: string | null
          id?: string
          issue_date?: string | null
          source_document_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "interpretation_guidance_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "reference_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      "Listing Rules": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      reference_documents: {
        Row: {
          category: string
          content: string | null
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          metadata: Json | null
          title: string
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          metadata?: Json | null
          title: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          metadata?: Json | null
          title?: string
        }
        Relationships: []
      }
      regulatory_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      regulatory_definitions: {
        Row: {
          category_id: string | null
          created_at: string
          definition: string
          id: string
          source_provision_id: string | null
          term: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          definition: string
          id?: string
          source_provision_id?: string | null
          term: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          definition?: string
          id?: string
          source_provision_id?: string | null
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_definitions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "regulatory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_definitions_source_provision_id_fkey"
            columns: ["source_provision_id"]
            isOneToOne: false
            referencedRelation: "regulatory_provisions"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_faqs: {
        Row: {
          answer: string
          category_id: string | null
          created_at: string
          id: string
          question: string
          related_provisions: string[] | null
          source_document_id: string | null
        }
        Insert: {
          answer: string
          category_id?: string | null
          created_at?: string
          id?: string
          question: string
          related_provisions?: string[] | null
          source_document_id?: string | null
        }
        Update: {
          answer?: string
          category_id?: string | null
          created_at?: string
          id?: string
          question?: string
          related_provisions?: string[] | null
          source_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "regulatory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_faqs_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "reference_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_provisions: {
        Row: {
          category_id: string | null
          chapter: string | null
          content: string
          created_at: string
          effective_date: string | null
          id: string
          is_current: boolean | null
          last_updated: string
          parent_id: string | null
          path_reference: string | null
          rule_number: string
          search_priority: number | null
          section: string | null
          source_document_id: string | null
          subsection: string | null
          title: string
          version: string | null
        }
        Insert: {
          category_id?: string | null
          chapter?: string | null
          content: string
          created_at?: string
          effective_date?: string | null
          id?: string
          is_current?: boolean | null
          last_updated?: string
          parent_id?: string | null
          path_reference?: string | null
          rule_number: string
          search_priority?: number | null
          section?: string | null
          source_document_id?: string | null
          subsection?: string | null
          title: string
          version?: string | null
        }
        Update: {
          category_id?: string | null
          chapter?: string | null
          content?: string
          created_at?: string
          effective_date?: string | null
          id?: string
          is_current?: boolean | null
          last_updated?: string
          parent_id?: string | null
          path_reference?: string | null
          rule_number?: string
          search_priority?: number | null
          section?: string | null
          source_document_id?: string | null
          subsection?: string | null
          title?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_provisions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "regulatory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_provisions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "regulatory_provisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_provisions_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "reference_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_cross_references: {
        Row: {
          created_at: string
          from_rule_id: string
          id: string
          reference_text: string | null
          reference_type: string | null
          to_rule_id: string
        }
        Insert: {
          created_at?: string
          from_rule_id: string
          id?: string
          reference_text?: string | null
          reference_type?: string | null
          to_rule_id: string
        }
        Update: {
          created_at?: string
          from_rule_id?: string
          id?: string
          reference_text?: string | null
          reference_type?: string | null
          to_rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_cross_references_from_rule_id_fkey"
            columns: ["from_rule_id"]
            isOneToOne: false
            referencedRelation: "regulatory_provisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_cross_references_to_rule_id_fkey"
            columns: ["to_rule_id"]
            isOneToOne: false
            referencedRelation: "regulatory_provisions"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_keywords: {
        Row: {
          created_at: string
          id: string
          keyword: string
          provision_ids: string[]
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          keyword: string
          provision_ids: string[]
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          keyword?: string
          provision_ids?: string[]
          weight?: number | null
        }
        Relationships: []
      }
      search_index: {
        Row: {
          created_at: string
          full_text: string | null
          id: string
          keywords: string[] | null
          last_indexed: string
          provision_id: string
          search_vector: unknown | null
        }
        Insert: {
          created_at?: string
          full_text?: string | null
          id?: string
          keywords?: string[] | null
          last_indexed?: string
          provision_id: string
          search_vector?: unknown | null
        }
        Update: {
          created_at?: string
          full_text?: string | null
          id?: string
          keywords?: string[] | null
          last_indexed?: string
          provision_id?: string
          search_vector?: unknown | null
        }
        Relationships: [
          {
            foreignKeyName: "search_index_provision_id_fkey"
            columns: ["provision_id"]
            isOneToOne: true
            referencedRelation: "regulatory_provisions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
