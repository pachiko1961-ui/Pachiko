export type WsPostStatus = 'draft' | 'published';

export interface WsPostRow {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  youtube_url: string | null;
  status: WsPostStatus;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface WsCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface WsTagRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface WsPostTagRow {
  post_id: string;
  tag_id: string;
}

export interface Database {
  public: {
    Tables: {
      WS_post: {
        Row: WsPostRow;
        Insert: Omit<WsPostRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WsPostRow, 'id' | 'created_at'>>;
      };
      WS_category: {
        Row: WsCategoryRow;
        Insert: Omit<WsCategoryRow, 'id' | 'created_at'>;
        Update: Partial<Omit<WsCategoryRow, 'id' | 'created_at'>>;
      };
      WS_tag: {
        Row: WsTagRow;
        Insert: Omit<WsTagRow, 'id' | 'created_at'>;
        Update: Partial<Omit<WsTagRow, 'id' | 'created_at'>>;
      };
      WS_post_tag: {
        Row: WsPostTagRow;
        Insert: WsPostTagRow;
        Update: Partial<WsPostTagRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      ws_post_status: WsPostStatus;
    };
  };
}
