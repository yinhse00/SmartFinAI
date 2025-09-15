export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      execution_ai_documents: {
        Row: {
          content: string
          created_at: string
          created_by_ai: boolean
          document_type: string
          email_id: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by_ai?: boolean
          document_type: string
          email_id?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by_ai?: boolean
          document_type?: string
          email_id?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_ai_documents_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "execution_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_ai_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "execution_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_email_configs: {
        Row: {
          config: Json
          created_at: string
          id: string
          project_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_email_configs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "execution_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_email_logs: {
        Row: {
          action: string
          details: string | null
          email_id: string
          id: string
          timestamp: string
        }
        Insert: {
          action: string
          details?: string | null
          email_id: string
          id?: string
          timestamp?: string
        }
        Update: {
          action?: string
          details?: string | null
          email_id?: string
          id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_email_logs_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "execution_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_emails: {
        Row: {
          ai_response: string | null
          analysis: Json | null
          body: string
          created_at: string
          from_email: string
          id: string
          project_id: string
          status: string
          subject: string
          timestamp: string
          to_email: string
          updated_at: string
        }
        Insert: {
          ai_response?: string | null
          analysis?: Json | null
          body: string
          created_at?: string
          from_email: string
          id?: string
          project_id: string
          status?: string
          subject: string
          timestamp?: string
          to_email: string
          updated_at?: string
        }
        Update: {
          ai_response?: string | null
          analysis?: Json | null
          body?: string
          created_at?: string
          from_email?: string
          id?: string
          project_id?: string
          status?: string
          subject?: string
          timestamp?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_emails_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "execution_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_notifications: {
        Row: {
          created_at: string
          data: Json | null
          email: string | null
          id: string
          message: string
          project_id: string
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          email?: string | null
          id?: string
          message: string
          project_id: string
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          email?: string | null
          id?: string
          message?: string
          project_id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "execution_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_project_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          project_id: string
          role: Database["public"]["Enums"]["execution_role"]
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          project_id: string
          role?: Database["public"]["Enums"]["execution_role"]
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          project_id?: string
          role?: Database["public"]["Enums"]["execution_role"]
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "execution_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_projects: {
        Row: {
          created_at: string
          description: string | null
          execution_plan: Json | null
          id: string
          name: string
          status: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          execution_plan?: Json | null
          id?: string
          name: string
          status?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          execution_plan?: Json | null
          id?: string
          name?: string
          status?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      execution_stakeholders: {
        Row: {
          ai_context: Json | null
          communication_style: string
          contact_info: Json | null
          created_at: string
          email: string
          expertise_areas: Json | null
          id: string
          name: string | null
          project_id: string
          role: string
          updated_at: string
        }
        Insert: {
          ai_context?: Json | null
          communication_style?: string
          contact_info?: Json | null
          created_at?: string
          email: string
          expertise_areas?: Json | null
          id?: string
          name?: string | null
          project_id: string
          role: string
          updated_at?: string
        }
        Update: {
          ai_context?: Json | null
          communication_style?: string
          contact_info?: Json | null
          created_at?: string
          email?: string
          expertise_areas?: Json | null
          id?: string
          name?: string | null
          project_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "execution_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_task_comments: {
        Row: {
          author_email: string | null
          author_name: string | null
          content: string
          created_at: string
          id: string
          project_id: string
          task_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_email?: string | null
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          project_id: string
          task_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_email?: string | null
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          task_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_task_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "execution_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_statements: {
        Row: {
          created_at: string
          extracted_data: Json | null
          file_name: string
          id: string
          project_id: string
          statement_type: string
          total_assets: number | null
          total_liabilities: number | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          extracted_data?: Json | null
          file_name: string
          id?: string
          project_id: string
          statement_type: string
          total_assets?: number | null
          total_liabilities?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          extracted_data?: Json | null
          file_name?: string
          id?: string
          project_id?: string
          statement_type?: string
          total_assets?: number | null
          total_liabilities?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_statements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ipo_prospectus_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ipo_dd_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          extracted_content: string | null
          file_path: string | null
          file_url: string | null
          id: string
          key_insights: Json | null
          processing_status: string
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          extracted_content?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          key_insights?: Json | null
          processing_status?: string
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          extracted_content?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          key_insights?: Json | null
          processing_status?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ipo_dd_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ipo_prospectus_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ipo_prospectus_projects: {
        Row: {
          company_name: string
          created_at: string
          id: string
          industry: string | null
          metadata: Json | null
          project_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          industry?: string | null
          metadata?: Json | null
          project_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          industry?: string | null
          metadata?: Json | null
          project_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ipo_prospectus_section_guidance: {
        Row: {
          contents: string | null
          "contents requirements": string | null
          created_at: string | null
          Guidance: string | null
          id: string
          references: string | null
          Section: string | null
          updated_at: string | null
        }
        Insert: {
          contents?: string | null
          "contents requirements"?: string | null
          created_at?: string | null
          Guidance?: string | null
          id?: string
          references?: string | null
          Section?: string | null
          updated_at?: string | null
        }
        Update: {
          contents?: string | null
          "contents requirements"?: string | null
          created_at?: string | null
          Guidance?: string | null
          id?: string
          references?: string | null
          Section?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ipo_prospectus_sections: {
        Row: {
          confidence_score: number | null
          content: string | null
          created_at: string
          id: string
          project_id: string
          section_number: string | null
          section_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          content?: string | null
          created_at?: string
          id?: string
          project_id: string
          section_number?: string | null
          section_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          content?: string | null
          created_at?: string
          id?: string
          project_id?: string
          section_number?: string | null
          section_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ipo_prospectus_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ipo_prospectus_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ipo_section_business_templates: {
        Row: {
          Awards: string | null
          "Business Model": string | null
          "business Nature": string | null
          "Business Strategies": string | null
          "Company Name": string | null
          Competition: string | null
          "Competitive Strengths": string | null
          "Concentration of customers or suppliers": string | null
          "Covid-19": string | null
          created_at: string
          Customers: string | null
          "date of prospectus": string | null
          Employee: string | null
          "Environment, Social and Corporate Governance": string | null
          "Future Plan": string | null
          id: string
          "Information Technology": string | null
          Insurance: string | null
          "Intelliectual Properties": string | null
          "Internal control and risk management": string | null
          "License, Permits and Certificates": string | null
          Marketing: string | null
          "non-compliance and legal proceedings": string | null
          Overview: string | null
          Pricing: string | null
          "Production and manufacturing": string | null
          Properties: string | null
          "Quality Control": string | null
          "Research and Development": string | null
          Seasonality: string | null
          Services: string | null
          "Stock Code": string
          Suppliers: string | null
          "Transfer Pricing": string | null
          updated_at: string
        }
        Insert: {
          Awards?: string | null
          "Business Model"?: string | null
          "business Nature"?: string | null
          "Business Strategies"?: string | null
          "Company Name"?: string | null
          Competition?: string | null
          "Competitive Strengths"?: string | null
          "Concentration of customers or suppliers"?: string | null
          "Covid-19"?: string | null
          created_at?: string
          Customers?: string | null
          "date of prospectus"?: string | null
          Employee?: string | null
          "Environment, Social and Corporate Governance"?: string | null
          "Future Plan"?: string | null
          id?: string
          "Information Technology"?: string | null
          Insurance?: string | null
          "Intelliectual Properties"?: string | null
          "Internal control and risk management"?: string | null
          "License, Permits and Certificates"?: string | null
          Marketing?: string | null
          "non-compliance and legal proceedings"?: string | null
          Overview?: string | null
          Pricing?: string | null
          "Production and manufacturing"?: string | null
          Properties?: string | null
          "Quality Control"?: string | null
          "Research and Development"?: string | null
          Seasonality?: string | null
          Services?: string | null
          "Stock Code": string
          Suppliers?: string | null
          "Transfer Pricing"?: string | null
          updated_at?: string
        }
        Update: {
          Awards?: string | null
          "Business Model"?: string | null
          "business Nature"?: string | null
          "Business Strategies"?: string | null
          "Company Name"?: string | null
          Competition?: string | null
          "Competitive Strengths"?: string | null
          "Concentration of customers or suppliers"?: string | null
          "Covid-19"?: string | null
          created_at?: string
          Customers?: string | null
          "date of prospectus"?: string | null
          Employee?: string | null
          "Environment, Social and Corporate Governance"?: string | null
          "Future Plan"?: string | null
          id?: string
          "Information Technology"?: string | null
          Insurance?: string | null
          "Intelliectual Properties"?: string | null
          "Internal control and risk management"?: string | null
          "License, Permits and Certificates"?: string | null
          Marketing?: string | null
          "non-compliance and legal proceedings"?: string | null
          Overview?: string | null
          Pricing?: string | null
          "Production and manufacturing"?: string | null
          Properties?: string | null
          "Quality Control"?: string | null
          "Research and Development"?: string | null
          Seasonality?: string | null
          Services?: string | null
          "Stock Code"?: string
          Suppliers?: string | null
          "Transfer Pricing"?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ipo_source_attribution: {
        Row: {
          confidence_score: number | null
          content_snippet: string
          created_at: string
          id: string
          section_id: string
          source_reference: string | null
          source_type: string
        }
        Insert: {
          confidence_score?: number | null
          content_snippet: string
          created_at?: string
          id?: string
          section_id: string
          source_reference?: string | null
          source_type: string
        }
        Update: {
          confidence_score?: number | null
          content_snippet?: string
          created_at?: string
          id?: string
          section_id?: string
          source_reference?: string | null
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ipo_source_attribution_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "ipo_prospectus_sections"
            referencedColumns: ["id"]
          },
        ]
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
      listingrules_listed_timetable: {
        Row: {
          id: string
          "no of day for preparing circular": string | null
          "no of day for preparing listing document or prospectus or offer":
            | string
            | null
          "no of day for preparing the announcement": string | null
          "no of day for vetting circular": string | null
          "no of day for vetting listing document or prospectus or offer d":
            | string
            | null
          "no of days of vetting the annoucement": string | null
          particulars: string | null
          "Relevant guideline": string | null
          "vetting authority": string | null
        }
        Insert: {
          id?: string
          "no of day for preparing circular"?: string | null
          "no of day for preparing listing document or prospectus or offer"?:
            | string
            | null
          "no of day for preparing the announcement"?: string | null
          "no of day for vetting circular"?: string | null
          "no of day for vetting listing document or prospectus or offer d"?:
            | string
            | null
          "no of days of vetting the annoucement"?: string | null
          particulars?: string | null
          "Relevant guideline"?: string | null
          "vetting authority"?: string | null
        }
        Update: {
          id?: string
          "no of day for preparing circular"?: string | null
          "no of day for preparing listing document or prospectus or offer"?:
            | string
            | null
          "no of day for preparing the announcement"?: string | null
          "no of day for vetting circular"?: string | null
          "no of day for vetting listing document or prospectus or offer d"?:
            | string
            | null
          "no of days of vetting the annoucement"?: string | null
          particulars?: string | null
          "Relevant guideline"?: string | null
          "vetting authority"?: string | null
        }
        Relationships: []
      }
      materiality_analysis: {
        Row: {
          ai_reasoning: string | null
          ai_suggested: boolean | null
          amount: number
          base_amount: number
          business_context: Json | null
          created_at: string
          financial_statement_id: string | null
          id: string
          is_material: boolean | null
          item_name: string
          item_type: string
          materiality_threshold: number | null
          percentage: number
          project_id: string
          updated_at: string
          user_confirmed: boolean | null
        }
        Insert: {
          ai_reasoning?: string | null
          ai_suggested?: boolean | null
          amount: number
          base_amount: number
          business_context?: Json | null
          created_at?: string
          financial_statement_id?: string | null
          id?: string
          is_material?: boolean | null
          item_name: string
          item_type: string
          materiality_threshold?: number | null
          percentage: number
          project_id: string
          updated_at?: string
          user_confirmed?: boolean | null
        }
        Update: {
          ai_reasoning?: string | null
          ai_suggested?: boolean | null
          amount?: number
          base_amount?: number
          business_context?: Json | null
          created_at?: string
          financial_statement_id?: string | null
          id?: string
          is_material?: boolean | null
          item_name?: string
          item_type?: string
          materiality_threshold?: number | null
          percentage?: number
          project_id?: string
          updated_at?: string
          user_confirmed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "materiality_analysis_financial_statement_id_fkey"
            columns: ["financial_statement_id"]
            isOneToOne: false
            referencedRelation: "financial_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materiality_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ipo_prospectus_projects"
            referencedColumns: ["id"]
          },
        ]
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
      execution_role:
        | "admin"
        | "manager"
        | "team_member"
        | "external_advisor"
        | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      execution_role: [
        "admin",
        "manager",
        "team_member",
        "external_advisor",
        "client",
      ],
    },
  },
} as const
