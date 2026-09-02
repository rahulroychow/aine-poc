import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'
import * as todoApi from './api/todoApi.js'

// Spread the real module into a plain namespace object so vi.spyOn can
// redefine individual exports (ESM namespaces are otherwise frozen).
vi.mock('./api/todoApi.js', async (importOriginal) => ({ ...(await importOriginal()) }))

const STORAGE_KEY = 'aine-todos'

const input = () => screen.getByRole('textbox', { name: /todo description/i })
const submit = () => screen.getByRole('button', { name: /add todo/i })

const seed = (todos) => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))

const storedTodos = () => {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  return raw === null ? null : JSON.parse(raw)
}

/** Throw `error` on the next localStorage.setItem call only. */
const failNextSave = (error) => {
  window.localStorage.setItem.mockImplementationOnce(() => { throw error })
}

const quotaError = () => Object.assign(new Error('quota'), { name: 'QuotaExceededError' })

let alertSpy

beforeEach(() => {
  alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('App — loading todos on mount', () => {
  it('shows the empty state when storage is empty', async () => {
    render(<App />)

    expect(await screen.findByText('No todos yet')).toBeInTheDocument()
  })

  it('restores previously saved todos', async () => {
    seed([{ id: 'a', description: 'Saved todo', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }])

    render(<App />)

    expect(await screen.findByText('Saved todo')).toBeInTheDocument()
  })

  it('restores completion state', async () => {
    seed([{ id: 'a', description: 'Done todo', completed: true, createdAt: '2026-01-01T00:00:00.000Z' }])

    render(<App />)

    expect(await screen.findByText('Done')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('renders the page heading', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'My Todos' })).toBeInTheDocument()
  })
})

describe('App — recovering from unreadable storage', () => {
  it('resets to an empty list when the stored JSON is corrupt', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json')

    render(<App />)

    expect(await screen.findByText('No todos yet')).toBeInTheDocument()
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Corrupted todo data'))
  })

  it('treats valid JSON that is not a list as corrupt', async () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 'x', description: 'not a list' }))

    render(<App />)

    expect(await screen.findByText('No todos yet')).toBeInTheDocument()
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Corrupted todo data'))
  })

  it('drops list entries that do not have the todo shape', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([null, 42, { id: 'ok', description: 'Kept', completed: false }, { description: 'no id' }])
    )

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Kept' })).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('warns and starts empty when storage reports a quota failure on read', async () => {
    window.localStorage.getItem.mockImplementationOnce(() => { throw quotaError() })

    render(<App />)

    expect(await screen.findByText('No todos yet')).toBeInTheDocument()
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Unable to access storage'))
  })

  it('warns and starts empty on any other read failure', async () => {
    window.localStorage.getItem.mockImplementationOnce(() => { throw new Error('disk on fire') })

    render(<App />)

    expect(await screen.findByText('No todos yet')).toBeInTheDocument()
    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to load todos'))
  })
})

describe('App — adding a todo', () => {
  it('adds the todo to the list', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')

    await user.type(input(), 'Buy groceries')
    await user.click(submit())

    expect(await screen.findByText('Buy groceries')).toBeInTheDocument()
    expect(screen.queryByText('No todos yet')).not.toBeInTheDocument()
  })

  it('puts the newest todo first', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')

    await user.type(input(), 'First{Enter}')
    await screen.findByText('First')
    await user.type(input(), 'Second{Enter}')
    await screen.findByText('Second')

    const headings = screen.getAllByRole('heading', { level: 2 })
    expect(headings.map((h) => h.textContent)).toEqual(['Second', 'First'])
  })

  it('persists the new todo to storage', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')

    await user.type(input(), 'Persist me{Enter}')
    await screen.findByText('Persist me')

    await waitFor(() => {
      expect(storedTodos()).toEqual([expect.objectContaining({ description: 'Persist me' })])
    })
  })

  it('alerts and leaves the list unchanged when creation fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(todoApi, 'createTodo').mockRejectedValue(new Error('network down'))
    render(<App />)
    await screen.findByText('No todos yet')

    await user.type(input(), 'Doomed{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to create todo')
    expect(alertSpy).toHaveBeenCalledWith('Failed to create todo. Please try again.')
    expect(screen.getByText('No todos yet')).toBeInTheDocument()
  })
})

