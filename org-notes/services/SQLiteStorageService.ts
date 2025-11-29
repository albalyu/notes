import * as SQLite from 'expo-sqlite';
import { Note, StorageService } from '../types/storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'notes.db';

export class SQLiteStorageService implements StorageService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    // Используем новый асинхронный метод открытия базы данных (SDK 50+)
    this.db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Создание таблицы
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL
      );
    `);
  }

  async getNotes(): Promise<Note[]> {
    if (!this.db) throw new Error('Database not initialized');
    // Новый метод получения всех записей
    return await this.db.getAllAsync<Note>('SELECT * FROM notes ORDER BY date DESC, time DESC;');
  }

  async getNoteById(id: string): Promise<Note | undefined> {
    if (!this.db) throw new Error('Database not initialized');
    // Новый метод получения первой записи
    const result = await this.db.getFirstAsync<Note>('SELECT * FROM notes WHERE id = ?;', [id]);
    return result || undefined;
  }

  async saveNote(note: Note): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (!note.id) {
      note.id = uuidv4();
    }

    // Новый метод выполнения команды без возврата строк
    await this.db.runAsync(
      'INSERT OR REPLACE INTO notes (id, title, content, date, time) VALUES (?, ?, ?, ?, ?);',
      [note.id, note.title, note.content, note.date, note.time]
    );
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM notes WHERE id = ?;', [id]);
  }

  async searchNotes(query: string, searchBy?: 'title' | 'content' | 'date' | 'time' | 'all'): Promise<Note[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sqlQuery = 'SELECT * FROM notes WHERE ';
    const params: string[] = [];
    const likeQuery = `%${query}%`;

    switch (searchBy) {
      case 'title':
        sqlQuery += 'title LIKE ?';
        params.push(likeQuery);
        break;
      case 'content':
        sqlQuery += 'content LIKE ?';
        params.push(likeQuery);
        break;
      case 'date':
        sqlQuery += 'date LIKE ?';
        params.push(likeQuery);
        break;
      case 'time':
        sqlQuery += 'time LIKE ?';
        params.push(likeQuery);
        break;
      case 'all':
      default:
        sqlQuery += 'title LIKE ? OR content LIKE ? OR date LIKE ? OR time LIKE ?';
        params.push(likeQuery, likeQuery, likeQuery, likeQuery);
        break;
    }
    sqlQuery += ' ORDER BY date DESC, time DESC;';

    return await this.db.getAllAsync<Note>(sqlQuery, params);
  }
}
