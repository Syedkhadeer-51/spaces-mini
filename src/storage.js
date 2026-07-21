const STORAGE_KEY = 'spaces-viewer-settings';

const DEFAULT_HDRI = {
  id: 'default-scythian',
  name: 'Scythian Tombs',
  source: 'path',
  url: '/img/scythian_tombs_2_4k.hdr',
};

export const PLAIN_BACKGROUND = '#e8eaed';

export function getDefaultSettings() {
  return {
    theme: 'dark',
    activeHdriId: DEFAULT_HDRI.id,
    hdriLibrary: [DEFAULT_HDRI],
  };
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultSettings();

    const parsed = JSON.parse(raw);
    const library = Array.isArray(parsed.hdriLibrary) && parsed.hdriLibrary.length > 0
      ? parsed.hdriLibrary
      : [DEFAULT_HDRI];

    const activeHdriId = library.some((item) => item.id === parsed.activeHdriId)
      ? parsed.activeHdriId
      : library[0].id;

    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      activeHdriId,
      hdriLibrary: library,
    };
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.warn('Failed to save viewer settings:', error);
    return false;
  }
}

export function resolveHdriUrl(entry) {
  if (!entry) return null;
  if (entry.source === 'data') return entry.data;
  return entry.url;
}

export async function readHdriFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
