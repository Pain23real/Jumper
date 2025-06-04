// Game.js - Main logic for The Secret Jump game

class Game {
  constructor(canvas, scoreElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scoreElement = scoreElement;
    
    // Размеры
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Игровые переменные
    this.score = 0;
    this.level = 1;
    this.isGameOver = false;
    this.isPaused = false;
    this.animationFrameId = null;
    this.lastFallTime = 0; // Время последнего падения
    this.isFalling = false; // Флаг падения
    this.lastPlatformId = null; // Для отслеживания последней платформы, с которой был прыжок
    this.lastPlatformY = undefined; // Для отслеживания высоты последней платформы
    this.lastScoreUpdateTime = 0; // Время последнего обновления счета
    this.playerImage = null; // Добавляем изображение игрока
    this.fallTimer = 0; // Таймер для подсчета времени падения
    this.maxFallTime = 3000; // Максимальное время падения до проигрыша (увеличено с 2000 до 3000 мс)
    this.speedMultiplier = 1.0; // Фиксированный множитель скорости (больше не увеличивается)
    
    // Система усложнений игры при достижении новых рангов
    this.difficultySystem = {
      // Процент ломающихся платформ
      brokenPlatformChance: 0.05, // Базовый шанс 5%
      // Ветер (смещение игрока)
      wind: {
        enabled: false,
        strength: 0,
        direction: 1, // 1 или -1
        changeTimer: 0,
        changeInterval: 3000 // Менять направление каждые 3 секунды
      },
      // Уменьшение размера зонтиков
      umbrellaSizeReduction: 0, // Начальное значение - нет уменьшения
      // Капли дождя
      raindrops: {
        enabled: false,
        count: 0,
        drops: [] // Массив с каплями
      },
      // Увеличение скорости движущихся платформ
      movingPlatformSpeedMultiplier: 1.0,
      // Процент временных платформ
      temporaryPlatformChance: 0.05, // Базовый шанс 5%
      // Раскачивающиеся платформы
      swingingPlatforms: {
        enabled: false,
        amplitude: 0, // Амплитуда раскачивания
        frequency: 0.02 // Частота раскачивания
      },
      // Скользкие платформы
      slipperyPlatforms: {
        enabled: false,
        slipFactor: 0 // Фактор скольжения
      },
      // Последний примененный ранг для отслеживания изменений
      lastAppliedRank: null
    };
    
    // Создаем менеджер паузы
    this.pauseManager = new PauseManager(this);
    
    // Константы для адаптации к разным разрешениям
    this.baseWidth = 800; // Базовая ширина для расчета
    this.baseHeight = 600; // Базовая высота для расчета
    this.scaleFactor = 1; // Будет пересчитан в init()
    
    // Платформы (зонты)
    this.platforms = [];
    this.platformHeight = 15;
    this.platformMinWidth = 120; // Значения для лучшей видимости
    this.platformMaxWidth = 180;
    this.platformGapY = 225; // Увеличиваем расстояние между платформами в 1.5 раза (было 150)
    this.umbrellaWidthRatio = 2.5; // Измененное соотношение размера зонтика к ширине платформы (было 3)
    this.platformTypes = {
      NORMAL: 0,
      BROKEN: 1,
      TEMPORARY: 2,
      MOVING: 3
    };
    
    // Игрок (увеличиваем размер)
    this.player = {
      width: 60, // Увеличиваем с 40 на 60
      height: 60, // Увеличиваем с 40 на 60
      x: this.width / 2 - 30, // Корректируем позицию с учетом нового размера
      y: this.height / 2,
      velocityY: 0,
      velocityX: 0,
      jumpForce: -18 * this.scaleFactor, // Уменьшаем с -24 до -18 (увеличено с -12)
      gravity: 0.3 * this.scaleFactor * this.speedMultiplier, // Увеличено с 0.25 до 0.3
      jumping: false,
      grounded: false,
      speed: 7 // Увеличено с 5.5 до 7
    };
    
    // Управление
    this.keys = {
      left: false,
      right: false
    };
    
    // Камера (следит за игроком)
    this.camera = {
      y: 0,
      speed: 2.5 * this.scaleFactor * this.speedMultiplier, // Увеличено с 2.0 до 2.5
      adaptiveSpeed: true, // Включаем адаптивную скорость камеры
      followHeight: 0.35 // Уменьшено с 0.4 до 0.35 для более быстрого следования
    };
    
    // Цвета
    this.colors = {
      background: '#2c1c46', // Более красивый фиолетовый фон
      player: '#9845f5', // Светло-фиолетовый
      normalPlatform: '#8a2be2', // Основной фиолетовый
      brokenPlatform: '#ff4757',
      temporaryPlatform: '#ffa502',
      movingPlatform: '#2ed573',
      umbrellaHandle: '#654321'
    };
    
    // Добавляем звания игрока с порогами очков
    this.ranks = {
      APPROVE: { score: 1500, title: 'Approve?' },
      GMPC: { score: 3000, title: 'Gmpc' },
      ARCIAN: { score: 5000, title: 'Arcian' },
      PARASOL: { score: 7000, title: 'PARASOL ☂️' },
      LOOSTY: { score: 10000, title: 'Loosty GM' },
      MONSTER: { score: 15000, title: 'Well you a monster' },
      BOT: { score: 30000, title: 'A BOT?' },
      LEGEND: { score: Infinity, title: 'LEGEND' }
    };
    
    this.currentRank = this.ranks.APPROVE.title;
    
    // Явная привязка методов к объекту класса
    this.update = this.update.bind(this);
    this.draw = this.draw.bind(this);
    this.gameLoop = this.gameLoop.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.togglePause = this.togglePause.bind(this);
    
    // Загружаем изображение игрока
    this.loadPlayerImage();
    
    // Игра НЕ начинается автоматически при инициализации
    this.init();
  }
  
  // Метод для загрузки изображения игрока
  loadPlayerImage() {
    this.playerImage = new Image();
    // Используем путь к изображению, которое приложил пользователь
    this.playerImage.src = '/ARCIUM_Primary-Icon_light.svg'; // Обновляем путь к новому изображению
    this.playerImage.onload = () => {
      console.log("Изображение персонажа загружено успешно");
    };
    this.playerImage.onerror = (error) => {
      console.error("Ошибка загрузки изображения персонажа:", error);
      // Пробуем альтернативный путь, если первый не сработал
      this.playerImage.src = '/assets/ARCIUM_Primary-Icon_light.svg';
    };
  }
  
  init() {
    // Настройка размеров холста
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    // Рассчитываем масштаб для адаптации
    this.scaleFactor = Math.min(
      this.width / this.baseWidth,
      this.height / this.baseHeight
    );
    
    // Масштабируем размеры игрока
    this.player.width = 60 * this.scaleFactor; // Увеличено с 40 на 60
    this.player.height = 60 * this.scaleFactor; // Увеличено с 40 на 60
    
    // Масштабируем физические параметры
    this.player.jumpForce = -18 * this.scaleFactor; // Уменьшаем с -24 до -18 (увеличено с -12)
    this.player.gravity = 0.3 * this.scaleFactor * this.speedMultiplier; // Увеличено с 0.25 до 0.3
    this.camera.speed = 2.5 * this.scaleFactor * this.speedMultiplier; // Увеличено с 2.0 до 2.5
    this.player.speed = 7 * this.scaleFactor; // Оставляем как есть
    
    // Масштабируем платформы
    this.platformHeight = 15 * this.scaleFactor;
    this.platformMinWidth = 120 * this.scaleFactor;
    this.platformMaxWidth = 180 * this.scaleFactor;
    this.platformGapY = 225 * this.scaleFactor; // Увеличиваем расстояние между платформами в 1.5 раза
    
    // Центрируем игрока
    this.player.x = this.width / 2 - this.player.width / 2;
    this.player.y = this.height / 2;
    
    // Добавляем обработчики клавиш
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Генерация начальных платформ
    this.generatePlatforms();
    
    // Устанавливаем время для анимационного цикла
    this.lastTime = 0;
    
    // Только отрисовка сцены, игровой цикл НЕ запускается
    this.draw();
  }
  
