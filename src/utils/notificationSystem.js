// Notification system to prevent overlapping notifications
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.baseTop = 100; // Starting position from top
    this.spacing = 80; // Space between notifications
  }

  createNotification(message, options = {}) {
    const {
      type = 'info',
      duration = 5000,
      icon = '📢',
      persistent = false
    } = options;

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">${icon}</div>
        <div class="notification-text">${message}</div>
        ${!persistent ? '<div class="notification-close">×</div>' : ''}
      </div>
    `;

    // Calculate position
    const position = this.baseTop + (this.notifications.length * this.spacing);

    // Apply styles
    this.applyNotificationStyles(notification, position);

    // Add to DOM and track
    document.body.appendChild(notification);
    this.notifications.push({
      element: notification,
      position: position,
      duration: duration,
      persistent: persistent
    });

    // Add close functionality
    if (!persistent) {
      const closeBtn = notification.querySelector('.notification-close');
      closeBtn.addEventListener('click', () => this.removeNotification(notification));

      // Auto remove after duration
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    });

    return notification;
  }

  applyNotificationStyles(notification, topPosition) {
    notification.style.position = 'fixed';
    notification.style.top = `${topPosition}px`;
    notification.style.right = '20px';
    notification.style.backgroundColor = 'rgba(26, 9, 51, 0.95)';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '10px';
    notification.style.boxShadow = '0 0 30px rgba(176, 38, 255, 0.7)';
    notification.style.zIndex = '10000';
    notification.style.border = '2px solid rgba(176, 38, 255, 0.5)';
    notification.style.maxWidth = '320px';
    notification.style.wordWrap = 'break-word';
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    notification.style.transition = 'all 0.3s ease-out';
    notification.style.backdropFilter = 'blur(10px)';

    // Content styles
    const content = notification.querySelector('.notification-content');
    content.style.display = 'flex';
    content.style.alignItems = 'flex-start';
    content.style.gap = '10px';
    content.style.position = 'relative';

    // Icon styles
    const icon = notification.querySelector('.notification-icon');
    icon.style.fontSize = '1.5rem';
    icon.style.color = '#b026ff';
    icon.style.flexShrink = '0';

    // Text styles
    const text = notification.querySelector('.notification-text');
    text.style.fontSize = '0.9rem';
    text.style.lineHeight = '1.4';
    text.style.flex = '1';

    // Close button styles
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '-5px';
      closeBtn.style.right = '-5px';
      closeBtn.style.width = '20px';
      closeBtn.style.height = '20px';
      closeBtn.style.borderRadius = '50%';
      closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      closeBtn.style.display = 'flex';
      closeBtn.style.alignItems = 'center';
      closeBtn.style.justifyContent = 'center';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '12px';
      closeBtn.style.transition = 'background-color 0.2s ease';

      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      });

      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      });
    }
  }

  removeNotification(notification) {
    const index = this.notifications.findIndex(n => n.element === notification);
    if (index === -1) return;

    // Animate out
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }

      // Remove from tracking
      this.notifications.splice(index, 1);

      // Reposition remaining notifications
      this.repositionNotifications();
    }, 300);
  }

  repositionNotifications() {
    this.notifications.forEach((notification, index) => {
      const newPosition = this.baseTop + (index * this.spacing);
      notification.element.style.top = `${newPosition}px`;
      notification.position = newPosition;
    });
  }

  clearAll() {
    this.notifications.forEach(notification => {
      this.removeNotification(notification.element);
    });
  }

  // Method to show Discord nickname prompt
  showDiscordPrompt() {
    return this.createNotification(
      'Please enter your Discord nickname to start the game',
      {
        type: 'info',
        icon: '👤',
        duration: 6000
      }
    );
  }
}

// Create global notification manager
const notificationManager = new NotificationManager();

// Export for use in other files
window.notificationManager = notificationManager;

export default notificationManager; 