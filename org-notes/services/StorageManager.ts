import { StorageService, StorageType } from '../types/storage';
import { SQLiteStorageService } from './SQLiteStorageService';
import { FileSystemStorageService } from './FileSystemStorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_TYPE_KEY = 'preferredStorageType';

export class StorageManager implements StorageService {
  private static instance: StorageManager;
  private currentService: StorageService | null = null;
  private currentStorageType: StorageType = 'sqlite'; // Default to SQLite

  private constructor() {}

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async init(): Promise<void> {
    const savedType = (await AsyncStorage.getItem(STORAGE_TYPE_KEY)) as StorageType | null;
    if (savedType) {
      this.currentStorageType = savedType;
    }
    await this.initializeService(this.currentStorageType);
  }

  private async initializeService(type: StorageType): Promise<void> {
    if (this.currentService && this.currentStorageType === type) {
      // Service already initialized and is the correct type
      return;
    }

    if (type === 'sqlite') {
      this.currentService = new SQLiteStorageService();
    } else if (type === 'file-system') {
      this.currentService = new FileSystemStorageService();
    } else {
      throw new Error(`Unknown storage type: ${type}`);
    }
    this.currentStorageType = type;
    await this.currentService.init();
    await AsyncStorage.setItem(STORAGE_TYPE_KEY, type);
  }

  async switchStorageType(newType: StorageType): Promise<void> {
    if (this.currentStorageType === newType) {
      return; // Already using this type
    }
    // No data migration for now, just switch
    await this.initializeService(newType);
  }

  getCurrentStorageType(): StorageType {
    return this.currentStorageType;
  }

  // --- Delegate all StorageService methods to the currentService ---
  async getNotes() {
    if (!this.currentService) await this.init(); // Ensure service is initialized
    return this.currentService!.getNotes();
  }

  async getNoteById(id: string) {
    if (!this.currentService) await this.init();
    return this.currentService!.getNoteById(id);
  }

  async saveNote(note: any) {
    if (!this.currentService) await this.init();
    return this.currentService!.saveNote(note);
  }

  async deleteNote(id: string) {
    if (!this.currentService) await this.init();
    return this.currentService!.deleteNote(id);
  }

  async searchNotes(query: string, searchBy?: 'title' | 'content' | 'date' | 'time' | 'all') {
    if (!this.currentService) await this.init();
    return this.currentService!.searchNotes(query, searchBy);
  }
}
