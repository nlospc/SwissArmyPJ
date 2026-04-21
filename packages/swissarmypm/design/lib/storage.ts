// Browser storage abstraction layer using IndexedDB
const DB_NAME = 'SwissArmyPM';
const DB_VERSION = 1;

export interface Workspace {
  id: string;
  name: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  projectIds: string[];
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  status: 'not_started' | 'in_progress' | 'done' | 'blocked';
  startDate?: string;
  endDate?: string;
  portfolioId?: string;
  tags: string[];
}

export interface WorkItem {
  id: string;
  projectId: string;
  type: 'task' | 'issue' | 'milestone' | 'remark' | 'clash' | 'phase';
  title: string;
  status: 'not_started' | 'in_progress' | 'done' | 'blocked';
  startDate?: string;
  endDate?: string;
  parentId?: string;
  level: 1 | 2;
  notes?: string;
  createdAt: string;
}

export interface InboxItem {
  id: string;
  sourceType: 'text' | 'file' | 'link';
  rawText: string;
  createdAt: string;
  processed: boolean;
}

export interface DatabaseSchema {
  workspaces: Workspace;
  portfolios: Portfolio;
  projects: Project;
  workItems: WorkItem;
  inboxItems: InboxItem;
}

class StorageManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('workspaces')) {
          db.createObjectStore('workspaces', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('portfolios')) {
          db.createObjectStore('portfolios', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('portfolioId', 'portfolioId', { unique: false });
        }
        if (!db.objectStoreNames.contains('workItems')) {
          const workItemStore = db.createObjectStore('workItems', { keyPath: 'id' });
          workItemStore.createIndex('projectId', 'projectId', { unique: false });
          workItemStore.createIndex('parentId', 'parentId', { unique: false });
        }
        if (!db.objectStoreNames.contains('inboxItems')) {
          db.createObjectStore('inboxItems', { keyPath: 'id' });
        }
      };
    });
  }

  // Generic CRUD operations
  async getAll<K extends keyof DatabaseSchema>(
    storeName: K
  ): Promise<DatabaseSchema[K][]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getById<K extends keyof DatabaseSchema>(
    storeName: K,
    id: string
  ): Promise<DatabaseSchema[K] | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add<K extends keyof DatabaseSchema>(
    storeName: K,
    data: DatabaseSchema[K]
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async update<K extends keyof DatabaseSchema>(
    storeName: K,
    data: DatabaseSchema[K]
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete<K extends keyof DatabaseSchema>(
    storeName: K,
    id: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getByIndex<K extends keyof DatabaseSchema>(
    storeName: K,
    indexName: string,
    value: string
  ): Promise<DatabaseSchema[K][]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear<K extends keyof DatabaseSchema>(storeName: K): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async exportData(): Promise<string> {
    const data = {
      workspaces: await this.getAll('workspaces'),
      portfolios: await this.getAll('portfolios'),
      projects: await this.getAll('projects'),
      workItems: await this.getAll('workItems'),
      inboxItems: await this.getAll('inboxItems'),
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    // Clear existing data
    await this.clear('workspaces');
    await this.clear('portfolios');
    await this.clear('projects');
    await this.clear('workItems');
    await this.clear('inboxItems');

    // Import new data
    for (const workspace of data.workspaces || []) {
      await this.add('workspaces', workspace);
    }
    for (const portfolio of data.portfolios || []) {
      await this.add('portfolios', portfolio);
    }
    for (const project of data.projects || []) {
      await this.add('projects', project);
    }
    for (const workItem of data.workItems || []) {
      await this.add('workItems', workItem);
    }
    for (const inboxItem of data.inboxItems || []) {
      await this.add('inboxItems', inboxItem);
    }
  }
}

export const storage = new StorageManager();

// ID generation
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
