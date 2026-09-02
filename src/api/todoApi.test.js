import { describe, it, expect } from 'vitest'
import { getTodos, createTodo, updateTodo, deleteTodo, __resetStore } from './todoApi.js'

// __resetStore runs in the global afterEach (src/test/setup.js).

describe('createTodo', () => {
  it('returns a todo with id, description, completed and createdAt', async () => {
    const todo = await createTodo('Buy milk')

    expect(todo).toMatchObject({ description: 'Buy milk', completed: false })
    expect(todo.id).toEqual(expect.any(String))
    expect(Date.parse(todo.createdAt)).not.toBeNaN()
  })

  it('assigns a distinct id per todo', async () => {
    const [a, b] = [await createTodo('one'), await createTodo('two')]
    expect(a.id).not.toBe(b.id)
  })

  it('returns a copy, so mutating the result does not corrupt the store', async () => {
    const todo = await createTodo('Original')
    todo.description = 'Mutated'

    const [stored] = await getTodos()
    expect(stored.description).toBe('Original')
  })
})

describe('getTodos', () => {
  it('starts empty', async () => {
    expect(await getTodos()).toEqual([])
  })

  it('returns every created todo in insertion order', async () => {
    await createTodo('first')
    await createTodo('second')

    expect((await getTodos()).map((t) => t.description)).toEqual(['first', 'second'])
  })
})

describe('updateTodo', () => {
  it('applies the update', async () => {
    const created = await createTodo('Task')
    const updated = await updateTodo(created.id, { completed: true })

    expect(updated.completed).toBe(true)
  })

  it('preserves fields the update did not mention', async () => {
    const created = await createTodo('Original')
    const updated = await updateTodo(created.id, { completed: true })

    expect(updated.description).toBe('Original')
    expect(updated.id).toBe(created.id)
    expect(updated.createdAt).toBe(created.createdAt)
  })

  it('persists the update for subsequent reads', async () => {
    const created = await createTodo('Task')
    await updateTodo(created.id, { completed: true })

    const [stored] = await getTodos()
    expect(stored.completed).toBe(true)
  })

  it('ignores an attempt to overwrite the id', async () => {
    const created = await createTodo('Task')
    const updated = await updateTodo(created.id, { id: 'hijacked' })

    expect(updated.id).toBe(created.id)
  })

  it('falls back to id + updates for an unknown id', async () => {
    // Happens after reload: App rehydrates todos from localStorage, but this
    // module's store starts empty.
    const updated = await updateTodo('unknown-id', { completed: true })

    expect(updated).toEqual({ id: 'unknown-id', completed: true })
  })
})

describe('deleteTodo', () => {
  it('removes the todo', async () => {
    const created = await createTodo('Doomed')
    await deleteTodo(created.id)

    expect(await getTodos()).toEqual([])
  })

  it('leaves the other todos alone', async () => {
    const keep = await createTodo('keep')
    const drop = await createTodo('drop')
    await deleteTodo(drop.id)

    expect((await getTodos()).map((t) => t.id)).toEqual([keep.id])
  })

  it('is a no-op for an unknown id', async () => {
    await createTodo('keep')
    await expect(deleteTodo('unknown-id')).resolves.toBeUndefined()

    expect(await getTodos()).toHaveLength(1)
  })
})

describe('__resetStore', () => {
  it('empties the store', async () => {
    await createTodo('Task')
    __resetStore()

    expect(await getTodos()).toEqual([])
  })
})