  generatePlatforms() {
    // Очистка существующих платформ
    this.platforms = [];
    
    // Создаем первую платформу прямо под игроком для начала игры
    const startPlatformY = this.height / 2 + this.player.height * 2; 
    
    this.platforms.push({
      x: this.width / 2 - this.platformMaxWidth / 2,
      y: startPlatformY,
      width: this.platformMaxWidth,
      height: this.platformHeight,
      type: this.platformTypes.NORMAL
    });
    
    // Шаг между уровнями платформ по Y (увеличиваем до 180 пикселей)
    const stepY = 180;
    
    // Генерируем начальные платформы выше центра экрана
    // Начинаем от центра экрана и поднимаемся вверх
    let currentY = this.height / 2 - stepY;
    
    // Генерируем платформы вверх на 20 уровней (достаточно для начала игры)
    for (let level = 0; level < 20; level++) {
      // Определяем случайное количество платформ на этом уровне (максимум 2)
      const platformsOnLevel = Math.floor(Math.random() * 2) + 1; // 1 или 2
      
      // Создаем случайные платформы на текущем уровне
      for (let i = 0; i < platformsOnLevel; i++) {
        this.createTopPlatform(currentY);
      }
      
      // Переходим на следующий уровень выше
      currentY -= stepY;
    }
  }
  
  // Метод для создания платформы в заданной области
  createPlatformInArea(minX, maxX, minY, maxY) {
    const width = Math.random() * (this.platformMaxWidth - this.platformMinWidth) + this.platformMinWidth;
    
    // Проверяем, чтобы платформа влезла в заданную область по X
    const actualMaxX = Math.min(maxX, this.width - width);
    
    // Если область невалидна, используем безопасные значения
    const x = minX < actualMaxX ? 
      minX + Math.random() * (actualMaxX - minX) : 
      Math.max(0, this.width - width - 10);
    
    const y = minY + Math.random() * (maxY - minY);
    
    // Выбор типа платформы в зависимости от уровня
    let type = this.platformTypes.NORMAL;
    
    // Вероятности появления различных типов платформ в зависимости от уровня
    if (this.level >= 2) {
      const rand = Math.random();
      
      if (this.level >= 5) {
        // Уровень 5+: больше движущихся и временных платформ
        if (rand > 0.85) {
          type = this.platformTypes.MOVING;
        } else if (rand > 0.70) {
          type = this.platformTypes.TEMPORARY;
        } else if (rand > 0.55) {
          type = this.platformTypes.BROKEN;
        }
      } else if (this.level >= 3) {
        // Уровень 3-4: появляются все типы платформ
        if (rand > 0.85) {
          type = this.platformTypes.MOVING;
        } else if (rand > 0.70) {
          type = this.platformTypes.TEMPORARY;
        } else if (rand > 0.55) {
          type = this.platformTypes.BROKEN;
        }
      } else {
        // Уровень 2: появляются только сломанные платформы
        if (rand > 0.75) {
          type = this.platformTypes.BROKEN;
        }
      }
    }
    
    // Создание платформы
    const platform = {
      x,
      y,
      width,
      height: this.platformHeight,
      type,
      disappearing: false
    };
    
    // Дополнительные свойства для движущихся платформ
    if (type === this.platformTypes.MOVING) {
      platform.direction = Math.random() > 0.5 ? 1 : -1;
      platform.speed = (Math.random() * 2 + 1) * this.scaleFactor;
    }
    
    this.platforms.push(platform);
  }
  
  // Метод для генерации только верхних платформ во время игры
  createTopPlatform(yPosition) {
    // Вычисляем X в случайной позиции
    const width = Math.random() * (this.platformMaxWidth - this.platformMinWidth) + this.platformMinWidth;
    const x = Math.random() * (this.width - width);
    
    // Используем переданную Y-позицию или создаем новую относительно камеры
    const y = yPosition !== undefined ? 
      yPosition : 
      this.camera.y - this.height - Math.random() * 100;
    
    // Выбор типа платформы в зависимости от уровня и текущих параметров сложности
    let type = this.platformTypes.NORMAL;
    
    // Используем параметры системы сложности для определения типа платформы
    const rand = Math.random();
    
    // Проверка на ломающуюся платформу
    if (rand < this.difficultySystem.brokenPlatformChance) {
      type = this.platformTypes.BROKEN;
    }
    // Проверка на временную платформу
    else if (rand < this.difficultySystem.brokenPlatformChance + this.difficultySystem.temporaryPlatformChance) {
      type = this.platformTypes.TEMPORARY;
    }
    // Проверка на движущуюся платформу (базовая вероятность + прогрессия с уровнем)
    else if (rand < this.difficultySystem.brokenPlatformChance + 
             this.difficultySystem.temporaryPlatformChance + 
             0.05 + (this.level * 0.02)) {
      type = this.platformTypes.MOVING;
    }
    
    // Создание платформы с уникальным ID для отслеживания
    const platform = {
      id: Date.now() + Math.random(), // Уникальный ID для каждой платформы
      x,
      y,
      width,
      height: this.platformHeight,
      type,
      disappearing: false
    };
    
    // Добавляем свойства для раскачивающихся платформ
    if (this.difficultySystem.swingingPlatforms.enabled) {
      platform.swinging = Math.random() < 0.4; // 40% шанс быть раскачивающейся
      platform.swingOffset = 0;
      platform.swingTime = Math.random() * 1000; // Случайная начальная фаза
    }
    
    // Добавляем свойства для скользких платформ
    if (this.difficultySystem.slipperyPlatforms.enabled) {
      platform.slippery = Math.random() < 0.3; // 30% шанс быть скользкой
    }
    
    // Дополнительные свойства для движущихся платформ
    if (type === this.platformTypes.MOVING) {
      platform.direction = Math.random() > 0.5 ? 1 : -1;
      // Скорость умножается на множитель скорости движущихся платформ
      platform.speed = (Math.random() * 2 + 1) * this.scaleFactor * this.difficultySystem.movingPlatformSpeedMultiplier;
    }
    
    this.platforms.push(platform);
    return platform;
  }
  
  gameLoop(timestamp) {
    // Если игра завершена или контекст уничтожен, останавливаем цикл
    if (this.isGameOver || !this.ctx || !this.canvas) {
      console.log("Stopping game loop: game over or context destroyed");
      this.animationFrameId = null;
      return;
    }
    
    // Расчет deltaTime для плавности анимации
    const deltaTime = this.lastTime ? Math.min(timestamp - this.lastTime, 33) : 16;
    this.lastTime = timestamp;
    
    // Обновляем только если нет паузы
    if (!this.isPaused) {
      this.update(deltaTime);
      this.draw();
    } else {
      // Если на паузе, просто рисуем текущее состояние и экран паузы
      this.draw();
      this.pauseManager.drawPauseScreen();
    }
    
    // Запрашиваем следующий кадр анимации
    const boundGameLoop = this.gameLoop.bind(this);
    this.animationFrameId = requestAnimationFrame(boundGameLoop);
  }
  
