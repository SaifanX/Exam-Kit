
import { CombatCard } from "./types";

const STORAGE_KEY = 'warlord_combat_cards';

/**
 * LOCAL-FIRST STORAGE ENGINE
 * Replaces Firebase to ensure 100% uptime and bypass invalid API key errors.
 * Implements the same interface as the original Firebase service.
 */

const getLocalCards = (): CombatCard[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("CRITICAL: Failed to read from tactical storage", e);
    return [];
  }
};

const setLocalCards = (cards: CombatCard[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    notifyListeners();
  } catch (e) {
    console.error("CRITICAL: Failed to write to tactical storage", e);
  }
};

const listeners: ((cards: CombatCard[]) => void)[] = [];

const notifyListeners = () => {
  const cards = getLocalCards();
  listeners.forEach(cb => cb(cards));
};

export const loginAnonymously = async () => {
  // Simulate tactical session initialization
  console.log("WARLORD_OS: Anonymous tactical session established locally.");
  return Promise.resolve({ user: { uid: 'warlord-local-01' } });
};

export const saveCombatCard = async (card: Omit<CombatCard, 'id' | 'createdAt'>) => {
  const cards = getLocalCards();
  const newCard: CombatCard = {
    ...card,
    id: `intel_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    createdAt: Date.now()
  };
  setLocalCards([newCard, ...cards]);
  return Promise.resolve(newCard);
};

export const deleteCombatCard = async (id: string) => {
  const cards = getLocalCards();
  const filtered = cards.filter(c => c.id !== id);
  setLocalCards(filtered);
  return Promise.resolve();
};

export const subscribeToCards = (callback: (cards: CombatCard[]) => void) => {
  // Register listener for real-time updates
  listeners.push(callback);
  
  // Execute immediate initial sync
  callback(getLocalCards());
  
  // Return standard unsubscribe teardown
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

// Compatibility stubs for external references
export const db = {};
export const auth = {};
