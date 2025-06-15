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
      announcement_pre_vetting_requirements: {
        Row: {
          created_at: string
          description: string | null
          gem_listingrules: string | null
          generally_headline_categories: string | null
          id: string
          is_vetting_required: boolean
          matter_transaction_question: string
          md_listingrules: string | null
          means_disclosure: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gem_listingrules?: string | null
          generally_headline_categories?: string | null
          id?: string
          is_vetting_required?: boolean
          matter_transaction_question: string
          md_listingrules?: string | null
          means_disclosure?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gem_listingrules?: string | null
          generally_headline_categories?: string | null
          id?: string
          is_vetting_required?: boolean
          matter_transaction_question?: string
          md_listingrules?: string | null
          means_disclosure?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      listingrule_listed_faq: {
        Row: {
          category: string
          id: string
          listingrules: string | null
          particulars: string
          reference_nos: string | null
          updated_datae: string | null
        }
        Insert: {
          category: string
          id?: string
          listingrules?: string | null
          particulars: string
          reference_nos?: string | null
          updated_datae?: string | null
        }
        Update: {
          category?: string
          id?: string
          listingrules?: string | null
          particulars?: string
          reference_nos?: string | null
          updated_datae?: string | null
        }
        Relationships: []
      }
      listingrule_new_faq: {
        Row: {
          chapter: string | null
          createtime: string | null
          faqtopic: string | null
          id: string
          mblistingrule_reference: string | null
          question_no: string | null
          seriesno: string
          topic: string | null
        }
        Insert: {
          chapter?: string | null
          createtime?: string | null
          faqtopic?: string | null
          id?: string
          mblistingrule_reference?: string | null
          question_no?: string | null
          seriesno: string
          topic?: string | null
        }
        Update: {
          chapter?: string | null
          createtime?: string | null
          faqtopic?: string | null
          id?: string
          mblistingrule_reference?: string | null
          question_no?: string | null
          seriesno?: string
          topic?: string | null
        }
        Relationships: []
      }
      listingrule_new_gl: {
        Row: {
          chapter: string | null
          created_at: string
          id: string
          mblistingrules_Topics: string | null
          particulars: string | null
          reference_no: string | null
          title: string | null
        }
        Insert: {
          chapter?: string | null
          created_at?: string
          id?: string
          mblistingrules_Topics?: string | null
          particulars?: string | null
          reference_no?: string | null
          title?: string | null
        }
        Update: {
          chapter?: string | null
          created_at?: string
          id?: string
          mblistingrules_Topics?: string | null
          particulars?: string | null
          reference_no?: string | null
          title?: string | null
        }
        Relationships: []
      }
      listingrule_new_ld: {
        Row: {
          chapter: string | null
          createtime: string | null
          id: string
          mblistingrules_Topics: string
          particulars: string | null
          reference_No: string
          title: string | null
        }
        Insert: {
          chapter?: string | null
          createtime?: string | null
          id?: string
          mblistingrules_Topics: string
          particulars?: string | null
          reference_No: string
          title?: string | null
        }
        Update: {
          chapter?: string | null
          createtime?: string | null
          id?: string
          mblistingrules_Topics?: string
          particulars?: string | null
          reference_No?: string
          title?: string | null
        }
        Relationships: []
      }
      mb_listingrule_documents: {
        Row: {
          category: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
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
        Relationships: []
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
          category: string | null
          id: string
          particulars: string | null
          party: string | null
          tableindex: string | null
        }
        Insert: {
          category?: string | null
          id?: string
          particulars?: string | null
          party?: string | null
          tableindex?: string | null
        }
        Update: {
          category?: string | null
          id?: string
          particulars?: string | null
          party?: string | null
          tableindex?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
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
