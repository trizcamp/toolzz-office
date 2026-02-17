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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      board_members: {
        Row: {
          board_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_members_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          sector: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sector?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sector?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      document_blocks: {
        Row: {
          checked: boolean | null
          content: string | null
          created_at: string
          document_id: string
          id: string
          metadata: Json | null
          position: number
          type: Database["public"]["Enums"]["block_type"]
          updated_at: string
        }
        Insert: {
          checked?: boolean | null
          content?: string | null
          created_at?: string
          document_id: string
          id?: string
          metadata?: Json | null
          position?: number
          type?: Database["public"]["Enums"]["block_type"]
          updated_at?: string
        }
        Update: {
          checked?: boolean | null
          content?: string | null
          created_at?: string
          document_id?: string
          id?: string
          metadata?: Json | null
          position?: number
          type?: Database["public"]["Enums"]["block_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_blocks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_comments: {
        Row: {
          created_at: string
          document_id: string
          id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          icon: string | null
          id: string
          task_id: string | null
          title: string
          type: Database["public"]["Enums"]["doc_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          task_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["doc_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          task_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["doc_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      github_integrations: {
        Row: {
          access_token: string
          created_at: string
          github_username: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          github_username?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          github_username?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meeting_participants: {
        Row: {
          id: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          id?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          id?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_tasks: {
        Row: {
          id: string
          meeting_id: string
          task_id: string
        }
        Insert: {
          id?: string
          meeting_id: string
          task_id: string
        }
        Update: {
          id?: string
          meeting_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcripts: {
        Row: {
          created_at: string
          id: string
          meeting_id: string
          speaker_id: string | null
          text: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id: string
          speaker_id?: string | null
          text: string
          timestamp?: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string
          speaker_id?: string | null
          text?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcripts_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          end_time: string | null
          id: string
          meeting_code: string | null
          room_id: string | null
          start_time: string | null
          status: string
          summary: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          id?: string
          meeting_code?: string | null
          room_id?: string | null
          start_time?: string | null
          status?: string
          summary?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          id?: string
          meeting_code?: string | null
          room_id?: string | null
          start_time?: string | null
          status?: string
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          language: string | null
          name: string
          phone: string | null
          surname: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id: string
          language?: string | null
          name?: string
          phone?: string | null
          surname?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          language?: string | null
          name?: string
          phone?: string | null
          surname?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          id: string
          room_id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["room_type"]
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          type?: Database["public"]["Enums"]["room_type"]
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["room_type"]
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_votes: {
        Row: {
          created_at: string
          id: string
          points: number
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points: number
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_votes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          board_id: string
          created_at: string
          created_by: string | null
          delivery_date: string | null
          description: string | null
          display_id: string
          document_id: string | null
          github_issue_number: number | null
          github_issue_url: string | null
          github_repo: string | null
          id: string
          parent_id: string | null
          points: number | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          board_id: string
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          description?: string | null
          display_id?: string
          document_id?: string | null
          github_issue_number?: number | null
          github_issue_url?: string | null
          github_repo?: string | null
          id?: string
          parent_id?: string | null
          points?: number | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          board_id?: string
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          description?: string | null
          display_id?: string
          document_id?: string | null
          github_issue_number?: number | null
          github_issue_url?: string | null
          github_repo?: string | null
          id?: string
          parent_id?: string | null
          points?: number | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      type_definitions: {
        Row: {
          board_id: string
          color_classes: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          board_id: string
          color_classes?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          board_id?: string
          color_classes?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "type_definitions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
      block_type:
        | "paragraph"
        | "heading1"
        | "heading2"
        | "heading3"
        | "bulletList"
        | "numberedList"
        | "todoList"
        | "code"
        | "quote"
        | "callout"
        | "divider"
        | "toggle"
        | "image"
      doc_type: "doc" | "spec" | "note"
      room_type: "voice" | "text" | "hybrid"
      task_priority: "critical" | "high" | "medium" | "low"
      task_status: "backlog" | "todo" | "in_progress" | "review" | "done"
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
      app_role: ["admin", "member"],
      block_type: [
        "paragraph",
        "heading1",
        "heading2",
        "heading3",
        "bulletList",
        "numberedList",
        "todoList",
        "code",
        "quote",
        "callout",
        "divider",
        "toggle",
        "image",
      ],
      doc_type: ["doc", "spec", "note"],
      room_type: ["voice", "text", "hybrid"],
      task_priority: ["critical", "high", "medium", "low"],
      task_status: ["backlog", "todo", "in_progress", "review", "done"],
    },
  },
} as const
