// Генерация уникального ID игры
export function generateGameId() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  
  // Создание ссылки-приглашения
  export function createInviteLink(gameId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?game=${gameId}`;
  }
  
  // Парсинг ссылки для присоединения
  export function parseGameLink() {
    const params = new URLSearchParams(window.location.search);
    return params.get('game');
  }
  
  // Копирование в буфер обмена
  export async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Фолбэк для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  }