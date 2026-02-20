
import { CombatCard, UserProfile } from "./types";

const STORAGE_KEY = 'warlord_combat_cards_v2';
const USER_KEY = 'warlord_user_profile';

const getLocalCards = (): CombatCard[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setLocalCards = (cards: CombatCard[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  notifyListeners();
};

const listeners: ((cards: CombatCard[]) => void)[] = [];
const notifyListeners = () => {
  const cards = getLocalCards();
  listeners.forEach(cb => cb(cards));
};

export const saveCombatCard = async (card: Omit<CombatCard, 'id' | 'createdAt'>) => {
  const cards = getLocalCards();
  const newCard: CombatCard = {
    ...card,
    id: `intel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: Date.now()
  };
  setLocalCards([newCard, ...cards]);
  return newCard;
};

export const updateCombatCard = async (id: string, updates: Partial<CombatCard>) => {
  const cards = getLocalCards();
  const updated = cards.map(c => c.id === id ? { ...c, ...updates } : c);
  setLocalCards(updated);
};

export const deleteCombatCard = async (id: string) => {
  const cards = getLocalCards();
  setLocalCards(cards.filter(c => c.id !== id));
};

export const subscribeToCards = (callback: (cards: CombatCard[]) => void) => {
  listeners.push(callback);
  callback(getLocalCards());
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
};

export const getUserProfile = (): UserProfile | null => {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setUserProfile = (profile: UserProfile | null) => {
  if (profile) localStorage.setItem(USER_KEY, JSON.stringify(profile));
  else localStorage.removeItem(USER_KEY);
};

export const exportDossier = () => {
  const data = {
    cards: getLocalCards(),
    user: getUserProfile(),
    exportDate: Date.now()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `WARLORD_DOSSIER_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

export const importDossier = (jsonString: string) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.cards) setLocalCards(data.cards);
    if (data.user) setUserProfile(data.user);
    return true;
  } catch (e) {
    return false;
  }
};
