/**
 * Todo API.
 *
 * This release has no server-backed persistence — todos live in localStorage,
 * written by App.jsx. This module is the seam that a real HTTP client will slot
 * into: it keeps an in-memory record so `updateTodo` can merge against the
 * stored todo the way a server would, and so the call signatures stay stable
 * when the implementation is swapped out.
 */

import { generateId } from '../utils/generateId.js'

/** @type {Array<{id: string, description: string, completed: boolean, createdAt: string}>} */
let store = []

/**
 * Fetch all todos.
 * @returns {Promise<Array<object>>}
 */
export async function getTodos() {
  return store.map((todo) => ({ ...todo }))
}

/**
 * Create a todo.
 * @param {string} description
 * @returns {Promise<object>} The created todo.
 */
export async function createTodo(description) {
  const todo = {
    id: generateId(),
    description,
    completed: false,
    createdAt: new Date().toISOString()
  }
  store.push(todo)
  return { ...todo }
}

/**
 * Merge updates into an existing todo, preserving untouched fields.
 *
 * Falls back to `{id, ...updates}` when the id is unknown — which happens after
 * a page reload, where todos are rehydrated from localStorage into App state
 * but this module's store starts empty.
 *
 * @param {string} todoId
 * @param {object} updates
 * @returns {Promise<object>} The updated todo.
 */
export async function updateTodo(todoId, updates) {
  const index = store.findIndex((todo) => todo.id === todoId)

  if (index === -1) {
    return { id: todoId, ...updates }
  }

  store[index] = { ...store[index], ...updates, id: todoId }
  return { ...store[index] }
}

/**
 * Delete a todo. Deleting an unknown id is a no-op, matching idempotent
 * DELETE semantics.
 * @param {string} todoId
 * @returns {Promise<void>}
 */
export async function deleteTodo(todoId) {
  store = store.filter((todo) => todo.id !== todoId)
}

/** Clear the in-memory store. Test helper. */
export function __resetStore() {
  store = []
}
