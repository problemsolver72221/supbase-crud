import { useEffect, useState } from 'react'
import './App.css'
// import { useState } from 'react'
import supabase from "./supabase-client"

function App() {
  const [todoList, setTodoList] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  const addTodo = async (e) => {
    e.preventDefault()
    const newTodoData = {
      name: newTodo,
      isCompleted: false
    }
    const { data, error } = await supabase.from("TodoList").insert([newTodoData]).select().single();

    if (error) {
      console.log("Error adding todo: ", error)
    } else {
      setTodoList((prev) => [...prev, data]);
      setNewTodo("")
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("TodoList").select()
      if (error) {
        console.log("Error", error)

      } else {
        setTodoList(data)
      }
    }

    fetchData()
  }, [])


  return (
    <div>

      <h1>Todo List</h1>

      <div>
        <input type="text" placeholder='New Todo..' onChange={(e) => setNewTodo(e.target.value)} />
        <button onClick={addTodo}>Add Todo Item</button>
      </div>
      {
        todoList.length != 0 ?
          (<ul style={{ listStyleType: 'none' }}>
            {
              todoList.map((item, index) => (
                // <ul>
                <li key={item.id}>{item.name}</li>
                // </ul>
              ))
            }
          </ul>
          ) : ""

      }
    </div>
  )
}

export default App
