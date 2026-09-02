import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TodoForm from '../TodoForm'

describe('TodoForm', () => {
  it('should render input field and submit button', () => {
    const mockOnAdd = vi.fn()
    render(<TodoForm onAddTodo={mockOnAdd} />)

    expect(screen.getByPlaceholderText(/enter.*description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
  })

  it('should call onAddTodo when form is submitted with valid input', async () => {
    const mockOnAdd = vi.fn()
    render(<TodoForm onAddTodo={mockOnAdd} />)

    const input = screen.getByPlaceholderText(/enter.*description/i)
    fireEvent.change(input, { target: { value: 'Buy groceries' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    expect(mockOnAdd).toHaveBeenCalledWith('Buy groceries')
  })

  it('should clear input after successful submission', async () => {
    const mockOnAdd = vi.fn().mockResolvedValue(undefined)
    render(<TodoForm onAddTodo={mockOnAdd} />)

    const input = screen.getByPlaceholderText(/enter.*description/i)
    fireEvent.change(input, { target: { value: 'Task' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    // Input should be cleared
    expect(input.value).toBe('')
  })

  it('should not submit empty or whitespace-only input', () => {
    const mockOnAdd = vi.fn()
    render(<TodoForm onAddTodo={mockOnAdd} />)

    const input = screen.getByPlaceholderText(/enter.*description/i)
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    expect(mockOnAdd).not.toHaveBeenCalled()
  })

  it('should show error message on validation failure', () => {
    const mockOnAdd = vi.fn()
    render(<TodoForm onAddTodo={mockOnAdd} />)

    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    expect(screen.getByText(/please enter a todo description/i)).toBeInTheDocument()
  })

  it('should disable button while loading', () => {
    const mockOnAdd = vi.fn(() => new Promise(r => setTimeout(r, 100)))
    render(<TodoForm onAddTodo={mockOnAdd} />)

    const input = screen.getByPlaceholderText(/enter.*description/i)
    fireEvent.change(input, { target: { value: 'Task' } })
    const button = screen.getByRole('button', { name: /add/i })
    fireEvent.click(button)

    expect(button).toBeDisabled()
  })
})
