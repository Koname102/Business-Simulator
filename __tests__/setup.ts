import { vi, beforeEach } from 'vitest';

// Mock crypto.randomUUID for deterministic tests
let idCounter = 0;

// Use vi.stubGlobal for read-only properties
vi.stubGlobal('crypto', {
  ...crypto,
  randomUUID: vi.fn(() => {
    idCounter++;
    return `test-uuid-${idCounter.toString().padStart(4, '0')}`;
  }),
});

// Mock localStorage for Zustand persist middleware
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = value;
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

vi.stubGlobal('localStorage', localStorageMock);

// Reset counter before each test
beforeEach(() => {
  idCounter = 0;
  localStorageMock.clear();
});