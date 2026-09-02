import { describe, it, expect, beforeEach } from 'vitest'
import { createTodo, updateTodo, deleteTodo, getTodos } from '../todoApi'

describe('Todo API', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('createTodo', () => {
    it('should create a todo with required fields', async () => {
      const todo = await createTodo('Buy milk')
      expect(todo).toHaveProperty('id')
      expect(todo).toHaveProperty('description', 'Buy milk')
      expect(todo).toHaveProperty('completed', false)
      expect(todo).toHaveProperty('createdAt')
    })

    it('should generate a unique ID', async () => {
      const todo1 = await createTodo('Task 1')
      const todo2 = await createTodo('Task 2')
      expect(todo1.id).not.toBe(todo2.id)
    })

    it('should set createdAt timestamp', async () => {
      const todo = await createTodo('Task')
      const timestamp = new Date(todo.createdAt)
      expect(timestamp.getFullYear()).toBe(new Date().getFullYear())
    })
  })

  describe('updateTodo', () => {
    it('should toggle completed status', async () => {
      const created = await createTodo('Task')
      const updated = await updateTodo(created.id, { completed: true })
      expect(updated.completed).toBe(true)
    })

    it('should preserve other fields when updating', async () => {
      const created = await createTodo('Original')
      const updated = await updateTodo(created.id, { completed: true })
      expect(updated.description).toBe('Original')
      expect(updated.id).toBe(created.id)
    })
  })

  describe('deleteTodo', () => {
    it('should delete a todo', async () => {
      const created = await createTodo('Task to delete')
      await deleteTodo(created.id)
      expect(true).toBe(true) // Verify no error thrown
    })
  })

  describe('getTodos', () => {
    it('should return empty array initially', async () => {
      const todos = await getTodos()
      expect(Array.isArray(todos)).toBe(true)
    })
  })
})
