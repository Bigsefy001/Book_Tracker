// types/database.ts
export interface Book {
  id: string
  user_id: string
  title: string
  author: string
  status: 'reading' | 'completed' | 'wishlist'
  created_at: string
}

export interface CreateBookRequest {
  title: string
  author: string
  status: 'reading' | 'completed' | 'wishlist'
}

export interface UpdateBookRequest {
  title?: string
  author?: string
  status?: 'reading' | 'completed' | 'wishlist'
}