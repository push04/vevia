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
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          plan: string | null;
          plan_seats: number | null;
          whatsapp_phone_number_id: string | null;
          whatsapp_access_token: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          plan?: string | null;
          plan_seats?: number | null;
          whatsapp_phone_number_id?: string | null;
          whatsapp_access_token?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          plan?: string | null;
          plan_seats?: number | null;
          whatsapp_phone_number_id?: string | null;
          whatsapp_access_token?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      users: {
        Row: {
          id: string;
          org_id: string | null;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          org_id?: string | null;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          is_active?: boolean | null;
        };
        Relationships: [];
      };

      job_roles: {
        Row: {
          id: string;
          org_id: string | null;
          title: string;
          category: string | null;
          description: string | null;
          skills: string[] | null;
          screening_questions: Json | null;
          scoring_rubric: Json | null;
          is_template: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          title: string;
          category?: string | null;
          description?: string | null;
          skills?: string[] | null;
          screening_questions?: Json | null;
          scoring_rubric?: Json | null;
          is_template?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          org_id?: string | null;
          title?: string;
          category?: string | null;
          description?: string | null;
          skills?: string[] | null;
          screening_questions?: Json | null;
          scoring_rubric?: Json | null;
          is_template?: boolean | null;
        };
        Relationships: [];
      };

      jobs: {
        Row: {
          id: string;
          org_id: string;
          created_by: string | null;
          role_id: string | null;
          title: string;
          department: string | null;
          location: string | null;
          employment_type: string | null;
          description: string | null;
          requirements: string[] | null;
          nice_to_have: string[] | null;
          ctc_min: number | null;
          ctc_max: number | null;
          experience_min: number | null;
          experience_max: number | null;
          screening_questions: Json | null;
          status: string | null;
          application_deadline: string | null;
          chatbot_enabled: boolean | null;
          whatsapp_enabled: boolean | null;
          video_interview_required: boolean | null;
          skills_test_required: boolean | null;
          application_count: number | null;
          shortlisted_count: number | null;
          public_slug: string | null;
          jd_embedding: number[] | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          created_by?: string | null;
          role_id?: string | null;
          title: string;
          department?: string | null;
          location?: string | null;
          employment_type?: string | null;
          description?: string | null;
          requirements?: string[] | null;
          nice_to_have?: string[] | null;
          ctc_min?: number | null;
          ctc_max?: number | null;
          experience_min?: number | null;
          experience_max?: number | null;
          screening_questions?: Json | null;
          status?: string | null;
          application_deadline?: string | null;
          chatbot_enabled?: boolean | null;
          whatsapp_enabled?: boolean | null;
          video_interview_required?: boolean | null;
          skills_test_required?: boolean | null;
          application_count?: number | null;
          shortlisted_count?: number | null;
          public_slug?: string | null;
          jd_embedding?: number[] | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          org_id?: string;
          created_by?: string | null;
          role_id?: string | null;
          title?: string;
          department?: string | null;
          location?: string | null;
          employment_type?: string | null;
          description?: string | null;
          requirements?: string[] | null;
          nice_to_have?: string[] | null;
          ctc_min?: number | null;
          ctc_max?: number | null;
          experience_min?: number | null;
          experience_max?: number | null;
          screening_questions?: Json | null;
          status?: string | null;
          application_deadline?: string | null;
          chatbot_enabled?: boolean | null;
          whatsapp_enabled?: boolean | null;
          video_interview_required?: boolean | null;
          skills_test_required?: boolean | null;
          application_count?: number | null;
          shortlisted_count?: number | null;
          public_slug?: string | null;
          jd_embedding?: number[] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      candidates: {
        Row: {
          id: string;
          org_id: string | null;
          email: string | null;
          phone: string | null;
          full_name: string | null;
          current_location: string | null;
          current_company: string | null;
          current_title: string | null;
          total_experience: number | null;
          skills: string[] | null;
          education: Json | null;
          work_experience: Json | null;
          resume_url: string | null;
          resume_raw_text: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          portfolio_url: string | null;
          resume_embedding: number[] | null;
          languages: string[] | null;
          source: string | null;
          whatsapp_number: string | null;
          preferred_language: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          email?: string | null;
          phone?: string | null;
          full_name?: string | null;
          current_location?: string | null;
          current_company?: string | null;
          current_title?: string | null;
          total_experience?: number | null;
          skills?: string[] | null;
          education?: Json | null;
          work_experience?: Json | null;
          resume_url?: string | null;
          resume_raw_text?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          portfolio_url?: string | null;
          resume_embedding?: number[] | null;
          languages?: string[] | null;
          source?: string | null;
          whatsapp_number?: string | null;
          preferred_language?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          org_id?: string | null;
          email?: string | null;
          phone?: string | null;
          full_name?: string | null;
          current_location?: string | null;
          current_company?: string | null;
          current_title?: string | null;
          total_experience?: number | null;
          skills?: string[] | null;
          education?: Json | null;
          work_experience?: Json | null;
          resume_url?: string | null;
          resume_raw_text?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          portfolio_url?: string | null;
          resume_embedding?: number[] | null;
          languages?: string[] | null;
          source?: string | null;
          whatsapp_number?: string | null;
          preferred_language?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      applications: {
        Row: {
          id: string;
          org_id: string;
          job_id: string;
          candidate_id: string;
          status: string | null;
          resume_score: number | null;
          screening_score: number | null;
          test_score: number | null;
          video_score: number | null;
          composite_score: number | null;
          score_breakdown: Json | null;
          score_explanation: string | null;
          screening_answers: Json | null;
          applied_at: string | null;
          screened_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          job_id: string;
          candidate_id: string;
          status?: string | null;
          resume_score?: number | null;
          screening_score?: number | null;
          test_score?: number | null;
          video_score?: number | null;
          composite_score?: number | null;
          score_breakdown?: Json | null;
          score_explanation?: string | null;
          screening_answers?: Json | null;
          applied_at?: string | null;
          screened_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          status?: string | null;
          resume_score?: number | null;
          screening_score?: number | null;
          test_score?: number | null;
          video_score?: number | null;
          composite_score?: number | null;
          score_breakdown?: Json | null;
          score_explanation?: string | null;
          screening_answers?: Json | null;
          applied_at?: string | null;
          screened_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey";
            columns: ["candidate_id"];
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };

      audit_logs: {
        Row: {
          id: string;
          org_id: string;
          actor_type: string;
          actor_id: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          actor_type: string;
          actor_id?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          actor_type?: string;
          actor_id?: string | null;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };

      screening_sessions: {
        Row: {
          id: string;
          org_id: string;
          application_id: string;
          channel: string;
          status: string | null;
          state: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          application_id: string;
          channel: string;
          status?: string | null;
          state?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          status?: string | null;
          state?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      email_logs: {
        Row: {
          id: string;
          org_id: string | null;
          application_id: string | null;
          recipient_email: string;
          template: string;
          resend_id: string | null;
          status: string | null;
          sent_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          application_id?: string | null;
          recipient_email: string;
          template: string;
          resend_id?: string | null;
          status?: string | null;
          sent_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          resend_id?: string | null;
          status?: string | null;
          sent_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_resume_to_jd: {
        Args: { resume_embedding: number[]; job_id: string };
        Returns: number;
      };
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
