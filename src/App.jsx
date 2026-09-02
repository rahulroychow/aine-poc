import { useState, useEffect } from 'react'
import TodoList from './components/TodoList'
import TodoForm from './components/TodoForm'
import { createTodo, updateTodo, deleteTodo } from './api/todoApi'

function App() {
  const [todos, setTodos] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize with empty todo list on app load
    // In a real app, this would fetch from an API
    setTodos([])
    setIsLoading(false)
  }, [])

  const handleAddTodo = async (description) => {
    try {
      // Create a new todo with unique ID and timestamp
      const newTodo = await createTodo(description)

      // Add it to the App state (optimistic update)
      setTodos((prevTodos) => [newTodo, ...prevTodos])
    } catch (error) {
      // Show error alert to user
      alert('Failed to create todo. Please try again.')
      // Re-throw the error so TodoForm can handle it
      throw error
    }
  }

  const handleToggleTodo = async (todoId) => {
    try {
      // Find the current todo to get its current state
      const currentTodo = todos.find((t) => t.id === todoId)
      if (!currentTodo) {
        console.error('Todo not found:', todoId)
        return
      }

      // Toggle the completed status
      const updatedTodo = await updateTodo(todoId, {
        completed: !currentTodo.completed
      })

      // Update state with the returned todo
      setTodos((prevTodos) =>
        prevTodos.map((t) =>
          t.id === todoId
            ? { ...t, ...updatedTodo }
            : t
        )
      )
    } catch (error) {
      // Show error alert to user
      alert('Failed to update todo. Please try again.')
      console.error('Error toggling todo:', error)
    }
  }

  const handleDeleteTodo = async (todoId) => {
    try {
      // Call the delete API
      await deleteTodo(todoId)

      // Remove todo from state (optimistic update)
      setTodos((prevTodos) =>
        prevTodos.filter((t) => t.id !== todoId)
      )
    } catch (error) {
      // Show error alert to user
      alert('Failed to delete todo. Please try again.')
      console.error('Error deleting todo:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            My Todos
          </h1>
          <p className="text-gray-600 mt-2">
            Organize and track your tasks
          </p>
        </header>

        <main>
          <TodoForm onAddTodo={handleAddTodo} />
          <TodoList todos={todos} onToggleTodo={handleToggleTodo} onDeleteTodo={handleDeleteTodo} />
        </main>
      </div>
    </div>
  )
}

export default App
