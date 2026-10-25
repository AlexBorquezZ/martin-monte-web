import { IDBFactory } from 'fake-indexeddb';
import { resetDBConnection } from '../../src/storage/db';

/** Base de datos nueva y vacía para cada prueba. */
export async function freshDB(): Promise<void> {
  await resetDBConnection();
  globalThis.indexedDB = new IDBFactory();
}
