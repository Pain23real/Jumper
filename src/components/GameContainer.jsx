import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Game from './Game';
import NameMenu from './NameMenu';
import StartButton from './StartButton';
import PauseMenu from './PauseMenu';
import GameOver from './GameOver';
import Leaderboard from './Leaderboard';
import { savePlayerScore } from '../utils/gameHelpers';
import notificationManager from '../utils/notificationSystem';

const GameContainer = () => {
  // Получаем данные о кошельке пользователя
  const { publicKey } = useWallet();
  const walletAddress = publicKey ? publicKey.toString() : null;

  // Состояние для управления игрой
  const [playerName, setPlayerName] = useState(() => {
    // Пробуем загрузить имя из localStorage для текущего кошелька
    if (walletAddress) {
      const walletNamesStr = localStorage.getItem('walletNames');
      const walletNames = walletNamesStr ? JSON.parse(walletNamesStr) : {};
      
      if (walletNames[walletAddress]) {
        return walletNames[walletAddress];
      }
    }
    
    // Если нет привязки к кошельку, пробуем получить общее имя
    return localStorage.getItem('playerName') || '';
  });
  
  const [showNameInput, setShowNameInput] = useState(!playerName);
  const [showStartButton, setShowStartButton] = useState(!!playerName);
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Обновляем имя при изменении кошелька и показываем уведомление
  useEffect(() => {
    // Проверяем, есть ли флаг показа диалога имени при загрузке страницы игры
    const showNameDialog = localStorage.getItem('showNameDialogOnGame');
    
    if (showNameDialog === 'true') {
      // Удаляем флаг, чтобы не показывать диалог повторно
      localStorage.removeItem('showNameDialogOnGame');
      
      // Показываем диалог ввода имени
      setShowNameInput(true);
      setShowStartButton(false);
      
      // Показываем уведомление о необходимости ввести ник Discord только если кошелек подключен
      if (walletAddress) {
        setTimeout(() => {
          notificationManager.createNotification(
            'Please enter your Discord nickname to start the game',
            {
              type: 'info',
              icon: '👤',
              duration: 8000
            }
          );
        }, 500);
      }
      
      return;
    }
    
    if (walletAddress) {
      const walletNamesStr = localStorage.getItem('walletNames');
      const walletNames = walletNamesStr ? JSON.parse(walletNamesStr) : {};
      
      if (walletNames[walletAddress]) {
        setPlayerName(walletNames[walletAddress]);
        setShowNameInput(false);
        setShowStartButton(true);
      } else {
        setShowNameInput(true);
        setShowStartButton(false);
        
        // Показываем уведомление о необходимости ввести ник Discord только для подключенного кошелька
        setTimeout(() => {
          notificationManager.createNotification(
            'Please enter your Discord nickname to start the game',
            {
              type: 'info',
              icon: '👤',
              duration: 8000
            }
          );
        }, 500);
      }
    }
  }, [walletAddress]);
  
  // Состояние результатов игры
  const [gameResult, setGameResult] = useState({
    score: 0,
    rank: null,
    level: 1
  });
  
  // Ссылка на объект игры для вызова методов напрямую
  const gameRef = useRef(null);
  
  // Обработчики событий для игры
  const handleStartGame = () => {
    setShowStartButton(false);
    setGameStarted(true);
    // Добавляем небольшую задержку перед запуском игры
    setTimeout(() => {
      if (gameRef.current) {
        console.log('Запускаем игру...');
        gameRef.current.startGame();
      }
    }, 300);
  };
  
  const handleGameOver = (result) => {
    // Проверяем, что это не дублирующий вызов
    if (gameOver) {
      console.log("Game already in 'over' state, ignoring duplicate call");
      return;
    }
    
    console.log("Game over detected, score:", result.score);
    
    // Сохраняем результаты игры
    const saveResult = savePlayerScore(playerName, result.score);
    
    if (saveResult.success) {
      setGameResult({
        score: result.score,
        rank: saveResult.rank,
        level: result.level,
        isNewRecord: saveResult.isNewRecord
      });
    }
    
    // Устанавливаем флаг игры в localStorage для предотвращения дублирования
    const gameResultKey = `last_game_over_${playerName}_${Date.now()}`;
    localStorage.setItem(gameResultKey, result.score.toString());
    
    // Устанавливаем флаг завершения игры
    setGameOver(true);
    setGameStarted(false);
    
    // Очищаем старые флаги игры (старше 1 часа)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('last_game_over_') && 
          Date.now() - parseInt(key.split('_').pop()) > 3600000) {
        localStorage.removeItem(key);
      }
    });
  };
  
  const handleGamePause = (isPaused) => {
    console.log("Вызван handleGamePause, ставим isPaused =", isPaused);
    
    // Обновляем состояние компонента
    setGamePaused(isPaused);
    
    // Если нужно поставить игру на паузу, используем метод pauseGame через ref
    if (isPaused && gameRef.current && !gameRef.current.isGameOver) {
      gameRef.current.pauseGame();
    }
  };
  
  const handleGameStart = (isStarted) => {
    setGameStarted(isStarted);
  };
  
  const handleRestartGame = () => {
    console.log("Вызван handleRestartGame");
    
    // Сбрасываем состояния игры
    setGameOver(false);
    setGamePaused(false);
    setGameStarted(true);
    
    // Сбрасываем флаги отправки в блокчейн
    localStorage.removeItem('sendingInProgress');
    localStorage.removeItem('lastSentScore');
    localStorage.removeItem('lastSentTimestamp');
    
    // Добавляем задержку и перед рестартом тоже
    setTimeout(() => {
      if (gameRef.current) {
        console.log("Выполняем resetGame и startGame");
        gameRef.current.resetGame();
        gameRef.current.startGame();
      }
    }, 300);
  };
  
  const handleResumePaused = () => {
    console.log("Вызван handleResumePaused");
    
    // Предотвращаем двойное нажатие
    if (!gamePaused) return;
    
    // Сначала изменяем состояние компонента
    setGamePaused(false);
    
    // Используем метод resumeGame через ref
    setTimeout(() => {
      if (gameRef.current && !gameRef.current.isGameOver) {
        // Используем только resumeGame, а не startGame
        if (typeof gameRef.current.resumeGame === 'function') {
          gameRef.current.resumeGame();
        } else {
          // Запасной вариант - используем togglePause
          gameRef.current.togglePause();
        }
      }
    }, 50);
  };
  
  const handleSaveName = (name) => {
    // Проверяем, занят ли ник (если есть кошелек)
    if (walletAddress) {
      const walletNamesStr = localStorage.getItem('walletNames');
      const walletNames = walletNamesStr ? JSON.parse(walletNamesStr) : {};
      
      // Проверяем, использует ли кто-то этот ник, и не привязан ли он к текущему кошельку
      const isNameTaken = Object.entries(walletNames).some(
        ([address, nickname]) => nickname === name && address !== walletAddress
      );
      
      if (isNameTaken) {
        // Показываем уведомление об ошибке
        console.error("Этот ник Discord уже привязан к другому кошельку");
        notificationManager.createNotification(
          'This Discord nickname is already linked to another wallet',
          {
            type: 'error',
            icon: '⚠️',
            duration: 6000
          }
        );
        return;
      }
      
      // Сохраняем имя для текущего кошелька
      walletNames[walletAddress] = name;
      localStorage.setItem('walletNames', JSON.stringify(walletNames));
    }
    
    // Обновляем имя в компоненте
    setPlayerName(name);
    
    // Сохраняем имя в общем хранилище
    localStorage.setItem('playerName', name);
    
    // Обновляем состояние UI
    setShowNameInput(false);
    setShowStartButton(true);
    
    // Проверяем, был ли запуск через флаг showNameDialogOnGame
    const wasFromMainPage = localStorage.getItem('showNameDialogOnGame') === 'true';
    
    // Показываем уведомление об успешном сохранении
    notificationManager.createNotification(
      'Discord nickname successfully saved!',
      {
        type: 'success',
        icon: '✅',
        duration: 4000
      }
    );
    
    // Автоматически запускаем игру, если пришли с главной страницы
    if (wasFromMainPage) {
      setTimeout(() => {
        handleStartGame();
      }, 500);
    }
  };
  
  const handleShowLeaderboard = () => {
    setShowLeaderboard(true);
  };
  
  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false);
    
    // Не снимаем паузу при закрытии лидерборда, если был Game Over
    if (!gameOver && gamePaused) {
      // Сначала изменяем состояние компонента
      setGamePaused(false);
      
      // Используем метод resumeGame через ref
      setTimeout(() => {
        if (gameRef.current && !gameRef.current.isGameOver) {
          // Используем только resumeGame, а не startGame
          if (typeof gameRef.current.resumeGame === 'function') {
            gameRef.current.resumeGame();
          } else {
            // Запасной вариант - используем togglePause
            gameRef.current.togglePause();
          }
        }
      }, 50);
    }
  };
  
  // Detect mobile devices for displaying controls
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Handlers for mobile controls
  const handleLeftStart = (e) => {
    e.preventDefault();
    if (gameRef.current && gameStarted && !gamePaused && !gameOver) {
      gameRef.current.startMoveLeft();
    }
  };
  
  const handleLeftEnd = (e) => {
    e.preventDefault();
    if (gameRef.current) {
      gameRef.current.stopMoveLeft();
    }
  };
  
  const handleRightStart = (e) => {
    e.preventDefault();
    if (gameRef.current && gameStarted && !gamePaused && !gameOver) {
      gameRef.current.startMoveRight();
    }
  };
  
  const handleRightEnd = (e) => {
    e.preventDefault();
    if (gameRef.current) {
      gameRef.current.stopMoveRight();
    }
  };
  
  return (
    <div className="game-container">
      {/* Компонент игры */}
      <Game
        ref={gameRef}
        playerName={playerName}
        setPlayerName={setPlayerName}
        onGameOver={handleGameOver}
        onGameStart={handleGameStart}
        onGamePause={handleGamePause}
      />
      
      {/* Меню ввода имени */}
      <NameMenu
        visible={showNameInput}
        onSave={handleSaveName}
        initialName={playerName}
        walletConnected={!!walletAddress}
      />
      
      {/* Кнопка начала игры */}
      <StartButton
        visible={!gameStarted && !gameOver && showStartButton && !showNameInput}
        onStart={handleStartGame}
      />
      
      {/* Меню паузы */}
      <PauseMenu
        visible={gamePaused && !gameOver}
        onResume={handleResumePaused}
        onRestart={handleRestartGame}
        onShowLeaderboard={handleShowLeaderboard}
      />
      
      {/* Экран завершения игры */}
      <GameOver
        visible={gameOver}
        score={gameResult.score}
        rank={gameResult.rank}
        onRestart={handleRestartGame}
        onShowLeaderboard={handleShowLeaderboard}
      />
      
      {/* Таблица рекордов */}
      <Leaderboard
        playerName={playerName}
        visible={showLeaderboard}
        onClose={handleCloseLeaderboard}
      />
      
      {/* Мобильные элементы управления */}
      {isMobile && gameStarted && !gamePaused && !gameOver && (
        <div className="mobile-controls">
          <div 
            id="leftBtn" 
            className="control-btn left-btn"
            onTouchStart={handleLeftStart}
            onTouchEnd={handleLeftEnd}
            onMouseDown={handleLeftStart}
            onMouseUp={handleLeftEnd}
            onMouseLeave={handleLeftEnd}
          >
            <span className="arrow">←</span>
          </div>
          <div 
            id="rightBtn" 
            className="control-btn right-btn"
            onTouchStart={handleRightStart}
            onTouchEnd={handleRightEnd}
            onMouseDown={handleRightStart}
            onMouseUp={handleRightEnd}
            onMouseLeave={handleRightEnd}
          >
            <span className="arrow">→</span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .game-container {
          position: relative;
          width: 100%;
          max-width: 800px;
          height: 750px;
          margin: 0 auto;
          background-color: transparent;
          overflow: hidden;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .mobile-controls {
          position: absolute;
          bottom: 20px;
          left: 0;
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 50;
          pointer-events: none;
        }
        
        .control-btn {
          width: 70px;
          height: 70px;
          background-color: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          color: white;
          cursor: pointer;
          user-select: none;
          pointer-events: auto;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .arrow {
          display: block;
          line-height: 1;
        }
        
        @media (max-width: 768px) {
          .game-container {
            height: 60vh;
            max-height: 500px;
            min-height: 350px;
            margin: 10px auto;
            padding: 10px;
          }
          
          .control-btn {
            width: 60px;
            height: 60px;
          }
        }
        
        @media (max-width: 480px) {
          .game-container {
            height: 55vh;
            max-height: 400px;
            min-height: 300px;
            margin: 5px auto;
            padding: 5px;
          }
        }
      `}</style>
    </div>
  );
};

export default GameContainer; 