import { useState, useEffect } from 'react'
import TodoList from './components/TodoList'
import TodoForm from './components/TodoForm'
import { createTodo, updateTodo, deleteTodo } from './api/todoApi'

/** True when a value rehydrated from storage has the AD-4 todo shape. */
function isTodoShaped(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.description === 'string'
  )
}

function App() {
  const [todos, setTodos] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Story 2-2: Load todos from localStorage on app mount
  useEffect(() => {
    try {
      const savedTodos = localStorage.getItem('aine-todos')
      if (savedTodos) {
        const parsedTodos = JSON.parse(savedTodos)
        // Valid JSON is not enough: a tampered or foreign value under our key
        // (an object, null, a list of numbers) would crash the render. Keep
        // only entries that match the AD-4 schema and treat anything else as
        // corrupt.
        if (!Array.isArray(parsedTodos)) {
          throw new SyntaxError('Stored todos are not a list')
        }
        setTodos(parsedTodos.filter(isTodoShaped))
      } else {
        setTodos([])
      }
    } catch (error) {
      // Story 2-3: Handle corrupted JSON or access denied
      console.error('Error loading todos from localStorage:', error)
      if (error instanceof SyntaxError) {
        // Corrupted JSON: reset to empty array
        alert('Corrupted todo data detected. Starting with an empty list.')
        setTodos([])
      } else if (error.name === 'QuotaExceededError') {
        // Access denied or quota exceeded on load
        alert('Unable to access storage. Working with in-memory storage only.')
        setTodos([])
      } else {
        // Other errors: fall back to empty array
        alert('Failed to load todos. Starting with an empty list.')
        setTodos([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Story 2-1 & 2-3: Save todos to localStorage whenever they change
  useEffect(() => {
    // Skip save on initial mount (loading state)
    if (isLoading) return

    try {
      localStorage.setItem('aine-todos', JSON.stringify(todos))
    } catch (error) {
      // Story 2-3: Handle quota exceeded and other errors
      if (error.name === 'QuotaExceededError') {
        // Quota exceeded: clear oldest todos and retry
        console.error('localStorage quota exceeded, clearing oldest todos')
        try {
          // Keep only the most recent todos (remove oldest)
          const reducedTodos = todos.slice(0, Math.max(1, Math.floor(todos.length / 2)))
          localStorage.setItem('aine-todos', JSON.stringify(reducedTodos))
          setTodos(reducedTodos)
          alert('Storage quota exceeded. Some older todos were removed to save your current work.')
        } catch (retryError) {
          // Even after clearing, still fails - fall back to in-memory
          console.error('Still unable to save after clearing, falling back to in-memory', retryError)
          alert('Unable to save todos to storage. Your changes are kept in memory but will be lost on refresh.')
        }
      } else if (error.name === 'SecurityError' || error.message.includes('access denied')) {
        // Access denied (private browsing mode, etc.)
        console.error('localStorage access denied:', error)
        alert('Storage is not accessible. Your changes are kept in memory but will be lost on refresh.')
      } else {
        // Other errors
        console.error('Error saving todos to localStorage:', error)
        alert('Failed to save todos. Your changes are kept in memory but will be lost on refresh.')
      }
    }
  }, [todos, isLoading])

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
