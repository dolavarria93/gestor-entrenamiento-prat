export type Role = "super_admin" | "admin_club" | "entrenador" | "apoderado" | "directiva";
export type Categoria = "Mini" | "Sub15" | "Sub18";
export type Periodo = "Pretemporada" | "Mitad de temporada" | "Cierre de temporada";

export interface Database {
  public: {
    Tables: {
      clubs: {
        Row: { id: string; nombre: string; comuna: string | null; region: string | null; created_at: string };
        Insert: { id?: string; nombre: string; comuna?: string | null; region?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["clubs"]["Insert"]>;
      };
      teams: {
        Row: { id: string; club_id: string; nombre: string; categoria: Categoria; created_at: string };
        Insert: { id?: string; club_id: string; nombre: string; categoria: Categoria; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
      };
      plan_progresion: {
        Row: { id: string; categoria: Categoria; orden: number; titulo: string; contenido: string };
        Insert: { id?: string; categoria: Categoria; orden: number; titulo: string; contenido: string };
        Update: Partial<Database["public"]["Tables"]["plan_progresion"]["Insert"]>;
      };
      profiles: {
        Row: { id: string; club_id: string | null; role: Role; nombre: string; created_at: string };
        Insert: { id: string; club_id?: string | null; role: Role; nombre: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      coaches: {
        Row: { id: string; club_id: string; user_id: string; nombre: string; created_at: string };
        Insert: { id?: string; club_id: string; user_id: string; nombre: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["coaches"]["Insert"]>;
      };
      coach_teams: {
        Row: { coach_id: string; team_id: string };
        Insert: { coach_id: string; team_id: string };
        Update: Partial<Database["public"]["Tables"]["coach_teams"]["Insert"]>;
      };
      players: {
        Row: {
          id: string;
          team_id: string;
          nombre: string;
          fecha_nacimiento: string | null;
          posicion: string | null;
          notas: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          nombre: string;
          fecha_nacimiento?: string | null;
          posicion?: string | null;
          notas?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
      };
      guardians: {
        Row: { id: string; user_id: string; nombre: string; created_at: string };
        Insert: { id?: string; user_id: string; nombre: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["guardians"]["Insert"]>;
      };
      guardian_players: {
        Row: { guardian_id: string; player_id: string };
        Insert: { guardian_id: string; player_id: string };
        Update: Partial<Database["public"]["Tables"]["guardian_players"]["Insert"]>;
      };
      sessions: {
        Row: {
          id: string;
          team_id: string;
          coach_id: string;
          fecha: string;
          contenido_planificado: string | null;
          contenido_realizado: string | null;
          observaciones: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          coach_id: string;
          fecha: string;
          contenido_planificado?: string | null;
          contenido_realizado?: string | null;
          observaciones?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
      };
      attendance: {
        Row: { id: string; session_id: string; player_id: string; presente: boolean };
        Insert: { id?: string; session_id: string; player_id: string; presente?: boolean };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
      };
      evaluations: {
        Row: {
          id: string;
          player_id: string;
          periodo: Periodo;
          fundamento: string;
          puntaje: number;
          notas: string | null;
          evaluado_por: string | null;
          fecha: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          periodo: Periodo;
          fundamento: string;
          puntaje: number;
          notas?: string | null;
          evaluado_por?: string | null;
          fecha?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["evaluations"]["Insert"]>;
      };
      announcements: {
        Row: {
          id: string;
          club_id: string;
          team_id: string | null;
          titulo: string;
          mensaje: string;
          fecha: string;
          autor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          team_id?: string | null;
          titulo: string;
          mensaje: string;
          fecha?: string;
          autor_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Insert"]>;
      };
    };
  };
}
