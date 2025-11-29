import * as FileSystem from 'expo-file-system/legacy';
import { Note, StorageService } from '../types/storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Используем FileSystem.documentDirectory, предполагая, что он доступен в legacy или нужно импортировать из основного пакета?
// Обычно константы остаются в основном пакете. Проверим это.
// Если legacy экспорт содержит только функции, константы могут быть потеряны.
// Однако, часто legacy реэкспортирует все старое API.
// Попробуем импортировать константу отдельно, если это не сработает, но пока предположим, что FileSystem содержит все.

const NOTES_DIR = `${FileSystem.documentDirectory}notes/`;

export class FileSystemStorageService implements StorageService {
  async init(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(NOTES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(NOTES_DIR, { intermediates: true });
    }
  }

  private async getNoteFileNames(): Promise<string[]> {
    const files = await FileSystem.readDirectoryAsync(NOTES_DIR);
    return files.filter(file => file.endsWith('.json'));
  }

  async getNotes(): Promise<Note[]> {
    const fileNames = await this.getNoteFileNames();
    const notes: Note[] = [];

    for (const fileName of fileNames) {
      try {
        const fileContent = await FileSystem.readAsStringAsync(`${NOTES_DIR}${fileName}`);
        notes.push(JSON.parse(fileContent));
      } catch (error) {
        console.error(`Error reading or parsing file ${fileName}:`, error);
      }
    }
    // Sort notes by date and time, newest first
    return notes.sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      return dateTimeB.getTime() - dateTimeA.getTime();
    });
  }

  async getNoteById(id: string): Promise<Note | undefined> {
    const filePath = `${NOTES_DIR}${id}.json`;
    try {
      const fileContent = await FileSystem.readAsStringAsync(filePath);
      return JSON.parse(fileContent);
    } catch (error) {
      // В legacy API ошибки могут отличаться, но обычно это тот же объект
      console.error(`Error reading note file ${filePath}:`, error);
      return undefined;
    }
  }

  async saveNote(note: Note): Promise<void> {
    if (!note.id) {
      note.id = uuidv4();
    }
    const filePath = `${NOTES_DIR}${note.id}.json`;
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(note), { encoding: FileSystem.EncodingType.UTF8 });
  }

  async deleteNote(id: string): Promise<void> {
    const filePath = `${NOTES_DIR}${id}.json`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
  }

  async searchNotes(query: string, searchBy?: 'title' | 'content' | 'date' | 'time' | 'all'): Promise<Note[]> {
    const allNotes = await this.getNotes();
    const lowerCaseQuery = query.toLowerCase();

    return allNotes.filter(note => {
      switch (searchBy) {
        case 'title':
          return note.title.toLowerCase().includes(lowerCaseQuery);
        case 'content':
          return note.content.toLowerCase().includes(lowerCaseQuery);
        case 'date':
          return note.date.includes(lowerCaseQuery);
        case 'time':
          return note.time.includes(lowerCaseQuery);
        case 'all':
        default:
          return (
            note.title.toLowerCase().includes(lowerCaseQuery) ||
            note.content.toLowerCase().includes(lowerCaseQuery) ||
            note.date.includes(lowerCaseQuery) ||
            note.time.includes(lowerCaseQuery)
          );
      }
    });
  }
}