  update(deltaTime) {
    // Логирование для отладки
    if (this.score % 100 === 0) {
      console.log('Player position:', this.player.x, this.player.y);
      console.log('Player velocity:', this.player.velocityX, this.player.velocityY);
    }
    
    // Движение игрока по горизонтали в зависимости от нажатых клавиш
    if (this.keys.left) {
      this.player.velocityX = -this.player.speed;
    } else if (this.keys.right) {
      this.player.velocityX = this.player.speed;
    } else {
      this.player.velocityX = 0;
    }
    
    // Применяем эффект ветра, если он включен
    if (this.difficultySystem.wind.enabled) {
      // Обновляем таймер смены направления ветра
      this.difficultySystem.wind.changeTimer += deltaTime;
      
      // Меняем направление ветра периодически
      if (this.difficultySystem.wind.changeTimer >= this.difficultySystem.wind.changeInterval) {
        this.difficultySystem.wind.direction = Math.random() > 0.5 ? 1 : -1;
        this.difficultySystem.wind.changeTimer = 0;
      }
      
      // Применяем силу ветра к скорости игрока
      this.player.velocityX += this.difficultySystem.wind.strength * this.difficultySystem.wind.direction;
    }
    
    // Обновление позиции игрока
    this.player.x += this.player.velocityX;
    this.player.y += this.player.velocityY;
    
    // Применение гравитации с учетом множителя скорости
    this.player.velocityY += this.player.gravity * this.speedMultiplier;
    
    // Проверка границ по горизонтали (переход через края экрана)
    if (this.player.x + this.player.width < 0) {
      this.player.x = this.width;
    } else if (this.player.x > this.width) {
      this.player.x = -this.player.width;
    }
    
    // Обновляем и проверяем столкновения с каплями дождя
    if (this.difficultySystem.raindrops.enabled) {
      this.updateRaindrops(deltaTime);
    }
    
    // ИЗМЕНЕНИЕ: Улучшенная логика проигрыша - используем таймер падения
    // Если игрок падает слишком быстро и долго, считаем что он упал
    if (this.player.velocityY > 5 * this.scaleFactor) { // Уменьшено с 10 в 2 раза
      if (!this.isFalling) {
        this.isFalling = true;
        this.fallTimer = 0;
      } else {
        this.fallTimer += deltaTime;
        
        // Проигрыш наступает только при выпадении за нижний край экрана
        // Изменено условие: персонаж ушел под экран на 100%
        if (this.player.y > this.height + this.player.height) {
          this.gameOver();
          return;
        }
      }
    } else {
      this.isFalling = false;
      this.fallTimer = 0;
    }
    
    // Сброс флага grounded
    this.player.grounded = false;
    
    // Обновление платформ и проверка коллизий
    this.updatePlatforms(deltaTime);
    
    // Обновление камеры (следует за игроком) с адаптивной скоростью
    // УЛУЧШЕННАЯ ЛОГИКА СЛЕДОВАНИЯ КАМЕРЫ
    // Определяем верхнюю и нижнюю границы для игрока на экране
    const upperBound = this.height * 0.25; // Верхняя граница (25% от высоты экрана)
    const lowerBound = this.height * 0.75; // Нижняя граница (75% от высоты экрана)
    
    // Если игрок выше верхней границы, двигаем камеру вверх
    if (this.player.y < upperBound) {
      // Адаптивная скорость камеры в зависимости от скорости игрока
      let cameraSpeed = this.camera.speed;
      
      // Вычисляем, насколько игрок вышел за границу
      const overBound = upperBound - this.player.y;
      
      // Если включена адаптивная скорость и игрок быстро движется вверх
      if (this.camera.adaptiveSpeed && this.player.velocityY < -5 * this.scaleFactor) { 
        // Увеличиваем скорость камеры в зависимости от скорости игрока
        cameraSpeed = Math.min(
          Math.abs(this.player.velocityY) * 1.2, // Увеличиваем коэффициент с 1.0 до 1.2 для лучшего следования
          this.camera.speed * 4.0 // Увеличиваем максимальный множитель с 3.5 до 4.0
        );
      }
      
      // Добавляем дополнительное ускорение, если игрок сильно вышел за границу
      if (overBound > this.player.height) {
        cameraSpeed *= 1.5; // Увеличиваем скорость на 50%, если игрок вышел далеко за границу
      }
      
      // Перемещаем камеру и игрока
      this.camera.y -= cameraSpeed;
      this.player.y += cameraSpeed;
    }
    
    // Если игрок ниже нижней границы и не падает (чтобы не мешать логике проигрыша)
    else if (this.player.y > lowerBound && !this.isFalling) {
      // Вычисляем, насколько игрок вышел за нижнюю границу
      const overBound = this.player.y - lowerBound;
      
      // Базовая скорость движения камеры вниз
      let cameraSpeed = this.camera.speed * 0.8;
      
      // Увеличиваем скорость, если игрок сильно вышел за границу
      if (overBound > this.player.height) {
        cameraSpeed *= 1.5;
      }
      
      // Перемещаем камеру и игрока
      this.camera.y += cameraSpeed;
      this.player.y -= cameraSpeed;
    }
  }
  
  // Метод для обновления и отрисовки капель дождя
  updateRaindrops(deltaTime) {
    const drops = this.difficultySystem.raindrops.drops;
    
    // Создаем новые капли, если их стало меньше, чем нужно
    const actualDropCount = Math.floor(this.difficultySystem.raindrops.count / 2);
    if (drops.length < actualDropCount) {
      this.createRaindrop();
    }
    
    // Обрабатываем каждую каплю
    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];
      
      // Если капля ушла далеко за пределы экрана вверх или вниз, пересоздаем её
      const relativeY = drop.y - this.camera.y;
      if (relativeY < -50 || relativeY > this.height + 50) {
        // Удаляем каплю и создаем новую
        drops.splice(i, 1);
        this.createRaindrop();
        continue;
      }
      
