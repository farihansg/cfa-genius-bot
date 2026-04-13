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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_history: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          auto_invest_enabled: boolean | null
          bond_target_pct: number | null
          buy_on_dip: boolean | null
          dca_amount_usd: number | null
          dca_frequency: string | null
          dividend_focus: boolean | null
          esg_filter: boolean | null
          id: string
          investing_style: string | null
          max_position_pct: number | null
          notify_before_invest: boolean | null
          rebalance_frequency: string | null
          reit_target_pct: number | null
          risk_level: string | null
          sell_orders_allowed: boolean | null
          stock_target_pct: number | null
          time_horizon: string | null
          updated_at: string | null
        }
        Insert: {
          auto_invest_enabled?: boolean | null
          bond_target_pct?: number | null
          buy_on_dip?: boolean | null
          dca_amount_usd?: number | null
          dca_frequency?: string | null
          dividend_focus?: boolean | null
          esg_filter?: boolean | null
          id: string
          investing_style?: string | null
          max_position_pct?: number | null
          notify_before_invest?: boolean | null
          rebalance_frequency?: string | null
          reit_target_pct?: number | null
          risk_level?: string | null
          sell_orders_allowed?: boolean | null
          stock_target_pct?: number | null
          time_horizon?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_invest_enabled?: boolean | null
          bond_target_pct?: number | null
          buy_on_dip?: boolean | null
          dca_amount_usd?: number | null
          dca_frequency?: string | null
          dividend_focus?: boolean | null
          esg_filter?: boolean | null
          id?: string
          investing_style?: string | null
          max_position_pct?: number | null
          notify_before_invest?: boolean | null
          rebalance_frequency?: string | null
          reit_target_pct?: number | null
          risk_level?: string | null
          sell_orders_allowed?: boolean | null
          stock_target_pct?: number | null
          time_horizon?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trade_log: {
        Row: {
          ai_rationale: string | null
          alpaca_order_id: string | null
          created_at: string | null
          filled_avg_price: number | null
          id: string
          notional: number | null
          order_type: string | null
          qty: number | null
          side: string
          status: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          ai_rationale?: string | null
          alpaca_order_id?: string | null
          created_at?: string | null
          filled_avg_price?: number | null
          id?: string
          notional?: number | null
          order_type?: string | null
          qty?: number | null
          side?: string
          status?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          ai_rationale?: string | null
          alpaca_order_id?: string | null
          created_at?: string | null
          filled_avg_price?: number | null
          id?: string
          notional?: number | null
          order_type?: string | null
          qty?: number | null
          side?: string
          status?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: []
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
