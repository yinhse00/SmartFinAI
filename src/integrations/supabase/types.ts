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
          exemptions: string | null
          headline_category: string
          id: string
          is_vetting_required: boolean
          rule_reference: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exemptions?: string | null
          headline_category: string
          id?: string
          is_vetting_required?: boolean
          rule_reference?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exemptions?: string | null
          headline_category?: string
          id?: string
          is_vetting_required?: boolean
          rule_reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ecm_deal_documents: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          document_name: string
          document_status: string | null
          document_type: string
          file_path: string | null
          file_url: string | null
          filing_reference: string | null
          id: string
          regulatory_filing_status: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          document_name: string
          document_status?: string | null
          document_type: string
          file_path?: string | null
          file_url?: string | null
          filing_reference?: string | null
          id?: string
          regulatory_filing_status?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          document_name?: string
          document_status?: string | null
          document_type?: string
          file_path?: string | null
          file_url?: string | null
          filing_reference?: string | null
          id?: string
          regulatory_filing_status?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ecm_deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "ecm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      ecm_deals: {
        Row: {
          book_runner: string | null
          co_managers: string[] | null
          completion_date: string | null
          created_at: string
          currency: string | null
          deal_name: string
          deal_status: string | null
          deal_type: string
          esg_classification: string | null
          execution_complexity_score: number | null
          final_amount: number | null
          id: string
          investor_interest_level: string | null
          issuer_id: string | null
          launch_date: string | null
          market_conditions_score: number | null
          pricing_method: string | null
          regulatory_approvals_required: string[] | null
          regulatory_status: string | null
          target_amount: number | null
          updated_at: string
          use_of_proceeds: string | null
        }
        Insert: {
          book_runner?: string | null
          co_managers?: string[] | null
          completion_date?: string | null
          created_at?: string
          currency?: string | null
          deal_name: string
          deal_status?: string | null
          deal_type: string
          esg_classification?: string | null
          execution_complexity_score?: number | null
          final_amount?: number | null
          id?: string
          investor_interest_level?: string | null
          issuer_id?: string | null
          launch_date?: string | null
          market_conditions_score?: number | null
          pricing_method?: string | null
          regulatory_approvals_required?: string[] | null
          regulatory_status?: string | null
          target_amount?: number | null
          updated_at?: string
          use_of_proceeds?: string | null
        }
        Update: {
          book_runner?: string | null
          co_managers?: string[] | null
          completion_date?: string | null
          created_at?: string
          currency?: string | null
          deal_name?: string
          deal_status?: string | null
          deal_type?: string
          esg_classification?: string | null
          execution_complexity_score?: number | null
          final_amount?: number | null
          id?: string
          investor_interest_level?: string | null
          issuer_id?: string | null
          launch_date?: string | null
          market_conditions_score?: number | null
          pricing_method?: string | null
          regulatory_approvals_required?: string[] | null
          regulatory_status?: string | null
          target_amount?: number | null
          updated_at?: string
          use_of_proceeds?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecm_deals_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "ecm_issuers"
            referencedColumns: ["id"]
          },
        ]
      }
      ecm_investor_matches: {
        Row: {
          compatibility_factors: string[] | null
          contact_date: string | null
          created_at: string
          deal_id: string | null
          id: string
          indicative_amount: number | null
          investment_interest_level: string | null
          investor_id: string | null
          match_score: number | null
          notes: string | null
          response_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          compatibility_factors?: string[] | null
          contact_date?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          indicative_amount?: number | null
          investment_interest_level?: string | null
          investor_id?: string | null
          match_score?: number | null
          notes?: string | null
          response_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          compatibility_factors?: string[] | null
          contact_date?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          indicative_amount?: number | null
          investment_interest_level?: string | null
          investor_id?: string | null
          match_score?: number | null
          notes?: string | null
          response_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecm_investor_matches_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "ecm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecm_investor_matches_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "ecm_investors"
            referencedColumns: ["id"]
          },
        ]
      }
      ecm_investors: {
        Row: {
          aum_range: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          deal_size_max: number | null
          deal_size_min: number | null
          esg_focused: boolean | null
          geographic_focus: string[] | null
          id: string
          investor_name: string
          investor_type: string
          kyc_status: string | null
          last_activity_date: string | null
          regulatory_classification: string | null
          risk_appetite: string | null
          sector_preferences: string[] | null
          stock_connect_eligible: boolean | null
          total_investment_amount: number | null
          total_investments_count: number | null
          updated_at: string
        }
        Insert: {
          aum_range?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          deal_size_max?: number | null
          deal_size_min?: number | null
          esg_focused?: boolean | null
          geographic_focus?: string[] | null
          id?: string
          investor_name: string
          investor_type: string
          kyc_status?: string | null
          last_activity_date?: string | null
          regulatory_classification?: string | null
          risk_appetite?: string | null
          sector_preferences?: string[] | null
          stock_connect_eligible?: boolean | null
          total_investment_amount?: number | null
          total_investments_count?: number | null
          updated_at?: string
        }
        Update: {
          aum_range?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          deal_size_max?: number | null
          deal_size_min?: number | null
          esg_focused?: boolean | null
          geographic_focus?: string[] | null
          id?: string
          investor_name?: string
          investor_type?: string
          kyc_status?: string | null
          last_activity_date?: string | null
          regulatory_classification?: string | null
          risk_appetite?: string | null
          sector_preferences?: string[] | null
          stock_connect_eligible?: boolean | null
          total_investment_amount?: number | null
          total_investments_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ecm_issuers: {
        Row: {
          company_name: string
          compliance_risk_score: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          esg_rating: string | null
          esg_score: number | null
          financial_year_end: string | null
          hkex_listing_date: string | null
          id: string
          industry: string | null
          last_fundraising_date: string | null
          market_cap: number | null
          regulatory_status: string | null
          sector: string | null
          stock_code: string | null
          total_funds_raised: number | null
          updated_at: string
        }
        Insert: {
          company_name: string
          compliance_risk_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          esg_rating?: string | null
          esg_score?: number | null
          financial_year_end?: string | null
          hkex_listing_date?: string | null
          id?: string
          industry?: string | null
          last_fundraising_date?: string | null
          market_cap?: number | null
          regulatory_status?: string | null
          sector?: string | null
          stock_code?: string | null
          total_funds_raised?: number | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          compliance_risk_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          esg_rating?: string | null
          esg_score?: number | null
          financial_year_end?: string | null
          hkex_listing_date?: string | null
          id?: string
          industry?: string | null
          last_fundraising_date?: string | null
          market_cap?: number | null
          regulatory_status?: string | null
          sector?: string | null
          stock_code?: string | null
          total_funds_raised?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ecm_market_data: {
        Row: {
          average_deal_size: number | null
          created_at: string
          data_date: string
          hang_seng_index: number | null
          hang_seng_tech_index: number | null
          id: string
          ipo_activity_count: number | null
          market_sentiment: string | null
          market_volatility: number | null
          regulatory_environment_score: number | null
          secondary_fundraising_count: number | null
          stock_connect_northbound_flow: number | null
          stock_connect_southbound_flow: number | null
        }
        Insert: {
          average_deal_size?: number | null
          created_at?: string
          data_date: string
          hang_seng_index?: number | null
          hang_seng_tech_index?: number | null
          id?: string
          ipo_activity_count?: number | null
          market_sentiment?: string | null
          market_volatility?: number | null
          regulatory_environment_score?: number | null
          secondary_fundraising_count?: number | null
          stock_connect_northbound_flow?: number | null
          stock_connect_southbound_flow?: number | null
        }
        Update: {
          average_deal_size?: number | null
          created_at?: string
          data_date?: string
          hang_seng_index?: number | null
          hang_seng_tech_index?: number | null
          id?: string
          ipo_activity_count?: number | null
          market_sentiment?: string | null
          market_volatility?: number | null
          regulatory_environment_score?: number | null
          secondary_fundraising_count?: number | null
          stock_connect_northbound_flow?: number | null
          stock_connect_southbound_flow?: number | null
        }
        Relationships: []
      }
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