      // Проверяем столкновение с игроком
      if (
        drop.x + drop.size > this.player.x &&
        drop.x - drop.size < this.player.x + this.player.width &&
        relativeY + drop.size > this.player.y &&
        relativeY - drop.size < this.player.y + this.player.height
      ) {
        // При столкновении с каплей игрок проигрывает
        this.gameOver();
        return;
      }
    }
  }
  
  updatePlatforms(deltaTime) {
    const maxPlatforms = 60;  // Уменьшаем максимальное количество платформ
    const stepY = 180; // Увеличиваем шаг между уровнями по Y
    
    // Определяем верхнюю видимую границу для отслеживания
    const topVisibleY = this.camera.y - this.height;
    // Самая высокая платформа в игре
    let highestPlatformY = Number.POSITIVE_INFINITY;
    
    // Счетчики платформ
    let totalPlatforms = this.platforms.length;
    
    // Находим самую высокую платформу
    this.platforms.forEach(platform => {
      if (platform.y < highestPlatformY) {
        highestPlatformY = platform.y;
      }
    });
    
    // Если нет платформ или все они ниже экрана, создаем новые
    if (highestPlatformY === Number.POSITIVE_INFINITY || highestPlatformY > topVisibleY) {
      highestPlatformY = topVisibleY;
    }
    
    // Проверяем каждую платформу
    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const platform = this.platforms[i];
      
      // Смещение относительно камеры
      const relativeY = platform.y - this.camera.y;
      
      // Удаляем платформы, которые ушли далеко за пределы экрана вниз
      if (relativeY > this.height + 200) {
        // Удаляем текущую платформу
        this.platforms.splice(i, 1);
        totalPlatforms--;
        continue;
      }
      
      // Обновляем движущиеся платформы
      if (platform.type === this.platformTypes.MOVING) {
        // Скорость движения зависит от уровня и множителя сложности
        const levelSpeedMultiplier = Math.min(1 + (this.level - 1) * 0.2, 2.5);
        platform.x += platform.direction * platform.speed * levelSpeedMultiplier;
        
        // Изменяем направление, когда достигаем края
        if (platform.x <= 0 || platform.x + platform.width >= this.width) {
          platform.direction *= -1;
        }
      }
      
      // Обновляем раскачивающиеся платформы
      if (platform.swinging) {
        platform.swingTime += deltaTime;
        // Вычисляем новое смещение на основе синусоидального движения
        const amplitude = this.difficultySystem.swingingPlatforms.amplitude;
        const frequency = this.difficultySystem.swingingPlatforms.frequency;
        platform.swingOffset = Math.sin(platform.swingTime * frequency) * amplitude;
      }
      
      // Проверка колллизий игрока с платформой
      this.checkPlatformCollision(platform, relativeY, i);
    }
    
    // Добавлена отладочная информация для мониторинга генерации платформ
    if (this.score % 100 === 0) {
      console.log('Current camera position:', this.camera.y);
      console.log('Highest platform:', highestPlatformY);
      console.log('Platforms count:', totalPlatforms);
    }
    
    // Важно: создаем новые уровни платформ выше самой высокой текущей платформы
    // Проверяем, что между самой высокой платформой и верхним краем экрана не слишком большое расстояние
    const minPlatformsAbove = 8; // Увеличено с 5 до 8
    
    // Количество уровней, которые нужно создать
    let levelsToCreate = minPlatformsAbove;
    
    // Если самая высокая платформа уже есть, проверяем расстояние
    if (highestPlatformY < Number.POSITIVE_INFINITY) {
      // Сколько полных шагов по Y между верхней границей экрана и самой высокой платформой
      const stepsToHighest = Math.floor((topVisibleY - highestPlatformY) / stepY);
      
      // Если платформ недостаточно, добавляем необходимое количество уровней
      if (stepsToHighest < minPlatformsAbove) {
        levelsToCreate = minPlatformsAbove - stepsToHighest;
      }
    }
    
    // Создаем новые уровни платформ
    for (let level = 1; level <= levelsToCreate; level++) {
      const levelY = highestPlatformY - (level * stepY);
      
      // Проверяем, нет ли уже платформ на этом уровне (с небольшим допуском)
      const platformsAtThisLevel = this.platforms.filter(p => 
        Math.abs(p.y - levelY) < stepY / 3
      ).length;
      
      // Если на этом уровне нет платформ, создаем случайное количество (2-3)
      if (platformsAtThisLevel === 0) {
        const platformsToCreate = Math.floor(Math.random() * 2) + 2; // Увеличено до 2-3 платформ
        for (let i = 0; i < platformsToCreate; i++) {
          this.createTopPlatform(levelY);
          totalPlatforms++;
        }
      }
    }
    
    // Если общее количество платформ превышает максимум, удаляем самые нижние
    if (totalPlatforms > maxPlatforms) {
      // Сортируем платформы по Y (от больших значений к меньшим - снизу вверх)
      this.platforms.sort((a, b) => b.y - a.y);
      
      // Удаляем лишние платформы снизу
      const excessPlatforms = totalPlatforms - maxPlatforms;
      this.platforms.splice(maxPlatforms, excessPlatforms);
    }
  }
  
  updateDifficulty() {
    // Определяем новый уровень на основе очков и рангов
    let newLevel = 1;
    
    if (this.score >= this.ranks.LEGEND.score) {
      newLevel = 8;
    } else if (this.score >= this.ranks.BOT.score) {
      newLevel = 7;
    } else if (this.score >= this.ranks.MONSTER.score) {
      newLevel = 6;
    } else if (this.score >= this.ranks.LOOSTY.score) {
      newLevel = 5;
    } else if (this.score >= this.ranks.PARASOL.score) {
      newLevel = 4;
    } else if (this.score >= this.ranks.ARCIAN.score) {
      newLevel = 3;
    } else if (this.score >= this.ranks.GMPC.score) {
      newLevel = 2;
    } else if (this.score >= this.ranks.APPROVE.score) {
      newLevel = 1;
    }
    
    if (newLevel > this.level) {
      this.level = newLevel;
      
      // Отправляем событие о смене уровня с названием ранга
      let rankTitle = this.currentRank;
      this.sendUIEvent('levelChange', { level: rankTitle });
      
      console.log(`Level ${this.level} reached! (${rankTitle})`);
    }
  }
  
  updateScore(points) {
    // Обновляем счет на указанное количество очков
    this.score += points || 0;
    
    // Обновляем звание игрока
    this.updateRank();
    
    if (this.scoreElement) {
      this.scoreElement.textContent = '';
    }
    
    // Обновляем сложность при изменении счета
    this.updateDifficulty();
  }
  
  // Новый метод для обновления звания игрока
  updateRank() {
    let newRank = '';
    
    if (this.score >= this.ranks.LEGEND.score) {
      newRank = this.ranks.LEGEND.title;
    } else if (this.score >= this.ranks.BOT.score) {
      newRank = this.ranks.BOT.title;
    } else if (this.score >= this.ranks.MONSTER.score) {
      newRank = this.ranks.MONSTER.title;
    } else if (this.score >= this.ranks.LOOSTY.score) {
      newRank = this.ranks.LOOSTY.title;
    } else if (this.score >= this.ranks.PARASOL.score) {
      newRank = this.ranks.PARASOL.title;
    } else if (this.score >= this.ranks.ARCIAN.score) {
      newRank = this.ranks.ARCIAN.title;
    } else if (this.score >= this.ranks.GMPC.score) {
      newRank = this.ranks.GMPC.title;
    } else if (this.score >= this.ranks.APPROVE.score) {
      newRank = this.ranks.APPROVE.title;
    } else {
      newRank = "Sybil";
    }
    
    // Если звание изменилось, отправляем событие и показываем уведомление
    if (newRank !== this.currentRank) {
      this.currentRank = newRank;
      
      // Применяем усложнение соответствующее новому рангу
      this.applyDifficultyByRank(newRank);
      
      // Отправляем событие о смене ранга
      const event = new CustomEvent('rankChange', {
        detail: { rank: this.currentRank }
      });
      document.dispatchEvent(event);
      
      // Создаем и показываем красивое уведомление
      this.showRankNotification(this.currentRank);
      
      console.log(`New rank achieved: ${this.currentRank}! (Score: ${this.score})`);
    }
  }
  
  // Новый метод для применения усложнений в зависимости от ранга
  applyDifficultyByRank(rank) {
    // Запоминаем последний примененный ранг
    this.difficultySystem.lastAppliedRank = rank;
    
    // Базовые настройки для всех рангов
    let message = "";
    
    switch(rank) {
      case this.ranks.APPROVE.title:
        // Увеличиваем процент ломающихся платформ
        this.difficultySystem.brokenPlatformChance = 0.15; // 15%
        message = "Caution! More breaking umbrellas!";
        break;
        
      case this.ranks.GMPC.title:
        // Добавляем ветер, который смещает игрока
        this.difficultySystem.wind.enabled = true;
        this.difficultySystem.wind.strength = 0.24 * this.scaleFactor; // Увеличено на 20% (было 0.2)
        message = "Wind is blowing! Hold tight!";
        break;
        
      case this.ranks.ARCIAN.title:
        // Уменьшаем размер зонтиков на 30%
        this.difficultySystem.umbrellaSizeReduction = 0.3;
        this.umbrellaWidthRatio = 2.5 / (1 - this.difficultySystem.umbrellaSizeReduction);
        message = "Umbrellas are shrinking! Jump precisely!";
        break;
        
      case this.ranks.PARASOL.title:
        // Добавляем капли дождя, которые нужно избегать
        this.difficultySystem.raindrops.enabled = true;
        this.difficultySystem.raindrops.count = 5;
        this.initRaindrops(); // Инициализируем капли дождя
        message = "It's raining! Avoid the drops!";
        break;
        
      case this.ranks.LOOSTY.title:
        // Увеличиваем скорость движущихся платформ и процент временных платформ
        this.difficultySystem.movingPlatformSpeedMultiplier = 1.5;
        this.difficultySystem.temporaryPlatformChance = 0.2; // 20%
        // Увеличиваем количество капель дождя
        this.difficultySystem.raindrops.count = 10;
        message = "Platforms are faster and less stable!";
        break;
        
      case this.ranks.MONSTER.title:
        // Добавляем раскачивающиеся платформы
        this.difficultySystem.swingingPlatforms.enabled = true;
        this.difficultySystem.swingingPlatforms.amplitude = 20 * this.scaleFactor;
        // Усиливаем ветер
        this.difficultySystem.wind.strength = 0.48 * this.scaleFactor; // Увеличено на 20% (было 0.4)
        message = "Umbrellas are swinging!";
        break;
        
      case this.ranks.BOT.title:
        // Добавляем скользкие ледяные платформы
        this.difficultySystem.slipperyPlatforms.enabled = true;
        this.difficultySystem.slipperyPlatforms.slipFactor = 0.95;
        // Увеличиваем количество капель дождя еще больше
        this.difficultySystem.raindrops.count = 15;
        message = "Watch out, it's slippery! Ice on umbrellas!";
        break;
        
      case this.ranks.LEGEND.title:
        // Максимальная сложность - всё становится еще сложнее
        this.difficultySystem.brokenPlatformChance = 0.25; // 25%
        this.difficultySystem.temporaryPlatformChance = 0.3; // 30%
        this.difficultySystem.movingPlatformSpeedMultiplier = 2.0;
        this.difficultySystem.wind.strength = 0.72 * this.scaleFactor; // Увеличено на 20% (было 0.6)
        this.difficultySystem.raindrops.count = 20;
        this.difficultySystem.swingingPlatforms.amplitude = 30 * this.scaleFactor;
        message = "LEGENDARY difficulty! Good luck!";
        break;
    }
    
    // Показываем сообщение о новом усложнении
    if (message) {
      this.showDifficultyMessage(message);
    }
  }
  
  // Метод для инициализации капель дождя
  initRaindrops() {
    this.difficultySystem.raindrops.drops = [];
    
    // Уменьшаем количество капель в 2 раза
    const actualDropCount = Math.floor(this.difficultySystem.raindrops.count / 2);
    
    for (let i = 0; i < actualDropCount; i++) {
      this.createRaindrop();
    }
  }
  
  // Метод для создания капли дождя (статичной)
  createRaindrop() {
    const drop = {
      x: Math.random() * this.width,
      y: this.camera.y - Math.random() * 50, // Генерируем только сверху экрана
      size: (Math.random() * 3 + 5) * this.scaleFactor, // Делаем капли крупнее
      // Убираем speed, так как капли теперь статичные
    };
    
    this.difficultySystem.raindrops.drops.push(drop);
  }
  
  // Метод для отображения сообщения об усложнении
  showDifficultyMessage(message) {
    // Если это сообщение про ломающиеся платформы, просто игнорируем
    if (message.includes("breaking umbrellas")) {
      return;
    }
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'difficulty-notification';
    
    // Добавляем содержимое
    notification.innerHTML = `
      <div class="difficulty-notification-inner">
        <div class="difficulty-notification-icon">⚠️</div>
        <div class="difficulty-notification-text">
          <h3>Difficulty Increased!</h3>
          <p>${message}</p>
        </div>
      </div>
    `;
    
    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
      .difficulty-notification {
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(220, 53, 69, 0.9);
        border: 3px solid #ff4757;
        border-radius: 10px;
        padding: 15px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.5s ease-out, fadeOut 0.5s ease-in 2.5s forwards;
        box-shadow: 0 0 20px rgba(220, 53, 69, 0.7);
      }
      
      .difficulty-notification-inner {
        display: flex;
        align-items: center;
      }
      
      .difficulty-notification-icon {
        font-size: 36px;
        margin-right: 15px;
      }
      
      .difficulty-notification-text h3 {
        margin: 0 0 5px 0;
        font-size: 18px;
        color: #ffc107;
      }
      
      .difficulty-notification-text p {
        margin: 0;
        font-size: 18px;
        font-weight: bold;
      }
      
      @keyframes slideIn {
        from { transform: translate(-50%, -100px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    
    // Добавляем элементы на страницу
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды (сокращено с 5 до 3)
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
  }
  
  // Метод для отображения красивого уведомления о достижении нового ранга
  showRankNotification(rankTitle) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'rank-notification';
    
    // Добавляем содержимое
    notification.innerHTML = `
      <div class="rank-notification-inner">
        <div class="rank-notification-icon">🏆</div>
        <div class="rank-notification-text">
          <h3>New Rank Achieved!</h3>
          <p>${rankTitle}</p>
        </div>
      </div>
    `;
    
    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
      .rank-notification {
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(74, 43, 122, 0.9);
        border: 3px solid #8a2be2;
        border-radius: 10px;
        padding: 15px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.5s ease-out, fadeOut 0.5s ease-in 3.5s forwards;
        box-shadow: 0 0 20px rgba(138, 43, 226, 0.7);
      }
      
      .rank-notification-inner {
        display: flex;
        align-items: center;
      }
      
      .rank-notification-icon {
        font-size: 36px;
        margin-right: 15px;
      }
      
      .rank-notification-text h3 {
        margin: 0 0 5px 0;
        font-size: 18px;
        color: #ffc107;
      }
      
      .rank-notification-text p {
        margin: 0;
        font-size: 24px;
        font-weight: bold;
      }
      
      @keyframes slideIn {
        from { transform: translate(-50%, -100px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    
    // Добавляем элементы на страницу
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 4 секунды
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 4000);
  }
  
  // Отрисовка зонтика
  drawUmbrella(platform, relativeY, drawX = platform.x) {
    const ctx = this.ctx;
    const x = drawX;
    const y = relativeY;
    const width = platform.width;
    const height = platform.height;
    const umbrellaSize = width / this.umbrellaWidthRatio; // Используем измененное соотношение
    
    // Определяем цвет в зависимости от типа платформы
    let color;
    switch (platform.type) {
      case this.platformTypes.NORMAL:
        color = this.colors.normalPlatform;
        break;
      case this.platformTypes.BROKEN:
        color = this.colors.brokenPlatform;
        break;
      case this.platformTypes.TEMPORARY:
        color = platform.disappearing ? 
                'rgba(255, 165, 2, 0.6)' : // Фиксированная прозрачность вместо случайной
                this.colors.temporaryPlatform;
        break;
      case this.platformTypes.MOVING:
        color = this.colors.movingPlatform;
        break;
    }
    
    // Если платформа скользкая, добавляем голубой оттенок (лед)
    if (platform.slippery) {
      // Делаем цвет более голубым для эффекта льда
      color = 'rgba(100, 200, 255, 0.9)';
    }
    
    // Центр зонтика
    const centerX = x + width / 2;
    const handleHeight = 20 * this.scaleFactor;
    
    // Визуальная отладка границ зонтика
    // Рисуем контур для лучшей видимости платформы
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2 * this.scaleFactor;
    ctx.beginPath();
    ctx.arc(
      centerX,
      y,
      umbrellaSize,
      0,
      Math.PI,
      true
    );
    ctx.stroke();
    
    // Рисуем ручку зонтика
    ctx.fillStyle = this.colors.umbrellaHandle;
    ctx.fillRect(
      centerX - 2 * this.scaleFactor,
      y + height, 
      4 * this.scaleFactor,
      handleHeight
    );
    
    // Рисуем верхнюю часть зонтика (полукруг)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      centerX,
      y,
      umbrellaSize,
      0,
      Math.PI,
      true
    );
    ctx.fill();
    
    // Рисуем спицы зонтика
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1 * this.scaleFactor;
    
    // Центральная спица
    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(centerX, y - umbrellaSize);
    ctx.stroke();
    
    // Боковые спицы
    for (let i = 1; i <= 3; i++) {
      // Левая спица
      ctx.beginPath();
      ctx.moveTo(centerX, y);
      ctx.lineTo(centerX - umbrellaSize * Math.sin(Math.PI * i / 8), 
                 y - umbrellaSize * Math.cos(Math.PI * i / 8));
      ctx.stroke();
      
      // Правая спица
      ctx.beginPath();
      ctx.moveTo(centerX, y);
      ctx.lineTo(centerX + umbrellaSize * Math.sin(Math.PI * i / 8), 
                 y - umbrellaSize * Math.cos(Math.PI * i / 8));
      ctx.stroke();
    }
    
    // Если платформа скользкая, добавляем эффект льда
    if (platform.slippery) {
      // Добавляем блики на льду
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(
        centerX - umbrellaSize * 0.3,
        y - umbrellaSize * 0.2,
        umbrellaSize * 0.15,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(
        centerX + umbrellaSize * 0.4,
        y - umbrellaSize * 0.4,
        umbrellaSize * 0.1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    // Для сломанных зонтиков добавляем более заметные "трещины"
    if (platform.type === this.platformTypes.BROKEN) {
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2 * this.scaleFactor;
      
      // Зигзагообразная трещина через весь зонт
      ctx.beginPath();
      ctx.moveTo(centerX - umbrellaSize * 0.8, y - umbrellaSize * 0.2);
      ctx.lineTo(centerX - umbrellaSize * 0.4, y - umbrellaSize * 0.5);
      ctx.lineTo(centerX, y - umbrellaSize * 0.3);
      ctx.lineTo(centerX + umbrellaSize * 0.4, y - umbrellaSize * 0.6);
      ctx.lineTo(centerX + umbrellaSize * 0.8, y - umbrellaSize * 0.1);
      ctx.stroke();
      
      // Добавляем надлом на краю
      ctx.beginPath();
      ctx.moveTo(centerX - umbrellaSize * 0.6, y - umbrellaSize * 0.4);
      ctx.lineTo(centerX - umbrellaSize * 0.7, y - umbrellaSize * 0.1);
      ctx.stroke();
      
      // Добавляем узор разбитого зонтика
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(centerX - umbrellaSize * 0.7, y - umbrellaSize * 0.5, umbrellaSize * 0.3, umbrellaSize * 0.3);
    }
    
    // Для временных зонтиков добавляем статический эффект (вместо мигающего)
    if (platform.type === this.platformTypes.TEMPORARY && platform.disappearing) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Фиксированная прозрачность вместо случайной
      ctx.beginPath();
      ctx.arc(
        centerX,
        y,
        umbrellaSize * 0.7,
        0,
        Math.PI,
        true
      );
      ctx.fill();
    }
    
    // Для движущихся зонтиков добавляем индикатор направления
    if (platform.type === this.platformTypes.MOVING) {
      const arrowSize = 4 * this.scaleFactor;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      
      ctx.beginPath();
      if (platform.direction > 0) {
        // Стрелка вправо
        ctx.moveTo(centerX + arrowSize * 2, y - umbrellaSize * 0.5);
        ctx.lineTo(centerX + arrowSize, y - umbrellaSize * 0.5 - arrowSize);
        ctx.lineTo(centerX + arrowSize, y - umbrellaSize * 0.5 + arrowSize);
      } else {
        // Стрелка влево
        ctx.moveTo(centerX - arrowSize * 2, y - umbrellaSize * 0.5);
        ctx.lineTo(centerX - arrowSize, y - umbrellaSize * 0.5 - arrowSize);
        ctx.lineTo(centerX - arrowSize, y - umbrellaSize * 0.5 + arrowSize);
      }
      ctx.fill();
    }
    
    // Определяем ранг в зависимости от высоты платформы
    let rankLabel = this.currentRank;
    
    // Для отладки - отображаем высоту на некоторых платформах
    if (platform.y % 1000 === 0) {
      console.log(`Umbrella at height ${platform.y} displays current player rank: ${rankLabel}`);
    }
    
    // Улучшенная отрисовка текста с тенями для лучшей видимости
    // Увеличиваем размер шрифта и добавляем несколько слоев теней
    const fontSize = 16 * this.scaleFactor; // Возвращаем размер 16
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Центрируем текст по вертикали
    
    // Рисуем несколько слоев теней для лучшей видимости
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillText(rankLabel, centerX + 2, y - umbrellaSize/2 + 2); // Тень справа-снизу
    ctx.fillText(rankLabel, centerX - 2, y - umbrellaSize/2 + 2); // Тень слева-снизу
    ctx.fillText(rankLabel, centerX + 2, y - umbrellaSize/2 - 2); // Тень справа-сверху
    ctx.fillText(rankLabel, centerX - 2, y - umbrellaSize/2 - 2); // Тень слева-сверху
    
    // Рисуем основной текст
    ctx.fillStyle = 'white';
    ctx.fillText(rankLabel, centerX, y - umbrellaSize/2);
  }
  
  draw() {
    // Проверяем, что контекст и холст существуют
    if (!this.ctx || !this.canvas) return;
    
    // Очистка холста
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Рисование платформ в виде зонтиков
    this.platforms.forEach(platform => {
      const relativeY = platform.y - this.camera.y;
      
      // Учитываем смещение для раскачивающихся платформ
      let drawX = platform.x;
      if (platform.swinging && platform.swingOffset !== undefined) {
        drawX += platform.swingOffset;
      }
      
      // Рисуем зонтик с учетом визуальных эффектов
      this.drawUmbrella(platform, relativeY, drawX);
    });
    
    // Рисуем капли дождя, если они включены
    if (this.difficultySystem.raindrops.enabled) {
      this.drawRaindrops();
    }
    
    // Рисование игрока (только изображение эмблемы проекта)
    if (this.playerImage && this.playerImage.complete) {
      // Если изображение загружено - используем его без круглого фона
      this.ctx.drawImage(
        this.playerImage,
        this.player.x,
        this.player.y,
        this.player.width,
        this.player.height
      );
    }
    
    // Отображение информации о текущем звании и уровне - отображаем в абсолютных координатах
    this.drawUI();
  }
  
  // Метод для отрисовки капель дождя
  drawRaindrops() {
    const drops = this.difficultySystem.raindrops.drops;
    
    this.ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    
    for (const drop of drops) {
      const relativeY = drop.y - this.camera.y;
      
      // Рисуем вытянутую каплю
      this.ctx.beginPath();
      this.ctx.ellipse(
        drop.x, 
        relativeY, 
        drop.size, 
        drop.size * 2.5, 
        0, 
        0, 
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Добавляем блик на капле
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.beginPath();
      this.ctx.ellipse(
        drop.x - drop.size * 0.3, 
        relativeY - drop.size * 0.3, 
        drop.size * 0.3, 
        drop.size * 0.6, 
        0, 
        0, 
        Math.PI * 2
      );
      this.ctx.fill();
      
      this.ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    }
  }
  
  // Новый метод для отрисовки UI элементов в абсолютных координатах
  drawUI() {
    // Сохраняем текущее состояние контекста
    this.ctx.save();
    
    // Сбрасываем любые трансформации, чтобы UI был статичным
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Отображаем только счет (без слова "SCORE")
    this.ctx.fillStyle = 'white';
    this.ctx.font = `bold ${14 * this.scaleFactor}px Arial`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this.score}`, 20, 30);
    
    // Восстанавливаем состояние контекста
    this.ctx.restore();
    
    // Очищаем текстовое содержимое элемента счета, чтобы избежать дублирования
    if (this.scoreElement) {
      this.scoreElement.textContent = '';
    }
  }
  
  // Отправляем события для React компонента через специальный метод
  sendUIEvent(eventName, data) {
    // Создаем событие с данными, но не включаем в него позицию камеры
    // или другие переменные, которые могут вызывать движение UI
    const event = new CustomEvent(eventName, {
      detail: { ...data, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  }
  
  gameOver() {
    this.isGameOver = true;
    
    // Отображаем окно Game Over (это делается в React компоненте)
    this.sendUIEvent('gameOver', { 
      score: this.score, 
      level: this.level,
      rank: this.currentRank
    });
    
    // Останавливаем игровой цикл
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Обработчики клавиш
  handleKeyDown(e) {
    // Если игра завершена, игнорируем клавиши
    if (this.isGameOver) {
      return;
    }
    
    // Обработка по коду клавиши (работает независимо от раскладки)
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = true;
        break;
      case 'KeyP':
      case 'Escape':
        console.log("ESC or P key pressed for pause");
        
        // Используем togglePause напрямую
        this.togglePause();
        break;
    }
  }
  
  handleKeyUp(e) {
    // Обработка по коду клавиши (работает независимо от раскладки)
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = false;
        break;
    }
  }
  
  // Простой метод переключения паузы через менеджер паузы
  togglePause() {
    this.pauseManager.toggle();
  }
  
  // Метод установки паузы через менеджер паузы
  pauseGame() {
    this.pauseManager.pause();
  }
  
  // Метод снятия с паузы через менеджер паузы
  resumeGame() {
    this.pauseManager.resume();
  }
  
  // Запуск игры с проверкой паузы
  startGame() {
    console.log('startGame called, current state:', {
      isGameOver: this.isGameOver,
      isPaused: this.isPaused,
      animationFrameId: this.animationFrameId
    });
    
    // Если игра была на паузе, снимаем с паузы через менеджер
    if (this.isPaused) {
      this.pauseManager.resume();
      this.sendUIEvent('gameStarted', { gameStarted: true });
      return;
    }
    
    // Полный запуск игры
    this.isGameOver = false;
    this.isPaused = false;
    this.reset(); // Сбрасываем все игровые параметры
    
    // Добавляем начальный импульс прыжка
    this.player.velocityY = -18;
    
    console.log('Initial player position:', this.player.x, this.player.y);
    
    // Отменяем предыдущий анимационный фрейм, если он существует
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Запускаем игровой цикл
    this.lastTime = performance.now();
    const boundGameLoop = this.gameLoop.bind(this);
    this.animationFrameId = requestAnimationFrame(boundGameLoop);
    console.log('Started new game loop');
    
    // Отправляем событие о начале игры
    this.sendUIEvent('gameStarted', { gameStarted: true });
  }
  
  resetGame() {
    this.reset();
  }
  
  reset() {
    // Сброс игровых переменных
    this.score = 0;
    this.level = 1;
    this.currentRank = "Sybil"; // Начинаем с базового ранга
    this.isGameOver = false;
    this.isPaused = false;
    this.camera.y = 0;
    this.isFalling = false;
    this.fallTimer = 0;
    this.lastPlatformId = null; // Сбрасываем ID последней платформы
    this.lastPlatformY = undefined; // Сбрасываем высоту последней платформы
    this.speedMultiplier = 1.0; // Сбрасываем множитель скорости
    
    // Сбрасываем параметры системы усложнений
    this.difficultySystem = {
      brokenPlatformChance: 0.05,
      wind: {
        enabled: false,
        strength: 0,
        direction: 1,
        changeTimer: 0,
        changeInterval: 3000
      },
      umbrellaSizeReduction: 0,
      raindrops: {
        enabled: false,
        count: 0,
        drops: []
      },
      movingPlatformSpeedMultiplier: 1.0,
      temporaryPlatformChance: 0.05,
      swingingPlatforms: {
        enabled: false,
        amplitude: 0,
        frequency: 0.02
      },
      slipperyPlatforms: {
        enabled: false,
        slipFactor: 0
      },
      lastAppliedRank: null
    };
    
    // Возвращаем исходное соотношение размера зонтика
    this.umbrellaWidthRatio = 2.5;
    
    // Пересчитываем масштабы
    this.scaleFactor = Math.min(
      this.width / this.baseWidth,
      this.height / this.baseHeight
    );
    
    // Сбрасываем параметры с учетом масштаба
    this.camera.speed = 2.5 * this.scaleFactor; // Увеличено с 2.0 до 2.5
    this.player.width = 60 * this.scaleFactor; // Оставляем как есть
    this.player.height = 60 * this.scaleFactor; // Оставляем как есть
    this.player.jumpForce = -18 * this.scaleFactor; // Уменьшаем с -24 до -18 (увеличено с -12)
    this.player.gravity = 0.3 * this.scaleFactor; // Увеличено с 0.25 до 0.3
    this.player.speed = 7 * this.scaleFactor; // Оставляем как есть
    this.platformHeight = 15 * this.scaleFactor;
    this.platformGapY = 225 * this.scaleFactor; // Увеличиваем расстояние между платформами в 1.5 раза
    
    // Сброс игрока - позиционируем его дальше от начальных платформ
    this.player.x = this.width / 2 - this.player.width / 2;
    this.player.y = this.height / 2 - this.player.height * 3; // Поднимаем игрока выше
    this.player.velocityY = -5; // Уменьшаем с -7 до -5 (увеличено с -3.5)
    this.player.velocityX = 0;
    this.player.jumping = true; // Игрок начинает в прыжке
    this.player.grounded = false;
    
    console.log('reset() method completed, player position:', this.player.x, this.player.y);
    
    // Сброс управления
    this.keys.left = false;
    this.keys.right = false;
    
    // Пересоздаем платформы с большим отрывом от игрока
    this.generatePlatforms();
    
    // Обновляем счет
    this.updateScore();
  }
  
  // Метод для очистки ресурсов при размонтировании компонента
  cleanup() {
    // Останавливаем игру перед очисткой ресурсов
    this.isGameOver = true;
    this.isPaused = true;
    
    // Отменяем дальнейшие анимационные фреймы
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Удаляем обработчики событий
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    // Очистка ссылок
    this.canvas = null;
    this.ctx = null;
    this.scoreElement = null;
  }

  // Новый метод для проверки коллизий игрока с платформой
  checkPlatformCollision(platform, relativeY, platformIndex) {
    // Координаты зонтика
    const umbrellaSize = platform.width / this.umbrellaWidthRatio;
    
    // Если это раскачивающаяся платформа, учитываем смещение
    let adjustedX = platform.x;
    if (platform.swinging && platform.swingOffset !== undefined) {
      adjustedX += platform.swingOffset;
    }
    
    // Центр зонтика с учетом возможного раскачивания
    const centerX = adjustedX + platform.width / 2;
    
    // Определяем координаты игрока
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerBottom = this.player.y + this.player.height;
    
    // Улучшенная проверка столкновения с верхней частью зонтика
    if (this.player.velocityY > 0) { // Только когда игрок падает
      // Расстояние по горизонтали от центра игрока до центра зонтика
      const distX = Math.abs(playerCenterX - centerX);
      
      // Более точная проверка для полукруга зонтика
      if (distX < umbrellaSize + this.player.width / 4 && // Увеличиваем зону коллизии
          playerBottom >= relativeY - 8 && // Слегка увеличиваем зону проверки по вертикали
          playerBottom <= relativeY + 8) { // для более удобного управления
          
        // Проверка, находится ли игрок в пределах полукруга зонтика
        // Используем уравнение полукруга: y = sqrt(r^2 - x^2)
        const yOffset = umbrellaSize * Math.sqrt(1 - Math.pow(distX / (umbrellaSize + this.player.width / 4), 2));
        
        if (playerBottom >= relativeY - yOffset - 8 && playerBottom <= relativeY + 8) {
          // Проверяем, не с той же ли платформы прыгаем снова
          const isNewPlatform = this.lastPlatformId !== platform.id;
          
          // Проверяем, прыгаем ли мы вверх (на платформу с меньшим Y)
          const isJumpingUp = this.lastPlatformY === undefined || platform.y < this.lastPlatformY;
          
          // Если платформа скользкая, применяем скольжение
          if (platform.slippery) {
            // Уменьшаем ускорение при нажатии клавиш влево/вправо
            this.player.velocityX *= this.difficultySystem.slipperyPlatforms.slipFactor;
            
            // Добавляем небольшое дополнительное скольжение по инерции
            if (Math.abs(this.player.velocityX) < 0.1) {
              // Если игрок почти остановился, используем направление его движения
              const direction = this.keys.left ? -1 : (this.keys.right ? 1 : 0);
              this.player.velocityX += direction * 0.3 * this.scaleFactor;
            }
          }
          
          // Различные эффекты в зависимости от типа платформы
          switch (platform.type) {
            case this.platformTypes.NORMAL:
              // Обычное отскакивание
              this.player.velocityY = this.player.jumpForce;
              this.player.grounded = true;
              
              // Добавляем 35 очков, только если это новая платформа И прыжок вверх
              if (isNewPlatform && isJumpingUp) {
                this.updateScore(35);
                this.lastPlatformId = platform.id;
                this.lastPlatformY = platform.y;
                
                // Логируем для отладки
                console.log(`Jump from platform ${platform.id} at height ${platform.y}, earned 35 points`);
              }
              break;
              
            case this.platformTypes.BROKEN:
              // Платформа ломается при первом касании
              this.player.velocityY = this.player.jumpForce;
              this.player.grounded = true;
              this.platforms.splice(platformIndex, 1);
              
              // Добавляем 35 очков, только если это новая платформа И прыжок вверх
              if (isNewPlatform && isJumpingUp) {
                this.updateScore(35);
                this.lastPlatformId = null; // Сбрасываем ID, т.к. платформа удалена
                this.lastPlatformY = platform.y;
                
                // Логируем для отладки
                console.log(`Jump from broken platform at height ${platform.y}, earned 35 points`);
              }
              break;
              
            case this.platformTypes.TEMPORARY:
              // Платформа исчезает через некоторое время
              if (!platform.disappearing) {
                this.player.velocityY = this.player.jumpForce;
                this.player.grounded = true;
                platform.disappearing = true;
                
                // Добавляем 35 очков, только если это новая платформа И прыжок вверх
                if (isNewPlatform && isJumpingUp) {
                  this.updateScore(35);
                  this.lastPlatformId = platform.id;
                  this.lastPlatformY = platform.y;
                  
                  // Логируем для отладки
                  console.log(`Jump from temporary platform at height ${platform.y}, earned 35 points`);
                }
                
                // Исчезает через 500 мс
                setTimeout(() => {
                  const platformIndex = this.platforms.indexOf(platform);
                  if (platformIndex !== -1) {
                    this.platforms.splice(platformIndex, 1);
                    // Если это была последняя платформа, с которой прыгали, сбрасываем ID
                    if (this.lastPlatformId === platform.id) {
                      this.lastPlatformId = null;
                    }
                  }
                }, 500);
              }
              break;
              
            case this.platformTypes.MOVING:
              // Обычное отскакивание от движущейся платформы
              this.player.velocityY = this.player.jumpForce;
              this.player.grounded = true;
              
              // Добавляем 35 очков, только если это новая платформа И прыжок вверх
              if (isNewPlatform && isJumpingUp) {
                this.updateScore(35);
                this.lastPlatformId = platform.id;
                this.lastPlatformY = platform.y;
                
                // Логируем для отладки
                console.log(`Jump from moving platform at height ${platform.y}, earned 35 points`);
              }
              break;
          }
        }
      }
    }
  }
}

// Класс для управления паузой
class PauseManager {
  constructor(game) {
    this.game = game;
    this.savedState = null;
  }
  
  // Переключение паузы
  toggle() {
    if (this.game.isGameOver) return;
    
    if (this.game.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }
  
  // Установка паузы
  pause() {
    if (this.game.isGameOver) return;
    
    console.log("Игра поставлена на паузу через PauseManager");
    
    // Сохраняем текущее состояние игры
    this.savedState = {
      score: this.game.score,
      level: this.game.level,
      playerPos: { x: this.game.player.x, y: this.game.player.y },
      playerVel: { x: this.game.player.velocityX, y: this.game.player.velocityY },
      cameraY: this.game.camera.y,
      platforms: JSON.parse(JSON.stringify(this.game.platforms)),
      currentRank: this.game.currentRank
    };
    
    // Устанавливаем флаг паузы
    this.game.isPaused = true;
    
    // Отправляем событие в React-компонент
    this.game.sendUIEvent('gamePaused', { isPaused: true });
  }
  
  // Снятие с паузы
  resume() {
    if (this.game.isGameOver) return;
    
    console.log("Игра снята с паузы через PauseManager");
    
    // Восстанавливаем состояние, если оно было сохранено
    if (this.savedState) {
      this.game.score = this.savedState.score;
      this.game.level = this.savedState.level;
      this.game.player.x = this.savedState.playerPos.x;
      this.game.player.y = this.savedState.playerPos.y;
      this.game.player.velocityX = this.savedState.playerVel.x;
      this.game.player.velocityY = this.savedState.playerVel.y;
      this.game.camera.y = this.savedState.cameraY;
      this.game.platforms = this.savedState.platforms;
      this.game.currentRank = this.savedState.currentRank;
      
      // Очищаем сохраненное состояние
      this.savedState = null;
    }
    
    // Снимаем флаг паузы
    this.game.isPaused = false;
    
    // Сбрасываем время для плавности анимации
    this.game.lastTime = performance.now();
    
    // Отправляем событие в React-компонент
    this.game.sendUIEvent('gamePaused', { isPaused: false });
  }
  
  // Отрисовка экрана паузы
  drawPauseScreen() {
    const ctx = this.game.ctx;
    const width = this.game.width;
    const height = this.game.height;
    const scaleFactor = this.game.scaleFactor;
    
    // Полупрозрачный фон
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    // Текст "ПАУЗА"
    ctx.fillStyle = 'white';
    ctx.font = `bold ${30 * scaleFactor}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSE', width / 2, height / 2 - 40 * scaleFactor);
    
    // Текст инструкции
    ctx.font = `${16 * scaleFactor}px Arial`;
    ctx.fillText('Press ESC to continue', width / 2, height / 2 + 40 * scaleFactor);
    
    // Отображаем текущий счет
    ctx.fillText(`Score: ${this.game.score}`, width / 2, height / 2);
  }
}

export default Game; 