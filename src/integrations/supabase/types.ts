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
          created_at: string
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
          "relevant guidances": string
          "vetting authority": string | null
        }
        Insert: {
          created_at?: string
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
          "relevant guidances": string
          "vetting authority"?: string | null
        }
        Update: {
          created_at?: string
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
          "relevant guidances"?: string
          "vetting authority"?: string | null
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
