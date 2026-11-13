export type UserRole = "fan" | "artist" | "label";
export type LabelPlan = "none" | "starter" | "unlimited";
export type ArtistPlan = "none" | "annual";
export type ReleaseType = "single" | "album";
export type ReleaseStatus = "draft" | "published";
export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";
export type PaymentMethod =
  | "mtn"
  | "orange"
  | "wave"
  | "airtel"
  | "vodacom"
  | "moov"
  | "africell"
  | "mpesa"
  | "apple"
  | "free"
  | "coris"
  | "celtiis";
export type ReportReason =
  | "copyright"
  | "illegal"
  | "spam"
  | "hate"
  | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

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
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          country: string | null;
          phone: string | null;
          bio: string | null;
          genres: string[];
          onboarding_completed: boolean;
          label_plan: LabelPlan;
          label_plan_expires_at: string | null;
          artist_plan: ArtistPlan;
          artist_plan_expires_at: string | null;
          balance_fcfa: number;
          is_admin: boolean;
          is_suspended: boolean;
          login_otp_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          country?: string | null;
          phone?: string | null;
          bio?: string | null;
          genres?: string[];
          onboarding_completed?: boolean;
          label_plan?: LabelPlan;
          label_plan_expires_at?: string | null;
          artist_plan?: ArtistPlan;
          artist_plan_expires_at?: string | null;
          balance_fcfa?: number;
          is_admin?: boolean;
          is_suspended?: boolean;
          login_otp_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          country?: string | null;
          phone?: string | null;
          bio?: string | null;
          genres?: string[];
          onboarding_completed?: boolean;
          label_plan?: LabelPlan;
          label_plan_expires_at?: string | null;
          artist_plan?: ArtistPlan;
          artist_plan_expires_at?: string | null;
          balance_fcfa?: number;
          is_admin?: boolean;
          is_suspended?: boolean;
          login_otp_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      creator_login_challenges: {
        Row: {
          id: string;
          user_id: string;
          code_hash: string;
          expires_at: string;
          attempts: number;
          session_payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code_hash: string;
          expires_at: string;
          attempts?: number;
          session_payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code_hash?: string;
          expires_at?: string;
          attempts?: number;
          session_payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creator_login_challenges_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      artists: {
        Row: {
          id: string;
          public_id: string;
          owner_id: string;
          label_id: string | null;
          stage_name: string;
          bio: string | null;
          avatar_url: string | null;
          country: string | null;
          is_verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          public_id?: string;
          owner_id: string;
          label_id?: string | null;
          stage_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          country?: string | null;
          is_verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          public_id?: string;
          owner_id?: string;
          label_id?: string | null;
          stage_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          country?: string | null;
          is_verified?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artists_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "artists_label_id_fkey";
            columns: ["label_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      releases: {
        Row: {
          id: string;
          public_id: string;
          artist_id: string;
          owner_id: string;
          type: ReleaseType;
          title: string;
          cover_url: string | null;
          price_fcfa: number;
          genre: string | null;
          status: ReleaseStatus;
          is_hidden: boolean;
          hidden_by_suspension: boolean;
          credits: Json;
          featuring: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          public_id?: string;
          artist_id: string;
          owner_id: string;
          type: ReleaseType;
          title: string;
          cover_url?: string | null;
          price_fcfa?: number;
          genre?: string | null;
          status?: ReleaseStatus;
          is_hidden?: boolean;
          hidden_by_suspension?: boolean;
          credits?: Json;
          featuring?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          public_id?: string;
          artist_id?: string;
          owner_id?: string;
          type?: ReleaseType;
          title?: string;
          cover_url?: string | null;
          price_fcfa?: number;
          genre?: string | null;
          status?: ReleaseStatus;
          is_hidden?: boolean;
          hidden_by_suspension?: boolean;
          credits?: Json;
          featuring?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "releases_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "releases_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tracks: {
        Row: {
          id: string;
          release_id: string;
          title: string;
          audio_url: string | null;
          track_number: number;
          duration_seconds: number | null;
          is_explicit: boolean;
          price_fcfa: number | null;
          credits: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          release_id: string;
          title: string;
          audio_url?: string | null;
          track_number?: number;
          duration_seconds?: number | null;
          is_explicit?: boolean;
          price_fcfa?: number | null;
          credits?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          release_id?: string;
          title?: string;
          audio_url?: string | null;
          track_number?: number;
          duration_seconds?: number | null;
          is_explicit?: boolean;
          price_fcfa?: number | null;
          credits?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tracks_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          id: string;
          buyer_id: string;
          seller_id: string;
          release_id: string;
          track_id: string | null;
          amount_fcfa: number;
          commission_fcfa: number;
          artist_net_fcfa: number;
          payment_method: PaymentMethod;
          status: PaymentStatus;
          created_at: string;
          order_id: string | null;
          provider: string;
          provider_transaction_id: string | null;
          payer_phone: string | null;
          provider_meta: Json;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          seller_id: string;
          release_id: string;
          track_id?: string | null;
          amount_fcfa: number;
          commission_fcfa: number;
          artist_net_fcfa: number;
          payment_method: PaymentMethod;
          status?: PaymentStatus;
          created_at?: string;
          order_id?: string | null;
          provider?: string;
          provider_transaction_id?: string | null;
          payer_phone?: string | null;
          provider_meta?: Json;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          seller_id?: string;
          release_id?: string;
          track_id?: string | null;
          amount_fcfa?: number;
          commission_fcfa?: number;
          artist_net_fcfa?: number;
          payment_method?: PaymentMethod;
          status?: PaymentStatus;
          created_at?: string;
          order_id?: string | null;
          provider?: string;
          provider_transaction_id?: string | null;
          payer_phone?: string | null;
          provider_meta?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      withdrawals: {
        Row: {
          id: string;
          profile_id: string;
          amount_fcfa: number;
          payment_method: PaymentMethod;
          phone: string;
          status: PaymentStatus;
          order_id: string | null;
          provider: string;
          provider_transaction_id: string | null;
          beneficiary: string | null;
          provider_meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          amount_fcfa: number;
          payment_method: PaymentMethod;
          phone: string;
          status?: PaymentStatus;
          order_id?: string | null;
          provider?: string;
          provider_transaction_id?: string | null;
          beneficiary?: string | null;
          provider_meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          amount_fcfa?: number;
          payment_method?: PaymentMethod;
          phone?: string;
          status?: PaymentStatus;
          order_id?: string | null;
          provider?: string;
          provider_transaction_id?: string | null;
          beneficiary?: string | null;
          provider_meta?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "withdrawals_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      label_plan_orders: {
        Row: {
          id: string;
          user_id: string;
          plan: LabelPlan;
          amount_fcfa: number;
          payment_method: PaymentMethod;
          order_id: string;
          status: PaymentStatus;
          provider: string;
          provider_transaction_id: string | null;
          payer_phone: string | null;
          provider_meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: LabelPlan;
          amount_fcfa: number;
          payment_method: PaymentMethod;
          order_id: string;
          status?: PaymentStatus;
          provider?: string;
          provider_transaction_id?: string | null;
          payer_phone?: string | null;
          provider_meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: LabelPlan;
          amount_fcfa?: number;
          payment_method?: PaymentMethod;
          order_id?: string;
          status?: PaymentStatus;
          provider?: string;
          provider_transaction_id?: string | null;
          payer_phone?: string | null;
          provider_meta?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "label_plan_orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      artist_plan_orders: {
        Row: {
          id: string;
          user_id: string;
          plan: string;
          amount_fcfa: number;
          payment_method: PaymentMethod;
          order_id: string;
          status: PaymentStatus;
          provider: string;
          provider_transaction_id: string | null;
          payer_phone: string | null;
          provider_meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: string;
          amount_fcfa: number;
          payment_method: PaymentMethod;
          order_id: string;
          status?: PaymentStatus;
          provider?: string;
          provider_transaction_id?: string | null;
          payer_phone?: string | null;
          provider_meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: string;
          amount_fcfa?: number;
          payment_method?: PaymentMethod;
          order_id?: string;
          status?: PaymentStatus;
          provider?: string;
          provider_transaction_id?: string | null;
          payer_phone?: string | null;
          provider_meta?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artist_plan_orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          release_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          release_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          release_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
        ];
      };
      track_reports: {
        Row: {
          id: string;
          track_id: string;
          reporter_id: string;
          reason: ReportReason;
          details: string;
          status: ReportStatus;
          admin_note: string;
          created_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          track_id: string;
          reporter_id: string;
          reason: ReportReason;
          details?: string;
          status?: ReportStatus;
          admin_note?: string;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          track_id?: string;
          reporter_id?: string;
          reason?: ReportReason;
          details?: string;
          status?: ReportStatus;
          admin_note?: string;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "track_reports_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "track_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      feature_flags: {
        Row: {
          key: string;
          enabled: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          enabled?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          enabled?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: number;
          maintenance_enabled: boolean;
          maintenance_message: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          maintenance_enabled?: boolean;
          maintenance_message?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: number;
          maintenance_enabled?: boolean;
          maintenance_message?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      library_items: {
        Row: {
          id: string;
          user_id: string;
          release_id: string;
          purchase_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          release_id: string;
          purchase_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          release_id?: string;
          purchase_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "library_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_items_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "library_items_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          cover_url: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          cover_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          cover_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      playlist_saves: {
        Row: {
          id: string;
          user_id: string;
          playlist_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          playlist_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          playlist_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "playlist_saves_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playlist_saves_playlist_id_fkey";
            columns: ["playlist_id"];
            isOneToOne: false;
            referencedRelation: "playlists";
            referencedColumns: ["id"];
          },
        ];
      };
      playlist_tracks: {
        Row: {
          id: string;
          playlist_id: string;
          track_id: string;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          track_id: string;
          position?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          track_id?: string;
          position?: number;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey";
            columns: ["playlist_id"];
            isOneToOne: false;
            referencedRelation: "playlists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      editorial_hits: {
        Row: {
          id: string;
          track_id: string;
          release_id: string;
          title: string | null;
          cover_url: string | null;
          position: number;
          is_published: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          release_id: string;
          title?: string | null;
          cover_url?: string | null;
          position?: number;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          track_id?: string;
          release_id?: string;
          title?: string | null;
          cover_url?: string | null;
          position?: number;
          is_published?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "editorial_hits_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: true;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "editorial_hits_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "editorial_hits_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      track_plays: {
        Row: {
          id: string;
          track_id: string;
          release_id: string;
          owner_id: string;
          listener_id: string | null;
          country: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          release_id: string;
          owner_id: string;
          listener_id?: string | null;
          country?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          track_id?: string;
          release_id?: string;
          owner_id?: string;
          listener_id?: string | null;
          country?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "track_plays_track_id_fkey";
            columns: ["track_id"];
            isOneToOne: false;
            referencedRelation: "tracks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "track_plays_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "track_plays_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      system_logs: {
        Row: {
          id: string;
          level: string;
          source: string;
          message: string;
          stack: string | null;
          path: string | null;
          digest: string | null;
          user_agent: string | null;
          user_id: string | null;
          context: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          level?: string;
          source: string;
          message: string;
          stack?: string | null;
          path?: string | null;
          digest?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          context?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          level?: string;
          source?: string;
          message?: string;
          stack?: string | null;
          path?: string | null;
          digest?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          context?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "system_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_creator_retro: {
        Args: {
          p_start: string;
          p_end: string;
        };
        Returns: Json;
      };
      get_release_engagement: {
        Args: {
          since_ts: string;
          purchase_weight?: number;
          play_weight?: number;
        };
        Returns: {
          release_id: string;
          score: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      label_plan: LabelPlan;
      artist_plan: ArtistPlan;
      release_type: ReleaseType;
      release_status: ReleaseStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      report_reason: ReportReason;
      report_status: ReportStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Note: payment_method enum élargi (vodacom, moov, africell) via migration 007

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Artist = Database["public"]["Tables"]["artists"]["Row"];
export type Release = Database["public"]["Tables"]["releases"]["Row"];
export type Track = Database["public"]["Tables"]["tracks"]["Row"];
export type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
export type EditorialHit = Database["public"]["Tables"]["editorial_hits"]["Row"];
