function TodoList({ todos, onToggleTodo }) {
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No todos yet
          </h3>
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
              className="h-5 w-5 text-blue-600 rounded border-gray-300 cursor-pointer"
              aria-label={`Mark "${todo.description}" as complete`}
            />
          </div>

          {/* Todo content */}
          <div className="flex-grow min-w-0">
            <h3
              className={`text-sm md:text-base font-medium ${
                todo.completed
                  ? 'line-through text-gray-500'
                  : 'text-gray-900'
              }`}
            >
              {todo.description}
            </h3>
          </div>

          {/* Status badge */}
          {todo.completed && (
            <div className="flex-shrink-0">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                Done
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default TodoList
