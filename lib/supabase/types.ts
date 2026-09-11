// Dibuat dari skema Supabase (generate_typescript_types). Jangan edit manual;
// buat ulang setelah mengubah migrasi.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      frames: {
        Row: {
          captured_at_est: string | null
          created_at: string
          id: string
          idx: number
          participant_id: string
          room_id: string
          shot_v: number
          status: string
          storage_path: string | null
        }
        Insert: {
          captured_at_est?: string | null
          created_at?: string
          id?: string
          idx: number
          participant_id: string
          room_id: string
          shot_v?: number
          status?: string
          storage_path?: string | null
        }
        Update: {
          captured_at_est?: string | null
          created_at?: string
          id?: string
          idx?: number
          participant_id?: string
          room_id?: string
          shot_v?: number
          status?: string
          storage_path?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          id: string
          joined_at: string
          nickname: string | null
          ready: boolean
          role: Database["public"]["Enums"]["participant_role"]
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          nickname?: string | null
          ready?: boolean
          role: Database["public"]["Enums"]["participant_role"]
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          nickname?: string | null
          ready?: boolean
          role?: Database["public"]["Enums"]["participant_role"]
          room_id?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: { created_at: string; id: string; note: string | null; reason: string | null; reporter: string | null; result_id: string; reviewed_at: string | null }
        Insert: { created_at?: string; id?: string; note?: string | null; reason?: string | null; reporter?: string | null; result_id: string; reviewed_at?: string | null }
        Update: { created_at?: string; id?: string; note?: string | null; reason?: string | null; reporter?: string | null; result_id?: string; reviewed_at?: string | null }
        Relationships: []
      }
      results: {
        Row: {
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          filter_id: string
          id: string
          image_path: string | null
          names: string | null
          room_id: string
          slug: string
          template_id: string
          watermark: boolean
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          filter_id: string
          id?: string
          image_path?: string | null
          names?: string | null
          room_id: string
          slug: string
          template_id: string
          watermark?: boolean
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          filter_id?: string
          id?: string
          image_path?: string | null
          names?: string | null
          room_id?: string
          slug?: string
          template_id?: string
          watermark?: boolean
        }
        Relationships: []
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          current_shot: Json | null
          expires_at: string
          filter_id: string
          host_id: string
          id: string
          retake_queue: number[]
          status: Database["public"]["Enums"]["room_status"]
          template_id: string
          tier: Database["public"]["Enums"]["room_tier"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_shot?: Json | null
          expires_at?: string
          filter_id?: string
          host_id: string
          id?: string
          retake_queue?: number[]
          status?: Database["public"]["Enums"]["room_status"]
          template_id?: string
          tier?: Database["public"]["Enums"]["room_tier"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_shot?: Json | null
          expires_at?: string
          filter_id?: string
          host_id?: string
          id?: string
          retake_queue?: number[]
          status?: Database["public"]["Enums"]["room_status"]
          template_id?: string
          tier?: Database["public"]["Enums"]["room_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          active: boolean
          definition: Json | null
          id: string
          name: string
          sort: number
          tier: Database["public"]["Enums"]["room_tier"]
        }
        Insert: {
          active?: boolean
          definition?: Json | null
          id: string
          name: string
          sort: number
          tier: Database["public"]["Enums"]["room_tier"]
        }
        Update: {
          active?: boolean
          definition?: Json | null
          id?: string
          name?: string
          sort?: number
          tier?: Database["public"]["Enums"]["room_tier"]
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_room: { Args: never; Returns: Json }
      delete_result: { Args: { p_slug: string }; Returns: undefined }
      finish_session: { Args: { p_room: string }; Returns: string }
      frame_captured: {
        Args: { p_captured_at: number; p_idx: number; p_room: string; p_version: number }
        Returns: undefined
      }
      frame_uploaded: {
        Args: {
          p_idx: number
          p_path: string
          p_room: string
          p_version: number
        }
        Returns: undefined
      }
      get_public_result: { Args: { p_slug: string }; Returns: Json }
      get_room: { Args: { p_room: string }; Returns: Json }
      is_result_member: { Args: { p_slug: string }; Returns: boolean }
      join_room: { Args: { p_code: string }; Returns: Json }
      landing_stats: { Args: never; Returns: Json }
      leave_room: { Args: { p_room: string }; Returns: undefined }
      mock_upgrade: { Args: { p_room: string }; Returns: undefined }
      file_report: { Args: { p_note?: string; p_reason?: string; p_slug: string }; Returns: Json }
      admin_report_queue: { Args: never; Returns: Json }
      admin_feedback_list: { Args: never; Returns: Json }
      admin_feedback_resolve: { Args: { p_id: string; p_resolved: boolean }; Returns: undefined }
      submit_feedback: {
        Args: {
          p_email?: string
          p_kind: string
          p_message: string
          p_meta?: Json
          p_page?: string
          p_room_code?: string
          p_suspect?: boolean
          p_user_agent?: string
        }
        Returns: Json
      }
      admin_resolve: { Args: { p_slug: string; p_takedown: boolean }; Returns: undefined }
      request_retake: { Args: { p_indices: number[]; p_room: string }; Returns: undefined }
      resume_shot: {
        Args: { p_room: string; p_version: number }
        Returns: undefined
      }
      server_now: { Args: never; Returns: number }
      set_filter: { Args: { p_filter: string; p_room: string }; Returns: undefined }
      set_nickname: { Args: { p_nickname: string; p_room: string }; Returns: undefined }
      set_ready: { Args: { p_ready: boolean; p_room: string }; Returns: undefined }
      set_template: { Args: { p_room: string; p_template: string }; Returns: undefined }
      skip_prompt: { Args: { p_room: string; p_version: number }; Returns: undefined }
    }
    Enums: {
      participant_role: "host" | "guest"
      room_status: "waiting" | "lobby" | "capturing" | "review" | "done" | "expired"
      room_tier: "free" | "premium"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
