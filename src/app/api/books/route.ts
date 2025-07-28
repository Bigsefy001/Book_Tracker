// app/api/books/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { CreateBookRequest } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabase
      .from('books')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (status && ['reading', 'completed', 'wishlist'].includes(status)) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%, author.ilike.%${search}%`)
    }

    const { data: books, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ books })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateBookRequest = await request.json()
    
    if (!body.title || !body.author) {
      return NextResponse.json({ error: 'Title and author are required' }, { status: 400 })
    }

    if (!['reading', 'completed', 'wishlist'].includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data: book, error } = await supabase
      .from('books')
      .insert({
        title: body.title.trim(),
        author: body.author.trim(),
        status: body.status,
        user_id: session.user.id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ book }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pathname } = new URL(request.url)
    const id = pathname.split('/').pop()

    if (!id) {
      return NextResponse.json({ error: 'Book ID is required' }, { status: 400 })
    }

    const { data: existingBook, error: fetchError } = await supabase
      .from('books')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !existingBook) {
      return NextResponse.json({ error: 'Book not found or unauthorized' }, { status: 404 })
    }

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}