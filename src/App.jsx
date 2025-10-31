import { useEffect, useState } from 'react'
import './App.css'
import supabase from './supabase-client'

function App() {
  const [todoList, setTodoList] = useState([])
  const [newTodo, setNewTodo] = useState('')

  // --- Add Todo ---
  const addTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    const { data, error } = await supabase
      .from('TodoList')
      .insert([{ name: newTodo, isCompleted: false }])
      .select()
      .single()

    if (error) {
      console.error('Error adding todo:', error.message)
      return
    }

    // Optional optimistic UI update
    setTodoList((prev) => [...prev, data])
    setNewTodo('')
  }

  // --- Delete Todo ---
  const deleteTodo = async (id) => {
    const { error } = await supabase.from('TodoList').delete().eq('id', id)

    if (error) {
      console.error('Error deleting todo:', error.message)
      return
    }

    // Local immediate UI update
    setTodoList((prev) => prev.filter((t) => t.id !== id))
  }

  // --- Fetch initial data + subscribe to realtime ---
  useEffect(() => {
    const fetchTodos = async () => {
      const { data, error } = await supabase.from('TodoList').select('*').order('created_at', { ascending: true })
      if (error) {
        console.error('Error fetching todos:', error.message)
      } else {
        setTodoList(data)
      }
    }

    fetchTodos()

    // ✅ Realtime subscription
    const channel = supabase
      .channel('public:TodoList')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'TodoList' },
        (payload) => {
          console.log('Realtime change:', payload)

          if (payload.eventType === 'INSERT') {
            setTodoList((prev) => {
              if (prev.some((t) => t.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          }

          if (payload.eventType === 'UPDATE') {
            setTodoList((prev) =>
              prev.map((t) => (t.id === payload.new.id ? payload.new : t))
            )
          }

          if (payload.eventType === 'DELETE') {
            setTodoList((prev) => prev.filter((t) => t.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to TodoList realtime updates')
        }
      })

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
      <h1>🧾 Todo List (Supabase Realtime)</h1>

      <form onSubmit={addTodo} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="New todo..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          style={{
            padding: 8,
            width: '70%',
            borderRadius: 4,
            border: '1px solid #ccc',
          }}
        />
        <button
          type="submit"
          style={{
            padding: 8,
            marginLeft: 8,
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
          }}
        >
          Add
        </button>
      </form>

      {todoList.length > 0 ? (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {todoList.map((item) => (
            <li
              key={item.id}
              style={{
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                // background: '#f9f9f9',
                padding: '6px 12px',
                borderRadius: 6,
              }}
            >
              <span>{item.name}</span>
              <button
                onClick={() => deleteTodo(item.id)}
                style={{
                  background: '#e63946',
                  border: 'none',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: 4,
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#888' }}>No todos yet. Add one!</p>
      )}
    </div>
  )
}

export default App
