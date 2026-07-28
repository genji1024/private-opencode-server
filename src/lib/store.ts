export interface StoredValue {
  key: string
  value: string
  updatedAt: string
}

class Store {
  private data: Map<string, StoredValue> = new Map()

  async get(key: string): Promise<string | null> {
    return this.data.get(key)?.value ?? null
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, {
      key,
      value,
      updatedAt: new Date().toISOString(),
    })
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key)
  }

  async list(): Promise<StoredValue[]> {
    return Array.from(this.data.values())
  }
}

export const store = new Store()
