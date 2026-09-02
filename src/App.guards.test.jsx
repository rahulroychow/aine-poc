import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as todoApi from './api/todoApi.js'

/**
 * App guards that the real UI cannot reach.
 *
 * `handleToggleTodo` bails out when the id is not in state — unreachable
 * through TodoList, which only renders ids that are already there. This file
 * swaps TodoList for a stub that fires the callbacks with an arbitrary id, so
 * the guard is exercised rather than assumed.
 */
vi.mock('./components/TodoList.jsx', () => ({
  default: ({ onToggleTodo }) => (
    <button onClick={() => onToggleTodo('id-that-does-not-exist')}>toggle ghost</button>
  )
}))

vi.mock('./api/todoApi.js', async (importOriginal) => ({ ...(await importOriginal()) }))

const { default: App } = await import('./App.jsx')

beforeEach(() => {
  vi.spyOn(window, 'alert').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('App — toggling an unknown todo', () => {
  it('logs and returns without calling the update API', async () => {
    const user = userEvent.setup()
    const updateTodo = vi.spyOn(todoApi, 'updateTodo')
    render(<App />)

    await user.click(await screen.findByRole('button', { name: 'toggle ghost' }))

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Todo not found:', 'id-that-does-not-exist')
    })
    expect(updateTodo).not.toHaveBeenCalled()
    expect(window.alert).not.toHaveBeenCalled()
  })
})
