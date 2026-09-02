function TodoList({ todos, onToggleTodo, onDeleteTodo }) {
  // Empty state
  if (todos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 px-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            No todos yet
          </h2>
          <p className="text-gray-600">
            No todos yet. Create one to get started.
          </p>
        </div>
      </div>
    )
  }

  // Todo list view
  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Completion status indicator */}
          <div className="flex-shrink-0 mt-1">
            <input
              type="checkbox"
              checked={todo.completed || false}
              onChange={() => onToggleTodo(todo.id)}
              // Outline, not ring: WebKit ignores author box-shadows on
              // native-appearance checkboxes, so a Tailwind ring never paints
              // there. Outline renders outside the control on every engine.
              className="h-5 w-5 text-blue-600 rounded border-gray-300 cursor-pointer focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-500"
              aria-label={`Mark "${todo.description}" as complete`}
            />
          </div>

          {/* Todo content */}
          <div className="flex-grow min-w-0">
            <h2
              className={`text-sm md:text-base font-medium ${
                todo.completed
                  ? 'line-through text-gray-500'
                  : 'text-gray-900'
              }`}
            >
              {todo.description}
            </h2>
          </div>

          {/* Status badge */}
          {todo.completed && (
            <div className="flex-shrink-0">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Done
              </span>
            </div>
          )}

          {/* Delete button */}
          <div className="flex-shrink-0">
            <button
              onClick={() => onDeleteTodo(todo.id)}
              className="text-gray-400 hover:text-red-600 transition-colors duration-200 rounded focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label={`Delete "${todo.description}"`}
              title="Delete todo"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TodoList