describe('App — completing a todo', () => {
  it('marks a todo done', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')
    await user.type(input(), 'Finish me{Enter}')
    await screen.findByText('Finish me')

    await user.click(screen.getByRole('checkbox'))

    expect(await screen.findByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Finish me')).toHaveClass('line-through')
  })

  it('toggles back to active', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')
    await user.type(input(), 'Toggle me{Enter}')
    await screen.findByText('Toggle me')

    await user.click(screen.getByRole('checkbox'))
    await screen.findByText('Done')
    await user.click(screen.getByRole('checkbox'))

    await waitFor(() => expect(screen.queryByText('Done')).not.toBeInTheDocument())
  })

  it('persists the completion state', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')
    await user.type(input(), 'Persist done{Enter}')
    await screen.findByText('Persist done')

    await user.click(screen.getByRole('checkbox'))
    await screen.findByText('Done')

    await waitFor(() => {
      expect(storedTodos()).toEqual([expect.objectContaining({ completed: true })])
    })
  })

  it('completes only the targeted todo, leaving its siblings alone', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')
    await user.type(input(), 'Leave me{Enter}')
    await screen.findByText('Leave me')
    await user.type(input(), 'Complete me{Enter}')
    await screen.findByText('Complete me')

    await user.click(screen.getByRole('checkbox', { name: 'Mark "Complete me" as complete' }))

    expect(await screen.findByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Complete me')).toHaveClass('line-through')
    expect(screen.getByText('Leave me')).not.toHaveClass('line-through')
    expect(screen.getAllByText('Done')).toHaveLength(1)
  })

  it('alerts and leaves the todo untouched when the update fails', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')
    await user.type(input(), 'Task{Enter}')
    await screen.findByText('Task')

    vi.spyOn(todoApi, 'updateTodo').mockRejectedValue(new Error('network down'))
    await user.click(screen.getByRole('checkbox'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to update todo. Please try again.')
    })
    expect(screen.queryByText('Done')).not.toBeInTheDocument()
  })
})

describe('App — deleting a todo', () => {
  it('removes the todo and restores the empty state', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')
    await user.type(input(), 'Delete me{Enter}')
    await screen.findByText('Delete me')

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(await screen.findByText('No todos yet')).toBeInTheDocument()
  })

  it('deletes only the targeted todo', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')
    await user.type(input(), 'Keep{Enter}')
    await screen.findByText('Keep')
    await user.type(input(), 'Drop{Enter}')
    await screen.findByText('Drop')

    await user.click(screen.getByRole('button', { name: 'Delete "Drop"' }))

    await waitFor(() => expect(screen.queryByText('Drop')).not.toBeInTheDocument())
    expect(screen.getByText('Keep')).toBeInTheDocument()
  })

  it('alerts and keeps the todo when the delete fails', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')
    await user.type(input(), 'Task{Enter}')
    await screen.findByText('Task')

    vi.spyOn(todoApi, 'deleteTodo').mockRejectedValue(new Error('network down'))
    await user.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete todo. Please try again.')
    })
    expect(screen.getByText('Task')).toBeInTheDocument()
  })
})

describe('App — recovering from unwritable storage', () => {
  it('sheds the oldest todos and warns when the quota is exceeded', async () => {
    const user = userEvent.setup()
    seed([
      { id: 'a', description: 'Oldest', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'b', description: 'Newer', completed: false, createdAt: '2026-01-02T00:00:00.000Z' }
    ])
    render(<App />)
    await screen.findByText('Oldest')

    failNextSave(quotaError())
    await user.type(input(), 'Third{Enter}')

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Storage quota exceeded'))
    })
    // Retained the front half of the list; the oldest entry was dropped.
    await waitFor(() => expect(screen.queryByText('Oldest')).not.toBeInTheDocument())
  })

  it('falls back to in-memory state when even the reduced list will not fit', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')

    // Both the initial write and the shrink-and-retry fail.
    failNextSave(quotaError())
    failNextSave(quotaError())
    await user.type(input(), 'Task{Enter}')

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Unable to save todos to storage'))
    })
    // The todo is still on screen — only persistence was lost.
    expect(screen.getByText('Task')).toBeInTheDocument()
  })

  it('warns when storage is blocked by a SecurityError', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')

    failNextSave(Object.assign(new Error('blocked'), { name: 'SecurityError' }))
    await user.type(input(), 'Task{Enter}')

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Storage is not accessible'))
    })
    expect(screen.getByText('Task')).toBeInTheDocument()
  })

  it('warns when storage reports access denied without a SecurityError name', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')

    failNextSave(new Error('storage access denied'))
    await user.type(input(), 'Task{Enter}')

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Storage is not accessible'))
    })
  })

  it('warns on any other write failure', async () => {
    const user = userEvent.setup()
    render(<App />)
    await screen.findByText('No todos yet')

    failNextSave(new Error('disk on fire'))
    await user.type(input(), 'Task{Enter}')

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to save todos'))
    })
    expect(screen.getByText('Task')).toBeInTheDocument()
  })
})
