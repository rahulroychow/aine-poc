import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodoForm from './TodoForm.jsx'

const input = () => screen.getByRole('textbox', { name: /todo description/i })
const submit = () => screen.getByRole('button', { name: /add todo/i })

describe('TodoForm', () => {
  it('renders an input and a submit button', () => {
    render(<TodoForm onAddTodo={vi.fn()} />)

    expect(input()).toBeInTheDocument()
    expect(submit()).toHaveTextContent('Add')
  })

  it('submits the typed description', async () => {
    const user = userEvent.setup()
    const onAddTodo = vi.fn().mockResolvedValue(undefined)
    render(<TodoForm onAddTodo={onAddTodo} />)

    await user.type(input(), 'Buy groceries')
    await user.click(submit())

    expect(onAddTodo).toHaveBeenCalledWith('Buy groceries')
  })

  it('trims surrounding whitespace before submitting', async () => {
    const user = userEvent.setup()
    const onAddTodo = vi.fn().mockResolvedValue(undefined)
    render(<TodoForm onAddTodo={onAddTodo} />)

    await user.type(input(), '   padded   ')
    await user.click(submit())

    expect(onAddTodo).toHaveBeenCalledWith('padded')
  })

  it('clears the input after a successful submit', async () => {
    const user = userEvent.setup()
    render(<TodoForm onAddTodo={vi.fn().mockResolvedValue(undefined)} />)

    await user.type(input(), 'Task')
    await user.click(submit())

    await waitFor(() => expect(input()).toHaveValue(''))
  })

  it('submits on Enter', async () => {
    const user = userEvent.setup()
    const onAddTodo = vi.fn().mockResolvedValue(undefined)
    render(<TodoForm onAddTodo={onAddTodo} />)

    await user.type(input(), 'Via keyboard{Enter}')

    expect(onAddTodo).toHaveBeenCalledWith('Via keyboard')
  })

  it('rejects an empty submit with an error and does not call the handler', async () => {
    const user = userEvent.setup()
    const onAddTodo = vi.fn()
    render(<TodoForm onAddTodo={onAddTodo} />)

    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a todo description')
    expect(onAddTodo).not.toHaveBeenCalled()
  })

  it('rejects a whitespace-only submit', async () => {
    const user = userEvent.setup()
    const onAddTodo = vi.fn()
    render(<TodoForm onAddTodo={onAddTodo} />)

    await user.type(input(), '   ')
    await user.click(submit())

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(onAddTodo).not.toHaveBeenCalled()
  })

  it('links the error to the input via aria-describedby, and unlinks it once cleared', async () => {
    const user = userEvent.setup()
    render(<TodoForm onAddTodo={vi.fn()} />)

    expect(input()).not.toHaveAttribute('aria-describedby')

    await user.click(submit())
    expect(input()).toHaveAttribute('aria-describedby', 'error-message')

    await user.type(input(), 'a')
    expect(input()).not.toHaveAttribute('aria-describedby')
  })

  it('clears the error as soon as the user types', async () => {
    const user = userEvent.setup()
    render(<TodoForm onAddTodo={vi.fn()} />)

    await user.click(submit())
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.type(input(), 'x')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('surfaces an error and keeps the text when the handler rejects', async () => {
    const user = userEvent.setup()
    const onAddTodo = vi.fn().mockRejectedValue(new Error('boom'))
    render(<TodoForm onAddTodo={onAddTodo} />)

    await user.type(input(), 'Keep me')
    await user.click(submit())

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to create todo')
    // The text survives so the user can retry without retyping.
    expect(input()).toHaveValue('Keep me')
  })

  it('disables the input and button while the submit is in flight', async () => {
    const user = userEvent.setup()
    let release
    const onAddTodo = vi.fn(() => new Promise((resolve) => { release = resolve }))
    render(<TodoForm onAddTodo={onAddTodo} />)

    await user.type(input(), 'Task')
    await user.click(submit())

    const busy = screen.getByRole('button', { name: /adding todo/i })
    expect(busy).toBeDisabled()
    expect(busy).toHaveTextContent('Adding...')
    expect(input()).toBeDisabled()

    release()
    await waitFor(() => expect(submit()).toBeEnabled())
  })

  it('tracks the character count against the 500 limit', async () => {
    const user = userEvent.setup()
    render(<TodoForm onAddTodo={vi.fn()} />)

    expect(screen.getByText('0/500')).toBeInTheDocument()

    await user.type(input(), 'abcde')
    expect(screen.getByText('5/500')).toBeInTheDocument()
  })

  it('caps input at 500 characters', () => {
    render(<TodoForm onAddTodo={vi.fn()} />)

    expect(input()).toHaveAttribute('maxLength', '500')
  })
})
