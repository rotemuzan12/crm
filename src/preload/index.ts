import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  clients: {
    list: (filters?: object) => ipcRenderer.invoke('clients:list', filters),
    get: (id: number) => ipcRenderer.invoke('clients:get', id),
    create: (data: object) => ipcRenderer.invoke('clients:create', data),
    update: (id: number, data: object) => ipcRenderer.invoke('clients:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('clients:delete', id)
  },

  contacts: {
    list: (filters?: object) => ipcRenderer.invoke('contacts:list', filters),
    get: (id: number) => ipcRenderer.invoke('contacts:get', id),
    create: (data: object) => ipcRenderer.invoke('contacts:create', data),
    update: (id: number, data: object) => ipcRenderer.invoke('contacts:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('contacts:delete', id)
  },

  deals: {
    list: (filters?: object) => ipcRenderer.invoke('deals:list', filters),
    get: (id: number) => ipcRenderer.invoke('deals:get', id),
    create: (data: object) => ipcRenderer.invoke('deals:create', data),
    update: (id: number, data: object) => ipcRenderer.invoke('deals:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('deals:delete', id)
  },

  tasks: {
    list: (filters?: object) => ipcRenderer.invoke('tasks:list', filters),
    get: (id: number) => ipcRenderer.invoke('tasks:get', id),
    create: (data: object) => ipcRenderer.invoke('tasks:create', data),
    update: (id: number, data: object) => ipcRenderer.invoke('tasks:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('tasks:delete', id),
    complete: (id: number, completed: boolean) =>
      ipcRenderer.invoke('tasks:complete', id, completed)
  },

  notes: {
    list: (filters?: object) => ipcRenderer.invoke('notes:list', filters),
    create: (data: object) => ipcRenderer.invoke('notes:create', data),
    delete: (id: number) => ipcRenderer.invoke('notes:delete', id)
  },

  dashboard: {
    getData: () => ipcRenderer.invoke('dashboard:getData')
  },

  search: {
    global: (query: string) => ipcRenderer.invoke('search:global', query)
  },

  csv: {
    exportClients: () => ipcRenderer.invoke('csv:exportClients'),
    exportDeals: () => ipcRenderer.invoke('csv:exportDeals'),
    exportTasks: () => ipcRenderer.invoke('csv:exportTasks'),
    importClients: () => ipcRenderer.invoke('csv:importClients')
  },

  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    restore: () => ipcRenderer.invoke('backup:restore')
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll')
  },

  telegram: {
    start: () => ipcRenderer.invoke('telegram:start'),
    stop: () => ipcRenderer.invoke('telegram:stop'),
    status: () => ipcRenderer.invoke('telegram:status')
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (fallback for non-isolated context)
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
