// Простая реализация уведомлений для важных сообщений

// Функция настройки уведомлений
export function setupNotifications() {
  // Создаем контейнер для уведомлений, если его еще нет
  let container = document.getElementById('notification-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '80px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'flex-end';
    container.style.gap = '10px';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
  }
  
  // Регистрируем глобальные функции
  window.showNotification = showNotification;
  window.closeNotification = closeNotification;
  window.notificationsSetup = true;
  
  return {
    showNotification,
    closeNotification
  };
}

// Функция показа уведомления
export function showNotification(options = {}) {
  const { type = 'info', message = '', duration = 5000 } = options;
  
  // Создаем контейнер для уведомлений, если его еще нет
  let container = document.getElementById('notification-container');
  if (!container) {
    setupNotifications();
    container = document.getElementById('notification-container');
  }
  
  // Создаем элемент уведомления
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // Устанавливаем стили для уведомления
  notification.style.backgroundColor = 'rgba(26, 9, 51, 0.9)';
  notification.style.color = 'white';
  notification.style.padding = '15px';
  notification.style.borderRadius = '10px';
  notification.style.marginBottom = '10px';
  notification.style.boxShadow = '0 0 20px rgba(176, 38, 255, 0.5)';
  notification.style.maxWidth = '350px';
  notification.style.pointerEvents = 'auto';
  notification.style.animation = 'fadeIn 0.5s ease-out';
  notification.style.border = '1px solid rgba(176, 38, 255, 0.3)';
  notification.style.transition = 'all 0.5s ease-out';
  
  // Выбираем иконку в зависимости от типа
  let iconType = '💬';
  if (type === 'error') iconType = '⚠️';
  if (type === 'success') iconType = '✅';
  if (type === 'warning') iconType = '⚠️';
  if (type === 'info') iconType = 'ℹ️';
  if (type === 'discord') iconType = '👤';
  
  // Устанавливаем содержимое уведомления
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="font-size: 1.5rem; color: #b026ff;">${iconType}</div>
      <div style="font-size: 0.9rem; flex-grow: 1;">${message}</div>
      <div style="cursor: pointer; font-size: 1.2rem; opacity: 0.7;" 
           onclick="window.closeNotification(this.parentElement.parentElement)">×</div>
    </div>
  `;
  
  // Добавляем уведомление в контейнер
  container.appendChild(notification);
  
  // Настраиваем автоматическое исчезновение
  if (duration > 0) {
    setTimeout(() => {
      closeNotification(notification);
    }, duration);
  }
  
  return notification;
}

// Функция закрытия уведомления
export function closeNotification(notification) {
  if (!notification) return;
  
  // Анимация исчезновения
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(20px)';
  
  // Удаляем элемент после завершения анимации
  setTimeout(() => {
    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 500);
} 