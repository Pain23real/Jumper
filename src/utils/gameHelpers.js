/**
 * Функция для получения категории по очкам
 * 
 * @param {number} score - Количество очков игрока
 * @returns {string} - Название категории
 */
export const getCategory = (score) => {
  if (score < 1500) return 'Sybil';
  if (score < 3000) return 'Approve?';
  if (score < 5000) return 'Gmpc';
  if (score < 7000) return 'Arcian';
  if (score < 10000) return 'PARASOL ☂️';
  if (score < 15000) return 'Loosty GM';
  if (score < 30000) return 'Well you a monster';
  return 'LEGEND';
};

/**
 * Функция для получения цвета категории
 * 
 * @param {string} category - Название категории
 * @returns {string} - Цвет в формате HEX
 */
export const getCategoryColor = (category) => {
  switch(category) {
    case 'Sybil': return '#6c757d';
    case 'Approve?': return '#28a745';
    case 'Gmpc': return '#17a2b8';
    case 'Arcian': return '#fd7e14';
    case 'PARASOL ☂️': return '#dc3545';
    case 'Loosty GM': return '#7952b3';
    case 'Well you a monster': return '#ff6b6b';
    case 'LEGEND': return '#ffc107';
    default: return '#6c757d';
  }
};

/**
 * Функция для определения уровня сложности по очкам
 * 
 * @param {number} score - Количество очков игрока
 * @returns {number} - Уровень сложности от 1 до 8
 */
export const getDifficultyLevel = (score) => {
  if (score < 1500) return 1;
  if (score < 3000) return 2;
  if (score < 5000) return 3;
  if (score < 7000) return 4;
  if (score < 10000) return 5;
  if (score < 15000) return 6;
  if (score < 30000) return 7;
  return 8;
};

/**
 * Функция для получения записей из localStorage
 * 
 * @returns {Array} - Массив записей, отсортированный по убыванию очков
 */
export const getLeaderboardRecords = () => {
  // Получаем записи из localStorage
  try {
    let records = JSON.parse(localStorage.getItem('records') || '[]');
    
    // Сортируем по убыванию очков
    records.sort((a, b) => b.score - a.score);
    
    return records;
  } catch (error) {
    console.error('Error loading records from localStorage:', error);
    return [];
  }
};

/**
 * Функция для сохранения записей в localStorage
 * 
 * @param {Array} records - Массив записей
 */
export const saveLeaderboardRecords = (records) => {
  try {
    localStorage.setItem('records', JSON.stringify(records));
    
    // Создаем резервную копию в sessionStorage
    sessionStorage.setItem('records_backup', JSON.stringify(records));
  } catch (error) {
    console.error('Error saving records to localStorage:', error);
  }
};

/**
 * Функция для добавления или обновления записи игрока
 * 
 * @param {string} playerName - Имя игрока
 * @param {number} score - Количество очков
 * @returns {object} - Информация о результате сохранения
 */
export const savePlayerScore = (playerName, score) => {
  if (!playerName || score <= 0) {
    return { success: false, message: 'Invalid player name or score' };
  }
  
  try {
    let records = getLeaderboardRecords();
    const idx = records.findIndex(r => r.name === playerName);
    let isNewRecord = false;
    
    if (idx === -1) {
      // Нет записи — добавляем
      records.push({ name: playerName, score });
      isNewRecord = true;
    } else if (score > records[idx].score) {
      // Есть запись, но побит рекорд — обновляем
      isNewRecord = true;
      records[idx].score = score;
    } // иначе не обновляем
    
    // Сохраняем обновленные записи
    saveLeaderboardRecords(records);
    
    // Возвращаем информацию о результате
    return {
      success: true,
      isNewRecord,
      oldScore: idx !== -1 ? records[idx].score : 0,
      rank: records.findIndex(r => r.name === playerName) + 1
    };
  } catch (error) {
    console.error('Error saving player score:', error);
    return { success: false, message: 'Error saving score' };
  }
}; 