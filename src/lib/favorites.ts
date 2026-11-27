const KEY = 'rr_favorites';

export function readFavorites(): string[] {
  const saved: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
  if (!Array.isArray(saved) || saved.some(id => typeof id !== 'string')) {
    throw new Error('The saved items record is unreadable.');
  }
  return saved;
}

export function getAll(): string[] {
  try {
    return readFavorites();
  } catch {
    return [];
  }
}

export function isFav(id: string): boolean {
  return getAll().includes(id);
}

export function toggle(id: string): string[] {
  const list = readFavorites();
  const i = list.indexOf(id);
  if (i === -1) {
    list.push(id);
  } else {
    list.splice(i, 1);
  }
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}
