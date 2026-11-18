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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      collaborateurs: {
        Row: {
          code_service: string
          competences_cles: string[]
          created_at: string
          date_embauche: string
          date_fin_contrat: string | null
          date_naissance: string
          email: string
          id_collaborateur: number
          id_manager: number | null
          intitule_poste: string
          niveau_classification: string
          niveau_formation: string | null
          nom: string
          prenom: string
          profil_acces: string
          salaire_brut_mensuel: number
          solde_cp: number
          solde_rtt: number
          taux_temps_travail: number
          type_contrat: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code_service: string
          competences_cles?: string[]
          created_at?: string
          date_embauche: string
          date_fin_contrat?: string | null
          date_naissance: string
          email: string
          id_collaborateur: number
          id_manager?: number | null
          intitule_poste: string
          niveau_classification: string
          niveau_formation?: string | null
          nom: string
          prenom: string
          profil_acces: string
          salaire_brut_mensuel: number
          solde_cp?: number
          solde_rtt?: number
          taux_temps_travail: number
          type_contrat: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code_service?: string
          competences_cles?: string[]
          created_at?: string
          date_embauche?: string
          date_fin_contrat?: string | null
          date_naissance?: string
          email?: string
          id_collaborateur?: number
          id_manager?: number | null
          intitule_poste?: string
          niveau_classification?: string
          niveau_formation?: string | null
          nom?: string
          prenom?: string
          profil_acces?: string
          salaire_brut_mensuel?: number
          solde_cp?: number
          solde_rtt?: number
          taux_temps_travail?: number
          type_contrat?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          author_name: string | null
          author_user_id: string
          created_at: string
          created_count: number
          encoding: string | null
          file_name: string | null
          id: string
          rejected_count: number
          report: Json
          total_rows: number
          updated_count: number
          warning_count: number
        }
        Insert: {
          author_name?: string | null
          author_user_id?: string
          created_at?: string
          created_count?: number
          encoding?: string | null
          file_name?: string | null
          id?: string
          rejected_count?: number
          report?: Json
          total_rows?: number
          updated_count?: number
          warning_count?: number
        }
        Update: {
          author_name?: string | null
          author_user_id?: string
          created_at?: string
          created_count?: number
          encoding?: string | null
          file_name?: string | null
          id?: string
          rejected_count?: number
          report?: Json
          total_rows?: number
          updated_count?: number
          warning_count?: number
        }
        Relationships: []
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
      can_view_collaborateur: { Args: { _id: number }; Returns: boolean }
      collaborateur_access: { Args: { _id: number }; Returns: string }
      current_collaborateur_id: { Args: never; Returns: number }
      get_manager_of: {
        Args: { _id: number }
        Returns: {
          can_open: boolean
          code_service: string
          id_collaborateur: number
          intitule_poste: string
          nom: string
          prenom: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "RH_ADMIN" | "MANAGER" | "COLLABORATEUR"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["RH_ADMIN", "MANAGER", "COLLABORATEUR"],
    },
  },
} as const
