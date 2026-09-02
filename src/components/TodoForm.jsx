import { useState } from 'react'

function TodoForm({ onAddTodo }) {
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate: reject empty or whitespace-only submissions
    if (!description.trim()) {
      setError('Please enter a todo description')
      return
    }

    // Clear error and set loading state
    setError('')
    setIsLoading(true)

    try {
      // Call the callback with the trimmed description
      await onAddTodo(description.trim())

      // Clear the form after successful submission
      setDescription('')
    } catch (err) {
      // Error is handled in App.jsx, but preserve form text on error
      setError('Failed to create todo. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setDescription(e.target.value)
    // Clear error when user types
    if (error) {
      setError('')
    }
  }

  const charCount = description.length
  const maxLength = 500

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex gap-2">
        <div className="flex-grow">
          <input
            type="text"
            value={description}
            onChange={handleInputChange}
            placeholder="Add a new todo..."
            maxLength={maxLength}
            disabled={isLoading}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              error
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
            aria-label="Todo description"
            aria-describedby={error ? 'error-message' : undefined}
          />
          <div className="flex justify-between items-start mt-1">
            {error && (
              <span
                id="error-message"
                role="alert"
                className="text-sm text-red-600 font-medium"
              >
                {error}
              </span>
            )}
            <span className="text-xs text-gray-500 ml-auto">
              {charCount}/{maxLength}
            </span>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 text-white font-medium rounded-lg whitespace-nowrap transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          aria-label={isLoading ? 'Adding todo...' : 'Add todo'}
        >
          {isLoading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  )
}

export default TodoForm
