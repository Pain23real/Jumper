// GameCore.js - Оптимизированная основная логика игры для React

class GameCore {
  constructor(canvas, scoreElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreElement = scoreElement;
    
    // Размеры холста
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    // Игровые переменные
    this.score = 0;
    this.gameOver = false;
    this.cameraY = 0;
    this.playerName = localStorage.getItem('playerName') || '';
    this.gameStarted = false;
    this.paused = false;
    this.gameStartTime = 0;
    this.safeStartPeriod = 3000; // Безопасный период в начале игры (3 секунды)
    this.baseSpeed = 4; // Базовая скорость игрока
    this.speedIncrement = 0.25; // Увеличение скорости при каждом прыжке
    
    // Переменные для системы delta time
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.targetFPS = 60;
    this.timeStep = 1000 / this.targetFPS;
    this.baseMoveSpeed = 240; // Базовая скорость движения в пикселях в секунду
    this.canvasRefWidth = 800; // Эталонная ширина канваса для нормализации скорости
    
    // Массив платформ
    this.platforms = [];
    
    // Создаем аудиоконтекст
    this.audioCtx = null;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API не поддерживается в этом браузере');
    }
    
    // Изображения
    this.playerImg = new Image();
    this.umbrellaImg = new Image();
    this.playerImg.src = '/ARCIUM_Primary-Icon_light.svg'; // Предполагается, что SVG находится в public
    this.umbrellaImg.src = '/umbrella.svg'; // Предполагается, что SVG находится в public
    
    // Привязываем методы
    this.gameLoop = this.gameLoop.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.togglePause = this.togglePause.bind(this);
    
    // Создаем игрока
    this.player = this.createPlayer();
    
