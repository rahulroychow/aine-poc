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
  return Promise.resolve({
    id: generateId(),
    description,
    completed: false,
    createdAt: new Date().toISOString()
  })
}

/**
 * Update an existing todo
 * @param {string} todoId - The ID of the todo to update
 * @param {Object} updates - The fields to update (e.g., {completed: true})
 * @returns {Promise<Object>} The updated todo object with all fields preserved
 */
export async function updateTodo(todoId, updates) {
  // TODO: Replace with actual API call
  // For now, this is a mock that returns the updated object
  // In a real app, this would merge updates with existing todo from a database
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
