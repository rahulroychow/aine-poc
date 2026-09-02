import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodoList from './TodoList.jsx'

const todo = (overrides = {}) => ({
  id: 'id-1',
  description: 'Buy milk',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides
})

const renderList = (todos, props = {}) =>
  render(
    <TodoList
      todos={todos}
      onToggleTodo={props.onToggleTodo ?? vi.fn()}
      onDeleteTodo={props.onDeleteTodo ?? vi.fn()}
    />
  )

describe('TodoList — empty state', () => {
  it('shows the empty state when there are no todos', () => {
    renderList([])

    expect(screen.getByRole('heading', { name: 'No todos yet' })).toBeInTheDocument()
    expect(screen.getByText('No todos yet. Create one to get started.')).toBeInTheDocument()
  })

  it('renders no checkboxes in the empty state', () => {
    renderList([])

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})

describe('TodoList — rendering todos', () => {
  it('renders one row per todo', () => {
    renderList([
      todo({ id: 'a', description: 'First' }),
      todo({ id: 'b', description: 'Second' })
    ])

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('replaces the empty state once a todo exists', () => {
    renderList([todo()])

    expect(screen.queryByText('No todos yet')).not.toBeInTheDocument()
  })

  it('leaves an active todo unchecked, unstruck and unbadged', () => {
    renderList([todo({ completed: false })])

    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.getByText('Buy milk')).not.toHaveClass('line-through')
    expect(screen.queryByText('Done')).not.toBeInTheDocument()
  })

  it('strikes through a completed todo and badges it Done', () => {
    renderList([todo({ completed: true })])

    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(screen.getByText('Buy milk')).toHaveClass('line-through')
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('treats a missing completed flag as not completed', () => {
    // Guards the `todo.completed || false` fallback — React warns and switches
    // the input to uncontrolled if `checked` is ever undefined.
    renderList([{ id: 'x', description: 'Legacy todo', createdAt: '2026-01-01T00:00:00.000Z' }])

    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('labels the controls with the todo description', () => {
    renderList([todo({ description: 'Walk the dog' })])

    expect(screen.getByRole('checkbox', { name: 'Mark "Walk the dog" as complete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete "Walk the dog"' })).toBeInTheDocument()
  })
})

describe('TodoList — hostile content', () => {
  it('renders a script-like description as inert text', () => {
    const payload = '<img src=x onerror="window.__xss = 1"><script>window.__xss = 2</script>'
    renderList([todo({ description: payload })])
    expect(screen.getByRole('heading', { name: payload })).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
    expect(document.querySelector('script')).toBeNull()
    expect(window.__xss).toBeUndefined()
    expect(screen.getByRole('checkbox', { name: `Mark "${payload}" as complete` })).toBeInTheDocument()
  })
})

describe('TodoList — interactions', () => {
  it('calls onToggleTodo with the todo id', async () => {
    const user = userEvent.setup()
    const onToggleTodo = vi.fn()
    renderList([todo({ id: 'toggle-me' })], { onToggleTodo })

    await user.click(screen.getByRole('checkbox'))

    expect(onToggleTodo).toHaveBeenCalledWith('toggle-me')
  })

  it('calls onDeleteTodo with the todo id', async () => {
    const user = userEvent.setup()
    const onDeleteTodo = vi.fn()
    renderList([todo({ id: 'delete-me' })], { onDeleteTodo })

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(onDeleteTodo).toHaveBeenCalledWith('delete-me')
  })

  it('targets only the clicked row when several todos are listed', async () => {
    const user = userEvent.setup()
    const onToggleTodo = vi.fn()
    renderList(
      [todo({ id: 'a', description: 'First' }), todo({ id: 'b', description: 'Second' })],
      { onToggleTodo }
    )

    await user.click(screen.getAllByRole('checkbox')[1])

    expect(onToggleTodo).toHaveBeenCalledTimes(1)
    expect(onToggleTodo).toHaveBeenCalledWith('b')
  })
})
