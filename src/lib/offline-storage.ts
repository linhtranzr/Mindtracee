/**
 * Local-First IndexedDB Cache Manager for MindTrace PDF Documents
 */

const DB_NAME = 'mindtrace_offline_db'
const DB_VERSION = 1
const STORE_NAME = 'pdf_blobs'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'))
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getCachedPdfBlob(documentId: string): Promise<Blob | null> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(documentId)

      request.onsuccess = () => {
        const result = request.result
        resolve(result instanceof Blob ? result : null)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.warn('IndexedDB read fallback:', err)
    return null
  }
}

export async function savePdfBlobToCache(documentId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(blob, documentId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.warn('IndexedDB write fallback:', err)
  }
}

export async function clearCachedPdf(documentId: string): Promise<void> {
  try {
    const db = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(documentId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.warn('IndexedDB delete fallback:', err)
  }
}
