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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      events: {
        Row: {
          attendees: string[]
          capacity: number | null
          category: string
          city: string
          cost: string
          created_at: string
          created_by: string | null
          date: string
          distance_mi: number
          duration_label: string
          duration_minutes: number | null
          going_count: number
          hidden: boolean
          id: string
          ip_address: unknown
          latitude: number | null
          location: string | null
          longitude: number | null
          map_x: number
          map_y: number
          maybe_count: number
          notes: string
          organizer: string
          photo_url: string | null
          state: string
          street: string | null
          time: string
          title: string
          website: string | null
          zip: string | null
        }
        Insert: {
          attendees?: string[]
          capacity?: number | null
          category: string
          city: string
          cost?: string
          created_at?: string
          created_by?: string | null
          date: string
          distance_mi?: number
          duration_label: string
          duration_minutes?: number | null
          going_count?: number
          hidden?: boolean
          id?: string
          ip_address?: unknown
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          map_x?: number
          map_y?: number
          maybe_count?: number
          notes?: string
          organizer: string
          photo_url?: string | null
          state: string
          street?: string | null
          time: string
          title: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          attendees?: string[]
          capacity?: number | null
          category?: string
          city?: string
          cost?: string
          created_at?: string
          created_by?: string | null
          date?: string
          distance_mi?: number
          duration_label?: string
          duration_minutes?: number | null
          going_count?: number
          hidden?: boolean
          id?: string
          ip_address?: unknown
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          map_x?: number
          map_y?: number
          maybe_count?: number
          notes?: string
          organizer?: string
          photo_url?: string | null
          state?: string
          street?: string | null
          time?: string
          title?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      geocode_cache: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          lat: number
          lng: number
          normalized_address: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          lat: number
          lng: number
          normalized_address: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          lat?: number
          lng?: number
          normalized_address?: string
        }
        Relationships: []
      }
      impact_logs: {
        Row: {
          bags: number
          created_at: string
          event_id: string
          id: string
          miles: number
          owner_id: string
          people: number
        }
        Insert: {
          bags?: number
          created_at?: string
          event_id: string
          id?: string
          miles?: number
          owner_id?: string
          people?: number
        }
        Update: {
          bags?: number
          created_at?: string
          event_id?: string
          id?: string
          miles?: number
          owner_id?: string
          people?: number
        }
        Relationships: [
          {
            foreignKeyName: "impact_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_items: {
        Row: {
          created_at: string
          event_id: string
          id: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_sent: {
        Row: {
          event_id: string
          id: string
          kind: string
          sent_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          kind: string
          sent_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          kind?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sent_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      org_impact_totals: {
        Row: {
          active_members: number
          bags_trash: number
          events_held: number
          lives_impacted: number
          miles_rucked: number
          period: string
        }
        Insert: {
          active_members: number
          bags_trash: number
          events_held: number
          lives_impacted: number
          miles_rucked: number
          period: string
        }
        Update: {
          active_members?: number
          bags_trash?: number
          events_held?: number
          lives_impacted?: number
          miles_rucked?: number
          period?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          contact: string | null
          created_at: string
          event_reminders: boolean
          home_city: string | null
          home_lat: number | null
          home_lng: number | null
          home_state: string | null
          home_zip: string | null
          id: string
          name: string | null
          new_events_nearby: boolean
        }
        Insert: {
          avatar_url?: string | null
          contact?: string | null
          created_at?: string
          event_reminders?: boolean
          home_city?: string | null
          home_lat?: number | null
          home_lng?: number | null
          home_state?: string | null
          home_zip?: string | null
          id?: string
          name?: string | null
          new_events_nearby?: boolean
        }
        Update: {
          avatar_url?: string | null
          contact?: string | null
          created_at?: string
          event_reminders?: boolean
          home_city?: string | null
          home_lat?: number | null
          home_lng?: number | null
          home_state?: string | null
          home_zip?: string | null
          id?: string
          name?: string | null
          new_events_nearby?: boolean
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          event_id: string
          id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          reason: string
          reporter_id?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          attendee_id: string
          created_at: string
          event_id: string
          id: string
          status: string
        }
        Insert: {
          attendee_id?: string
          created_at?: string
          event_id: string
          id?: string
          status: string
        }
        Update: {
          attendee_id?: string
          created_at?: string
          event_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      haversine_miles: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
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
    Enums: {},
  },
} as const
