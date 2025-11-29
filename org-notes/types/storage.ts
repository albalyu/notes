export interface Note {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
}

export interface StorageService {
  init(): Promise<void>;
  getNotes(): Promise<Note[]>;
  getNoteById(id: string): Promise<Note | undefined>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  searchNotes(query: string, searchBy?: 'title' | 'content' | 'date' | 'time' | 'all'): Promise<Note[]>;
}

export type StorageType = 'sqlite' | 'file-system';
