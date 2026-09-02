/**
 * Mock API functions for todo management
 * These are placeholder functions that define the API contract
 * Real implementation will replace these with actual backend calls
 */

import { generateId } from '../utils/generateId.js'

/**
 * Fetch all todos
 * @returns {Promise<Array>} Array of todo objects
 */
export async function getTodos() {
  // TODO: Replace with actual API call
  return Promise.resolve([])
}

/**
 * Create a new todo
 * @param {string} description - The description of the todo
 * @returns {Promise<Object>} The created todo object with {id, description, completed, createdAt}
 */
export async function createTodo(description) {
  // TODO: Replace with actual API call
  const newTodo = {
    id: generateId(),
    description,
    completed: false,
    createdAt: new Date().toISOString()
  }

  // For testing purposes, store in-memory so updateTodo can access
  if (typeof window !== 'undefined') {
    if (!window.__todoStore) {
      window.__todoStore = []
    }
    window.__todoStore.push(newTodo)
  }

  return Promise.resolve(newTodo)
}

/**
 * Update an existing todo
 * @param {string} todoId - The ID of the todo to update
 * @param {Object} updates - The fields to update (e.g., {completed: true})
 * @returns {Promise<Object>} The updated todo object with all fields preserved
 */
export async function updateTodo(todoId, updates) {
  // TODO: Replace with actual API call
  // In a real app, this would:
  // 1. Fetch the existing todo from database
  // 2. Merge updates with existing fields
  // 3. Save to database
  // 4. Return the merged object

  // For testing purposes, we need to track created todos in-memory
  // This allows updateTodo to preserve fields from the original creation
  if (typeof window !== 'undefined' && window.__todoStore) {
    const existing = window.__todoStore.find(t => t.id === todoId)
    if (existing) {
      const updated = { ...existing, ...updates }
      // Update the store
      const index = window.__todoStore.findIndex(t => t.id === todoId)
      if (index !== -1) {
        window.__todoStore[index] = updated
      }
      return Promise.resolve(updated)
    }
  }

  // Fallback: just return what we can merge
  return Promise.resolve({
    id: todoId,
    ...updates
  })
}

/**
 * Delete a todo
 * @param {string} todoId - The ID of the todo to delete
 * @returns {Promise<void>}
 */
export async function deleteTodo(todoId) {
  // TODO: Replace with actual API call
  return Promise.resolve()
}