    // Инициализация
    this.init();
  }
  
  // Инициализация игры
  init() {
    // Настройка размеров холста
    this.canvas.width = this.canvas.offsetWidth || 800;
    this.canvas.height = this.canvas.offsetHeight || 600;
    
    // Создание начальных платформ
    this.createInitialPlatforms();
    
    // Настройка обработчиков
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Мобильное управление
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    if (leftBtn && rightBtn) {
      leftBtn.addEventListener('touchstart', this.handleTouchStart);
      leftBtn.addEventListener('touchend', this.handleTouchEnd);
      rightBtn.addEventListener('touchstart', this.handleTouchStart);
      rightBtn.addEventListener('touchend', this.handleTouchEnd);
      
      // Поддержка мыши на мобильных
      leftBtn.addEventListener('mousedown', () => this.setPlayerMovement('left'));
      leftBtn.addEventListener('mouseup', () => this.setPlayerMovement('stop'));
      rightBtn.addEventListener('mousedown', () => this.setPlayerMovement('right'));
      rightBtn.addEventListener('mouseup', () => this.setPlayerMovement('stop'));
      
      leftBtn.addEventListener('mouseleave', () => this.setPlayerMovement('stop'));
      rightBtn.addEventListener('mouseleave', () => this.setPlayerMovement('stop'));
    }
  }
  
  // Метод очистки, вызываемый при размонтировании компонента
  cleanup() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    if (leftBtn && rightBtn) {
      leftBtn.removeEventListener('touchstart', this.handleTouchStart);
      leftBtn.removeEventListener('touchend', this.handleTouchEnd);
      rightBtn.removeEventListener('touchstart', this.handleTouchStart);
      rightBtn.removeEventListener('touchend', this.handleTouchEnd);
      
      leftBtn.removeEventListener('mousedown', () => this.setPlayerMovement('left'));
      leftBtn.removeEventListener('mouseup', () => this.setPlayerMovement('stop'));
      rightBtn.removeEventListener('mousedown', () => this.setPlayerMovement('right'));
      rightBtn.removeEventListener('mouseup', () => this.setPlayerMovement('stop'));
    }
    
    // Останавливаем игровой цикл
    this.gameOver = true;
    this.paused = true;
    this.gameStarted = false;
    
    // Удаляем ссылки
    this.canvas = null;
    this.ctx = null;
    this.scoreElement = null;
    this.audioCtx = null;
    this.playerImg = null;
    this.umbrellaImg = null;
  }
  
  // Создание игрока
  createPlayer() {
    return {
      width: 50,
      height: 50,
      x: this.canvas.width / 2 - 25,
      y: this.canvas.height - 50,
      velocityY: 0,
      velocityX: 0,
      jumping: false,
      gravity: 0.1,
      speed: this.baseSpeed,
      lastPlatformY: this.canvas.height - 50,
      jumpForce: -9.5,
      currentPlatform: null,
      movementMultiplier: 1.2,
      
      draw: () => {
        if (this.playerImg.complete && this.playerImg.naturalWidth > 0) {
          this.ctx.drawImage(
            this.playerImg, 
            this.player.x, 
            this.player.y - this.cameraY, 
            this.player.width, 
            this.player.height
          );
        } else {
          this.ctx.fillStyle = '#8a4fff';
          this.ctx.fillRect(
            this.player.x, 
            this.player.y - this.cameraY, 
            this.player.width, 
            this.player.height
          );
        }
      },
      
      update: () => {
        // Применяем физику с учетом delta time
        this.player.velocityY += this.player.gravity * this.deltaTime * this.targetFPS;
        this.player.y += this.player.velocityY * this.deltaTime * this.targetFPS;
        this.player.x += this.player.velocityX;
        
        // Добавляем эффект экранной петли
        if (this.player.x + this.player.width < 0) {
          this.player.x = this.canvas.width;
        } else if (this.player.x > this.canvas.width) {
          this.player.x = -this.player.width;
        }
        
        // Проверка столкновения с землей
        if (this.player.y + this.player.height > this.canvas.height) {
          this.player.y = this.canvas.height - this.player.height;
          this.player.velocityY = this.player.jumpForce;
          this.player.jumping = false;
        }
      },
      
      moveLeft: () => {
        const speedFactor = (this.canvas.width / this.canvasRefWidth) * this.deltaTime;
        this.player.velocityX = -this.baseMoveSpeed * speedFactor;
      },
      
      moveRight: () => {
        const speedFactor = (this.canvas.width / this.canvasRefWidth) * this.deltaTime;
        this.player.velocityX = this.baseMoveSpeed * speedFactor;
      },
      
      stop: () => {
        this.player.velocityX = 0;
      }
    };
  }
  
  // Создание платформы (зонта)
  createPlatform(x, y) {
    return {
      width: 100,
      height: 20,
      x: x,
      y: y,
      isCurrent: false,
      isBroken: this.score >= 500 && Math.random() < 0.3,
      color: '',
      umbrellaTopOffset: 30, // 1.5 * height
      isMoving: this.score >= 1500 && Math.random() < 0.3,
      moveSpeed: (Math.random() * 2 + 1) * (Math.random() < 0.5 ? 1 : -1),
      moveDistance: Math.random() * 150 + 50,
      initialX: x,
      isTemporary: this.score >= 2000 && Math.random() < 0.2,
      startTime: Date.now(),
      lifeTime: Math.random() * 5000 + 5000,
      opacity: 1,
      fading: false,
      
      // Устанавливаем цвет в конструкторе
      init: () => {
        const platform = this.platforms[this.platforms.length - 1];
        platform.color = platform.isBroken ? '#8a4fff' : this.getRandomColor();
      },
      
      draw: () => {
        const platform = this.platforms.find(p => p.x === x && p.y === y) || {};
        
        if (platform.isCurrent) {
          this.ctx.save();
          this.ctx.shadowColor = '#fff';
          this.ctx.shadowBlur = 15;
        }
        
        this.ctx.save();
        
        // Рисуем зонтик
        const centerX = platform.x + platform.width / 2;
        const centerY = platform.y - this.cameraY;
        const radius = platform.width / 2;
        const handleHeight = platform.height * 1.2;
        
        // Купол зонтика
        this.ctx.beginPath();
        this.ctx.fillStyle = platform.color;
        this.ctx.arc(centerX, centerY - platform.umbrellaTopOffset, radius, Math.PI, 0, false);
        this.ctx.fill();
        
        // Окантовка купола
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#333';
        this.ctx.arc(centerX, centerY - platform.umbrellaTopOffset, radius, Math.PI, 0, false);
        this.ctx.stroke();
        
        // Если зонтик сломан, рисуем зигзаги
        if (platform.isBroken) {
          this.ctx.beginPath();
          this.ctx.lineWidth = 2.5;
          this.ctx.strokeStyle = '#ffffff';
          
          const zigzagCount = 5;
          const zigzagWidth = radius * 1.6 / zigzagCount;
          
          for (let i = 0; i < zigzagCount; i++) {
            const startX = centerX - radius + i * zigzagWidth;
            const endX = startX + zigzagWidth;
            const midY = centerY - platform.umbrellaTopOffset - radius * 0.2;
            const baseY = centerY - platform.umbrellaTopOffset;
            
            this.ctx.moveTo(startX, baseY);
            this.ctx.lineTo((startX + endX) / 2, midY);
            this.ctx.lineTo(endX, baseY);
          }
          this.ctx.stroke();
        }
        
        // Ручка зонтика
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#333';
        this.ctx.moveTo(centerX, centerY - platform.umbrellaTopOffset);
        this.ctx.lineTo(centerX, centerY + handleHeight - platform.umbrellaTopOffset);
        this.ctx.stroke();
        
        // Изгиб на ручке
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#333';
        this.ctx.arc(centerX - 5, centerY + handleHeight - platform.umbrellaTopOffset, 5, 0, Math.PI, false);
        this.ctx.stroke();
        
        // Спицы зонтика
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = '#333';
        for (let i = 1; i <= 6; i++) {
          const angle = Math.PI + (i * Math.PI / 7);
          this.ctx.moveTo(centerX, centerY - platform.umbrellaTopOffset);
          const endX = centerX + radius * Math.cos(angle);
          const endY = centerY - platform.umbrellaTopOffset + radius * Math.sin(angle);
          this.ctx.lineTo(endX, endY);
        }
        this.ctx.stroke();
        
        // Если платформа временная, добавляем пунктирную окантовку
        if (platform.isTemporary) {
          const timePassed = Date.now() - platform.startTime;
          const lifePercentage = timePassed / platform.lifeTime;
          
          if (lifePercentage > 0.7) {
            this.ctx.beginPath();
            this.ctx.setLineDash([5, 3]);
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = '#fff';
            this.ctx.arc(centerX, centerY - platform.umbrellaTopOffset, radius + 3, Math.PI, 0, false);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
          }
        }
        
        this.ctx.restore();
        
        // Текст категории
        const text = this.getCategory(this.score);
        if (text) {
          this.ctx.fillStyle = '#fff';
          this.ctx.font = (text.length > 15 ? 'bold 10px Arial' : 'bold 16px Arial');
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(text, platform.x + platform.width / 2, platform.y - this.cameraY - platform.umbrellaTopOffset - 20);
        }
        
        if (platform.isCurrent) {
          this.ctx.restore();
        }
      },
      
      update: () => {
        const platformIndex = this.platforms.findIndex(p => p.x === x && p.y === y);
        if (platformIndex === -1) return false;
        
        const platform = this.platforms[platformIndex];
        
        // Обновление для движущихся платформ
        if (platform.isMoving) {
          platform.x += platform.moveSpeed;
          
          if (Math.abs(platform.x - platform.initialX) > platform.moveDistance) {
            platform.moveSpeed = -platform.moveSpeed;
          }
          
          if (platform.x < 0) {
            platform.x = 0;
            platform.moveSpeed = Math.abs(platform.moveSpeed);
          } else if (platform.x + platform.width > this.canvas.width) {
            platform.x = this.canvas.width - platform.width;
            platform.moveSpeed = -Math.abs(platform.moveSpeed);
          }
        }
        
        // Проверка времени жизни для временных платформ
        if (platform.isTemporary) {
          const timePassed = Date.now() - platform.startTime;
          
          if (timePassed > platform.lifeTime && !platform.fading) {
            platform.fading = true;
            platform.opacity = 1;
          }
          
          if (platform.fading) {
            platform.opacity -= 0.05;
            if (platform.opacity < 0) platform.opacity = 0;
          }
        }
        
        // Проверяем, нужно ли удалить платформу
        if (platform.fading && platform.opacity <= 0) {
          this.platforms.splice(platformIndex, 1);
          return false;
        }
        
        return true;
      }
    };
  }
  
  // Создание начальных платформ
  createInitialPlatforms() {
    this.platforms = [];
    
    // Стартовая платформа
    this.platforms.push(this.createPlatform(this.canvas.width / 2 - 50, this.canvas.height - 100));
    this.platforms[0].init(); // Инициализация первой платформы
    
    // Остальные платформы
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * (this.canvas.width - 100);
      const y = this.canvas.height - 200 - i * 80;
      this.platforms.push(this.createPlatform(x, y));
      this.platforms[this.platforms.length - 1].init();
    }
  }
  
  // Создание новой платформы
  createNewPlatform() {
    // Находим самую верхнюю платформу
    const highestPlatformY = Math.min(...this.platforms.map(p => p.y));
    
    // Определяем уровень сложности
    const difficultyLevel = this.getDifficultyLevel(this.score);
    
    // Расстояние между платформами
    const verticalGap = 80 + (difficultyLevel * 8);
    
    // Ширина платформ
    const platformWidth = Math.max(40, 100 - (difficultyLevel * 8));
    
    // Новая платформа появляется выше самой верхней
    const y = highestPlatformY - verticalGap;
    
    // Горизонтальная позиция
    const x = Math.random() * (this.canvas.width - platformWidth);
    
    const platform = this.createPlatform(x, y);
    platform.width = platformWidth;
    
    this.platforms.push(platform);
    platform.init();
  }
  
  // Воспроизведение звука при смене категории
  playLevelUpSound() {
    if (!this.audioCtx) return;
    
    try {
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.2);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(220, this.audioCtx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(this.audioCtx.currentTime + 0.5);
      osc2.stop(this.audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Ошибка воспроизведения звука:', e);
    }
  }
  
  // Показ уведомления при изменении категории
  showCategoryChangeNotification(category) {
    // Генерируем событие для React-компонента
    const event = new CustomEvent('categoryChange', { 
      detail: { 
        category: category 
      } 
    });
    document.dispatchEvent(event);
    
    // Воспроизводим звук
    this.playLevelUpSound();
  }
  
  // Проверка столкновений
  checkCollisions() {
    // Сбрасываем флаг текущей платформы
    this.platforms.forEach(platform => platform.isCurrent = false);
    
    // Отслеживаем предыдущую платформу
    const previousPlatform = this.player.currentPlatform;
    
    this.platforms.forEach(platform => {
      const playerBottom = this.player.y + this.player.height;
      const platformTop = platform.y - platform.umbrellaTopOffset;
      
      if (this.player.velocityY > 0 && // Падаем вниз
          this.player.x + this.player.width > platform.x &&
          this.player.x < platform.x + platform.width &&
          playerBottom > platformTop &&
          playerBottom < platformTop + 10) {
        
        this.player.y = platformTop - this.player.height;
        this.player.velocityY = this.player.jumpForce;
        this.player.jumping = false;
        platform.isCurrent = true;
        
        // Если предыдущая платформа была сломана, она должна исчезнуть
        if (previousPlatform && previousPlatform.isBroken && this.score >= 500) {
          const fadeOutPlatform = previousPlatform;
          const fadeOutAnimation = setInterval(() => {
            if (fadeOutPlatform.opacity === undefined) fadeOutPlatform.opacity = 1;
            fadeOutPlatform.opacity -= 0.1;
            
            if (fadeOutPlatform.opacity <= 0) {
              clearInterval(fadeOutAnimation);
              this.platforms = this.platforms.filter(p => p !== fadeOutPlatform);
            }
          }, 50);
        }
        
        this.player.currentPlatform = platform;
        
        // Увеличиваем скорость
        this.player.speed += this.speedIncrement;
        
        // Увеличиваем счет
        if (platform.y < this.player.lastPlatformY) {
          const prevScore = this.score;
          this.score += 20;
          this.scoreElement.textContent = this.score;
          this.player.lastPlatformY = platform.y;
          
          // Проверяем изменение категории
          const prevCategory = this.getCategory(prevScore);
          const currentCategory = this.getCategory(this.score);
          if (prevCategory !== currentCategory) {
            this.showCategoryChangeNotification(currentCategory);
          }
        }
      }
    });
  }
  
  // Обработчики клавиш
  handleKeyDown(event) {
    if (!this.isGameActive()) return;
    
    switch(event.code) {
      case 'KeyA':
      case 'ArrowLeft':
        this.setPlayerMovement('left');
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.setPlayerMovement('right');
        break;
      case 'Escape':
        this.togglePause();
        break;
    }
  }
  
  handleKeyUp(event) {
    if (!this.isGameActive()) return;
    
    if (event.code === 'KeyA' || event.code === 'KeyD' || 
        event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      this.setPlayerMovement('stop');
    }
  }
  
  // Обработчики сенсорных событий
  handleTouchStart(e) {
    e.preventDefault();
    if (!this.isGameActive()) return;
    
    const touch = e.touches[0];
    const target = e.target;
    
    if (target.id === 'leftBtn') {
      this.setPlayerMovement('left');
    } else if (target.id === 'rightBtn') {
      this.setPlayerMovement('right');
    }
  }
  
  handleTouchEnd(e) {
    e.preventDefault();
    if (!this.isGameActive()) return;
    this.setPlayerMovement('stop');
  }
  
  // Установка движения игрока
  setPlayerMovement(direction) {
    if (direction === 'left') {
      this.player.moveLeft();
    } else if (direction === 'right') {
      this.player.moveRight();
    } else {
      this.player.stop();
    }
  }
  
  // Проверка активности игры
  isGameActive() {
    return this.gameStarted && !this.paused && !this.gameOver;
  }
  
  // Переключение паузы
  togglePause() {
    this.paused = !this.paused;
    
    // Генерируем событие для React-компонента
    const event = new CustomEvent('gamePaused', { 
      detail: { 
        isPaused: this.paused 
      } 
    });
    document.dispatchEvent(event);
  }
  
  // Начало игры
  startGame() {
    this.gameStarted = true;
    this.gameOver = false;
    this.paused = false;
    this.gameStartTime = Date.now();
    requestAnimationFrame(this.gameLoop);
    
    // Генерируем событие для React-компонента
    const event = new CustomEvent('gameStarted', { 
      detail: { 
        gameStarted: true 
      } 
    });
    document.dispatchEvent(event);
  }
  
  // Перезапуск игры
  resetGame() {
    // Сбрасываем параметры
    this.score = 0;
    if (this.scoreElement) this.scoreElement.textContent = this.score;
    this.player.y = this.canvas.height - this.player.height;
    this.player.velocityY = this.player.jumpForce;
    this.player.velocityX = 0;
    this.cameraY = 0;
    this.player.lastPlatformY = this.canvas.height - this.player.height;
    this.player.currentPlatform = null;
    this.createInitialPlatforms();
    
    // Снимаем паузу и продолжаем
    this.gameOver = false;
    this.paused = false;
    this.gameStartTime = Date.now();
  }
  
  // Завершение игры
  endGame() {
    this.gameOver = true;
    
    // Генерируем событие для React-компонента
    const event = new CustomEvent('gameOver', { 
      detail: { 
        score: this.score,
        level: this.getDifficultyLevel(this.score)
      } 
    });
    document.dispatchEvent(event);
    
    // Сохраняем счет
    this.saveScore();
  }
  
  // Сохранение счета
  saveScore() {
    if (!this.playerName || this.score <= 0) return;
    
    let records = JSON.parse(localStorage.getItem('records') || '[]');
    const idx = records.findIndex(r => r.name === this.playerName);
    
    if (idx === -1) {
      records.push({ name: this.playerName, score: this.score });
    } else if (this.score > records[idx].score) {
      records[idx].score = this.score;
    }
    
    localStorage.setItem('records', JSON.stringify(records));
  }
  
  // Получение случайного цвета
  getRandomColor() {
    const colors = ['#ff6b6b', '#6b3fd9', '#4ecdc4', '#ffbe0b', '#fb5607', '#8338ec'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Получение категории по очкам
  getCategory(score) {
    if (score < 500) return 'Approve?';
    if (score < 1000) return 'Gmpc';
    if (score < 1500) return 'Arcian';
    if (score < 2000) return 'PARASOL ☂️';
    if (score < 2500) return 'Loosty GM';
    if (score < 3000) return 'Well you a monster';
    if (score < 3500) return 'A BOT?';
    return 'LEGEND';
  }
  
  // Определение уровня сложности
  getDifficultyLevel(score) {
    if (score < 500) return 1;
    if (score < 1000) return 2;
    if (score < 1500) return 3;
    if (score < 2000) return 4;
    if (score < 2500) return 5;
    if (score < 3000) return 6;
    if (score < 3500) return 7;
    return 8;
  }
  
  // Игровой цикл
  gameLoop(timestamp) {
    // Вычисляем delta time
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    this.deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    
    // Ограничиваем deltaTime
    if (this.deltaTime > 0.2) this.deltaTime = 0.2;
    
    if (!this.isGameActive()) {
      if (!this.gameOver) requestAnimationFrame(this.gameLoop);
      return;
    }
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Обновляем позицию камеры
    if (this.player.y < this.cameraY + this.canvas.height * 0.7) {
      this.cameraY = this.player.y - this.canvas.height * 0.7;
    } else if (this.player.y > this.cameraY + this.canvas.height * 0.8) {
      this.cameraY = this.player.y - this.canvas.height * 0.8;
    }
    
    // Определяем уровень сложности
    const difficultyLevel = this.getDifficultyLevel(this.score);
    
    // Корректируем параметры в зависимости от сложности
    this.player.gravity = (0.1 + (difficultyLevel * 0.01)) / (this.targetFPS * this.deltaTime);
    this.player.jumpForce = -10 + (difficultyLevel * 0.18);
    
    const normalizedSpeed = this.baseMoveSpeed * (this.deltaTime * this.targetFPS);
    this.player.speed = Math.max(normalizedSpeed * 0.5, normalizedSpeed * (1 - (difficultyLevel * 0.07)));
    
    // Добавляем эффект "дрожания" платформ
    if (difficultyLevel > 4) {
      this.platforms.forEach(platform => {
        if (Math.random() > (0.95 + this.deltaTime * 0.05)) {
          const shakeFactor = (Math.random() - 0.5) * (difficultyLevel - 3) * 1.5 * this.deltaTime * this.targetFPS;
          platform.x += shakeFactor;
          platform.x = Math.max(0, Math.min(this.canvas.width - platform.width, platform.x));
        }
      });
    }
    
    // Обновляем игрока
    this.player.update();
    this.player.draw();
    
    // Удаляем платформы за пределами экрана
    this.platforms = this.platforms.filter(platform => platform.y < this.cameraY + this.canvas.height + 300);
    
    // Обновляем платформы
    this.platforms.forEach(platform => platform.update());
    
    // Генерируем новые платформы
    while (this.platforms.length < 15) {
      this.createNewPlatform();
    }
    
    // Сортируем и отрисовываем платформы
    this.platforms.sort((a, b) => a.y - b.y);
    this.platforms.forEach(platform => {
      if (platform.opacity !== undefined && platform.opacity < 1) {
        this.ctx.globalAlpha = platform.opacity;
        platform.draw();
        this.ctx.globalAlpha = 1.0;
      } else {
        platform.draw();
      }
    });
    
    // Проверяем столкновения
    this.checkCollisions();
    
    // Проверка на проигрыш
    const currentTime = Date.now();
    const isInSafePeriod = currentTime - this.gameStartTime < this.safeStartPeriod;
    
    if (!isInSafePeriod && this.platforms.length >= 2) {
      const sortedPlatforms = [...this.platforms].sort((a, b) => b.y - a.y);
      const secondLowestPlatform = sortedPlatforms[1];
      
      if (this.player.y > secondLowestPlatform.y + 50) {
        this.endGame();
        return;
      }
    }
    
    requestAnimationFrame(this.gameLoop);
  }
}

export default GameCore; 