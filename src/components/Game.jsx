import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import GameImplementation from '../game'; // Импортируем нашу новую реализацию игры

// Компонент для отображения уведомлений о смене уровня
const LevelNotification = ({ level, show }) => {
  if (!show || !level) return null;
  
  return (
    <div className="level-notification" style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: '#ffcc00',
      padding: '15px 25px',
      borderRadius: '10px',
      fontSize: '24px',
      fontWeight: 'bold',
      textAlign: 'center',
      zIndex: 100,
      animation: 'fadeInOut 2s forwards',
      boxShadow: '0 0 20px rgba(255, 204, 0, 0.5)'
    }}>
      <div style={{ fontSize: '18px', marginBottom: '5px', color: '#ffffff' }}>New Rank</div>
      {level}
    </div>
  );
};

// Компонент вспышки экрана
const ScreenFlash = ({ show }) => {
  if (!show) return null;
  
  return (
    <div className="screen-flash" style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      opacity: 0.4,
      zIndex: 50,
      animation: 'fadeOut 0.5s forwards'
    }} />
  );
};

const Game = forwardRef(({ playerName, setPlayerName, onGameOver, onGameStart, onGamePause }, ref) => {
  // Рефы для доступа к DOM-элементам
  const canvasRef = useRef(null);
  const scoreRef = useRef(null);
  const gameRef = useRef(null);
  
  // Состояния для игры
  const [score, setScore] = useState(0);
  const [showLevelNotification, setShowLevelNotification] = useState(false);
  const [currentLevel, setCurrentLevel] = useState('');
  const [showFlash, setShowFlash] = useState(false);
  
  // Экспортируем методы из GameImplementation через ref для родительского компонента
  useImperativeHandle(ref, () => ({
    startGame: () => {
      console.log("Вызван startGame через ref");
      if (gameRef.current) {
        gameRef.current.startGame();
      }
    },
    resetGame: () => {
      console.log("Вызван resetGame через ref");
      if (gameRef.current) {
        gameRef.current.resetGame();
      }
    },
    togglePause: () => {
      console.log("Вызван togglePause через ref");
      if (gameRef.current) {
        gameRef.current.togglePause();
      }
    },
    pauseGame: () => {
      console.log("Вызван pauseGame через ref");
      if (gameRef.current) {
        gameRef.current.pauseGame();
      }
    },
    resumeGame: () => {
      console.log("Вызван resumeGame через ref");
      if (gameRef.current) {
        gameRef.current.resumeGame();
      }
    }
  }));
  
  // Эффект для инициализации игры
  useEffect(() => {
    // Создаем экземпляр игры когда компонент монтируется
    if (canvasRef.current && scoreRef.current) {
      // Создаем новый экземпляр игры
      gameRef.current = new GameImplementation(canvasRef.current, scoreRef.current);
    }
    
    // Обработчики событий
    const handleLevelChange = (e) => {
      setCurrentLevel(e.detail.level);
      setShowLevelNotification(true);
      setShowFlash(true);
      
      // Скрыть уведомление через 2 секунды
      setTimeout(() => {
        setShowLevelNotification(false);
      }, 2000);
      
      // Скрыть вспышку через 300 мс
      setTimeout(() => {
        setShowFlash(false);
      }, 300);
    };
    
    const handleGameOver = (e) => {
      if (onGameOver) {
        onGameOver(e.detail);
      }
    };
    
    const handleGamePaused = (e) => {
      if (onGamePause) {
        onGamePause(e.detail.isPaused);
      }
    };
    
    const handleGameStarted = (e) => {
      if (onGameStart) {
        onGameStart(e.detail.gameStarted);
      }
    };
    
    // Обработчик нажатия клавиши ESC - использует ту же логику, что и кнопка Resume
    const handleEscKeyPressed = (e) => {
      console.log("Обработка нажатия ESC:", e.detail);
      
      if (gameRef.current) {
        try {
          const isPaused = gameRef.current.isPaused;
          
          if (isPaused) {
            // Проверяем, существует ли метод resumeGame
            if (typeof gameRef.current.resumeGame === 'function') {
              gameRef.current.resumeGame();
            } else {
              // Запасной вариант - используем togglePause
              gameRef.current.togglePause();
            }
            
            // Уведомляем React-компонент
            if (onGamePause) {
              onGamePause(false);
            }
          } else {
            // Проверяем, существует ли метод pauseGame
            if (typeof gameRef.current.pauseGame === 'function') {
              gameRef.current.pauseGame();
            } else {
              // Запасной вариант - используем togglePause
              gameRef.current.togglePause();
            }
            
            // Уведомляем React-компонент
            if (onGamePause) {
              onGamePause(true);
            }
          }
        } catch (error) {
          console.error("Ошибка при обработке клавиши ESC:", error);
          
          // Запасной вариант - используем togglePause
          try {
            if (gameRef.current && typeof gameRef.current.togglePause === 'function') {
              gameRef.current.togglePause();
              
              // Уведомляем React-компонент
              if (onGamePause) {
                onGamePause(!gameRef.current.isPaused);
              }
            }
          } catch (err) {
            console.error("Критическая ошибка при обработке паузы:", err);
          }
        }
      }
    };
    
    // Обновление счета
    const updateScore = () => {
      if (scoreRef.current && gameRef.current) {
        setScore(parseInt(scoreRef.current.textContent || '0'));
      }
    };
    
    // Добавляем обработчики событий
    document.addEventListener('levelChange', handleLevelChange);
    document.addEventListener('gameOver', handleGameOver);
    document.addEventListener('gamePaused', handleGamePaused);
    document.addEventListener('gameStarted', handleGameStarted);
    document.addEventListener('escKeyPressed', handleEscKeyPressed);
    
    // Для обратной совместимости также слушаем старое событие
    document.addEventListener('categoryChange', (e) => {
      handleLevelChange({ detail: { level: e.detail.category } });
    });
    
    // Создаем интервал для обновления счета в состоянии React
    const scoreInterval = setInterval(updateScore, 100);
    
    // Настройка размера canvas при изменении размеров окна
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
        
        // Обновляем размеры в игре, если она существует
        if (gameRef.current) {
          // Обновляем базовые размеры
          if (gameRef.current.width !== canvasRef.current.width || 
              gameRef.current.height !== canvasRef.current.height) {
            
            gameRef.current.width = canvasRef.current.width;
            gameRef.current.height = canvasRef.current.height;
            
            // Пересчитываем масштаб
            gameRef.current.scaleFactor = Math.min(
              gameRef.current.width / gameRef.current.baseWidth,
              gameRef.current.height / gameRef.current.baseHeight
            );
            
            // Центрируем игрока
            if (!gameRef.current.isPaused && !gameRef.current.isGameOver) {
              gameRef.current.player.x = (gameRef.current.width - gameRef.current.player.width) / 2;
            }
          }
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Очистка при размонтировании
    return () => {
      document.removeEventListener('levelChange', handleLevelChange);
      document.removeEventListener('categoryChange', handleLevelChange);
      document.removeEventListener('gameOver', handleGameOver);
      document.removeEventListener('gamePaused', handleGamePaused);
      document.removeEventListener('gameStarted', handleGameStarted);
      document.removeEventListener('escKeyPressed', handleEscKeyPressed);
      window.removeEventListener('resize', handleResize);
      clearInterval(scoreInterval);
      
      // Очищаем игровой экземпляр
      if (gameRef.current) {
        gameRef.current.cleanup();
      }
    };
  }, [onGameOver, onGamePause, onGameStart]);
  
  return (
    <div className="game-wrapper" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <canvas 
        id="gameCanvas" 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div className="score" style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        padding: '5px 15px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '20px',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        zIndex: 5
      }}>
        <span id="scoreValue" ref={scoreRef}>{score}</span>
      </div>
      
      {/* Level notification */}
      <LevelNotification 
        level={currentLevel}
        show={showLevelNotification}
      />
      
      {/* Screen flash effect */}
      <ScreenFlash show={showFlash} />
      
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
        
        @keyframes fadeOut {
          0% { opacity: 0.4; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
});

Game.displayName = 'Game';

export default Game; 