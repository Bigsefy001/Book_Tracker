// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Book } from '@/types/database'

export default function Dashboard() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [addingBook, setAddingBook] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    status: 'reading' as 'reading' | 'completed' | 'wishlist'
  })
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [user, setUser] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchBooks()
  }, [filter, search])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/auth/login')
      return
    }
    setUser(session.user)
  }

  const fetchBooks = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const params = new URLSearchParams()
      if (filter) params.append('status', filter)
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/books?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setBooks(data.books)
      } else {
        console.error('Error fetching books:', data.error)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingBook(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setBooks([data.book, ...books])
        setFormData({ title: '', author: '', status: 'reading' })
      } else {
        alert('Error adding book: ' + data.error)
      }
    } catch (error) {
      alert('Error adding book')
    } finally {
      setAddingBook(false)
    }
  }

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        setBooks(books.filter(book => book.id !== id))
      } else {
        const data = await response.json()
        alert('Error deleting book: ' + data.error)
      }
    } catch (error) {
      alert('Error deleting book')
    }
  }

  const handleUpdateStatus = async (id: string, status: 'reading' | 'completed' | 'wishlist') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/books/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (response.ok) {
        setBooks(books.map(book => 
          book.id === id ? { ...book, status } : book
        ))
      } else {
        alert('Error updating book: ' + data.error)
      }
    } catch (error) {
      alert('Error updating book')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      reading: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      wishlist: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Book Tracker</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Book</h2>
            <form onSubmit={handleAddBook} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <input
                type="text"
                placeholder="Book title"
                required
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Author"
                required
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="reading">Reading</option>
                <option value="completed">Completed</option>
                <option value="wishlist">Wishlist</option>
              </select>
              <button
                type="submit"
                disabled={addingBook}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {addingBook ? 'Adding...' : 'Add Book'}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Search books by title or author..."
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">All Books</option>
                <option value="reading">Reading</option>
                <option value="completed">Completed</option>
                <option value="wishlist">Wishlist</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">
              Your Books ({books.length})
            </h2>
          </div>
          {books.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No books found. Add your first book above!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {books.map((book) => (
                <li key={book.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {book.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            by {book.author}
                          </p>
                          <p className="text-xs text-gray-400">
                            Added {new Date(book.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4">
                          <select
                            value={book.status}
                            onChange={(e) => handleUpdateStatus(book.id, e.target.value as any)}
                            className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(book.status)}`}
                          >
                            <option value="reading">Reading</option>
                            <option value="completed">Completed</option>
                            <option value="wishlist">Wishlist</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}