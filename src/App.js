import React, { useState, useEffect } from 'react';
import './App.css';
import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import GamePage from './pages/GamePage';
import Leaderboard from './components/Leaderboard';
import { initializePlayer, isWalletConnected } from './utils/blockchainHelpers';
// Подключаем стили по умолчанию
import '@solana/wallet-adapter-react-ui/styles.css';

// Пропускаем ошибки с подключением криптокошельков
const originalConsoleError = console.error;
console.error = (...args) => {
  // Фильтруем ошибки связанные с Solflare и другими криптокошельками
  if (args.length > 0 && 
      (typeof args[0] === 'string' && 
       (args[0].includes('solflare') || 
        args[0].includes('Failed to establish connection') ||
        args[0].includes('ethereum')))) {
    return; // Пропускаем эти ошибки
  }
  originalConsoleError(...args);
};

function App() {
  const [showGamePage, setShowGamePage] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLockAnimation, setShowLockAnimation] = useState(false);
  const [lockClosed, setLockClosed] = useState(false);
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [particles, setParticles] = useState([]);
  const [raindrops, setRaindrops] = useState([]);
  const [cryptoRain, setCryptoRain] = useState([]);
  const [energyPulses, setEnergyPulses] = useState([]);
  
  // Настройка Solana
  const network = clusterApiUrl('devnet');
  const endpoint = {
    name: 'devnet',
    endpoint: network
  };
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  // Инициализация игрока только для новых сессий
  useEffect(() => {
    // Функция для инициализации игрока - запускаем только один раз при старте
    const initializePlayerAccount = async () => {
      try {
        // Проверяем, не была ли инициализация уже выполнена в текущей сессии
        const initFlag = localStorage.getItem('playerInitialized');
        const initTimestamp = localStorage.getItem('playerInitializedTimestamp');
        
        if (initFlag === 'true' && initTimestamp) {
          // Проверяем, не истек ли срок действия инициализации (30 минут)
          const elapsed = Date.now() - parseInt(initTimestamp);
          if (elapsed < 1800000) { // 30 минут
            console.log("Player was already initialized recently, skipping initialization");
            setPlayerInitialized(true);
            return true; // Инициализация уже выполнена
          }
        }
        
        // Проверяем подключение кошелька, но НЕ инициализируем автоматически
        // Это предотвратит автоматические транзакции при запуске
        const connected = await isWalletConnected();
        if (connected) {
          console.log("Wallet connected, but skipping auto-initialization");
          // Не вызываем initializePlayer() здесь
          return false; // Инициализация не выполнена, но это нормально
        }
        
        return false; // Инициализация не выполнена
      } catch (error) {
        console.error("Ошибка проверки инициализации игрока:", error);
        return false; // Ошибка инициализации
      }
    };
    
    // Эта функция будет доступна для ручного вызова из других компонентов
    const manualInitializePlayer = async () => {
      try {
        // Проверяем подключение кошелька
        const connected = await isWalletConnected();
        if (connected && !playerInitialized) {
          console.log("Инициализация аккаунта игрока вручную...");
          await initializePlayer();
          setPlayerInitialized(true);
          console.log("Аккаунт игрока успешно инициализирован");
          return true; // Инициализация успешно выполнена
        }
        return false; // Инициализация не выполнена
      } catch (error) {
        console.error("Ошибка инициализации игрока:", error);
        return false; // Ошибка инициализации
      }
    };
    
    // Сохраняем обе функции в глобальном объекте window
    window.checkPlayerInitialization = initializePlayerAccount;
    window.initializePlayerAccount = manualInitializePlayer;
    
    // Проверяем состояние инициализации при запуске, но НЕ инициализируем автоматически
    initializePlayerAccount();
    
  }, [playerInitialized]);

  // Создаем массив криптографических символов для шифрованного дождя
  const cryptoSymbols = [
    '01', '10', '0010', '1101', '∆', '◊', '∑', '∏', '∂', '√', '∞', '≈', '≠', '≤', '≥', '⊂', '⊃', '∩', '∪',
    'Ω', 'Φ', 'Ψ', 'α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'π', 'σ', 'τ', 'ξ', 'ζ', 'φ', 'ψ', 'ω',
    '¥', '¢', '£', '€', '₿', '©', '®', '™', '§', '¶', '†', '‡', '•', '‹', '›', '«', '»', '„', '"',
    '⌘', '⌥', '⇧', '⌃', '⎋', '⇥', '↩', '⌫', '⌦', '↑', '↓', '→', '←', '↔', '↕', '⇄', '⇅', '⇆', '⇇',
    '⚠', '⚡', '♠', '♣', '♥', '♦', '♪', '♫', '⌚', '⌛', '✉', '✓', '✕', '✗', '✘', '✓', '☢', '☣', '⚛'
  ];

  // Создаем фоновые эффекты при монтировании компонента
  useEffect(() => {
    // Создаем частицы для фона
    const createParticles = () => {
      const newParticles = [];
      const particleCount = window.innerWidth < 768 ? 30 : 50;
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          size: Math.random() * 3 + 1,
          speed: Math.random() * 10 + 5,
          opacity: Math.random() * 0.5 + 0.2,
          color: `rgba(${Math.random() * 100 + 156}, ${Math.random() * 50 + 38}, ${Math.random() * 100 + 155}, ${Math.random() * 0.3 + 0.2})`
        });
      }
      
      setParticles(newParticles);
    };
    
    // Создаем шифрованный дождь
    const createCryptoRain = () => {
      const newCryptoRain = [];
      const cryptoRainCount = window.innerWidth < 768 ? 20 : 40;
      
      for (let i = 0; i < cryptoRainCount; i++) {
        // Создаем случайную вертикальную строку символов
        const symbolCount = Math.floor(Math.random() * 8) + 3; // От 3 до 10 символов
        let symbols = [];
        
        for (let j = 0; j < symbolCount; j++) {
          const randomIndex = Math.floor(Math.random() * cryptoSymbols.length);
          symbols.push(cryptoSymbols[randomIndex]);
        }
        
        newCryptoRain.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight - 500, // Начинаем выше экрана
          symbols: symbols,
          speed: Math.random() * 8 + 2,
          opacity: Math.random() * 0.8 + 0.2,
          symbolSize: Math.random() * 5 + 10,
          delay: Math.random() * 10
        });
      }
      
      setCryptoRain(newCryptoRain);
    };
    
    // Создаем капли дождя
    const createRaindrops = () => {
      const newRaindrops = [];
      const dropCount = window.innerWidth < 768 ? 50 : 100; // Увеличиваем количество
      
      for (let i = 0; i < dropCount; i++) {
        newRaindrops.push({
          id: i,
          x: Math.random() * window.innerWidth,
          height: Math.random() * 20 + 10,
          speed: Math.random() * 15 + 10,
          delay: Math.random() * 5
        });
      }
      
      setRaindrops(newRaindrops);
    };
    
    // Создаем энергетические всплески
    const createEnergyPulses = () => {
      const newPulses = [];
      const pulseCount = 4; // Оптимальное количество для производительности
      
      for (let i = 0; i < pulseCount; i++) {
        newPulses.push({
          id: i,
          x: Math.random() * 100, // В процентах от ширины экрана
          y: Math.random() * 100, // В процентах от высоты экрана
          size: Math.random() * 40 + 20, // Размер в процентах от меньшей стороны viewport
          delay: i * 2, // Разные задержки для эффекта волны
          duration: Math.random() * 5 + 5, // Длительность анимации
          color: Math.random() > 0.5 ? 
                 'rgba(176, 38, 255, 0.15)' : 
                 'rgba(138, 43, 226, 0.12)'
        });
      }
      
      setEnergyPulses(newPulses);
    };
    
    createParticles();
    createRaindrops();
    createCryptoRain();
    createEnergyPulses();
    
    // Обновляем частицы и эффекты при изменении размера окна
    const handleResize = () => {
      createParticles();
      createRaindrops();
      createCryptoRain();
      createEnergyPulses();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Устанавливаем favicon для вкладки браузера
    const setFavicon = () => {
      // Проверяем, существует ли уже favicon
      let link = document.querySelector("link[rel*='icon']");
      
      // Если нет, создаем новый элемент
      if (!link) {
        link = document.createElement('link');
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      
      // Создаем канвас для рисования иконки
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      
      // Создаем стильный градиентный фон
      const bgGradient = ctx.createLinearGradient(0, 0, 64, 64);
      bgGradient.addColorStop(0, '#4a2b7a'); // Темно-фиолетовый
      bgGradient.addColorStop(0.5, '#8a2be2'); // Фиолетовый
      bgGradient.addColorStop(1, '#b026ff'); // Яркий фиолетовый
      
      // Заполняем фон градиентом
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 64, 64);
      
      // Добавляем сетку для киберпанк-эффекта
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.5;
      
      // Рисуем горизонтальные линии
      for(let y = 8; y < 64; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(64, y);
        ctx.stroke();
      }
      
      // Рисуем вертикальные линии
      for(let x = 8; x < 64; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 64);
        ctx.stroke();
      }
      
      // Добавляем свечение
      ctx.shadowColor = '#b026ff';
      ctx.shadowBlur = 10;
      
      // Рисуем стилизованную букву "S" (для Secret Jump)
      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.bezierCurveTo(35, 15, 15, 30, 30, 30);
      ctx.bezierCurveTo(45, 30, 25, 45, 40, 45);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffcc00'; // Золотой цвет
      ctx.stroke();
      
      // Добавляем блик
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(15, 15, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Добавляем цифровой эффект
      ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.font = '8px monospace';
      ctx.fillText('01', 46, 16);
      ctx.fillText('10', 46, 25);
      
      // Преобразуем канвас в URL данных
      link.href = canvas.toDataURL('image/png');
      document.title = 'The Secret Jump';
    };
    
    setFavicon();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Функция для запуска анимации замка
  const triggerLockAnimation = () => {
    // Показываем открытый замок
    setShowLockAnimation(true);
    setLockClosed(false);
    
    // Через 1 секунду закрываем замок
    setTimeout(() => {
      setLockClosed(true);
      
      // Добавляем звук закрытия замка (если доступно)
      try {
        const lockSound = new Audio('/lock-sound.mp3');
        lockSound.play().catch(e => console.log('Звук не воспроизведен:', e));
      } catch (e) {
        console.log('Звук не поддерживается');
      }
    }, 1000);
    
    // Закрываем анимацию через 3 секунды
    setTimeout(() => {
      setShowLockAnimation(false);
    }, 3000);
  };

  return (
    <ConnectionProvider endpoint={endpoint.endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="App">
            {/* Энергетические всплески в фоне */}
            {energyPulses.map((pulse) => (
              <div
                key={`pulse-${pulse.id}`}
                className="energy-pulse"
                style={{
                  left: `${pulse.x}%`,
                  top: `${pulse.y}%`,
                  width: `${pulse.size}vmin`,
                  height: `${pulse.size}vmin`,
                  animationDelay: `${pulse.delay}s`,
                  animationDuration: `${pulse.duration}s`,
                  background: `radial-gradient(circle, ${pulse.color} 0%, transparent 70%)`
                }}
              />
            ))}
            
            {/* Фон с частицами */}
            <div className="particles-background">
              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className="particle"
                  style={{
                    left: `${particle.x}px`,
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    backgroundColor: particle.color,
                    opacity: particle.opacity,
                    animationDuration: `${particle.speed}s`
                  }}
                />
              ))}
            </div>
            
            {/* Эффект дождя */}
            <div className="rain-container">
              {raindrops.map((drop) => (
                <div
                  key={`rain-${drop.id}`}
                  className="rain-drop"
                  style={{
                    left: `${drop.x}px`,
                    height: `${drop.height}px`,
                    animationDuration: `${drop.speed}s`,
                    animationDelay: `${drop.delay}s`
                  }}
                />
              ))}
              
              {/* Шифрованный дождь */}
              {cryptoRain.map((cryptoDrop) => (
                <div
                  key={`crypto-${cryptoDrop.id}`}
                  className="crypto-rain"
                  style={{
                    left: `${cryptoDrop.x}px`,
                    top: `${cryptoDrop.y}px`,
                    opacity: cryptoDrop.opacity,
                    animationDuration: `${cryptoDrop.speed}s`,
                    animationDelay: `${cryptoDrop.delay}s`,
                    fontSize: `${cryptoDrop.symbolSize}px`
                  }}
                >
                  {cryptoDrop.symbols.map((symbol, index) => (
                    <div 
                      key={`symbol-${index}`} 
                      className="crypto-symbol"
                      style={{
                        opacity: 1 - (index * 0.1),
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      {symbol}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            
            {/* Кнопки в верхней части страницы */}
            <div className="top-buttons-container" style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              zIndex: 100,
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}>
              <button 
                className="leaderboard-mini-button" 
                onClick={() => setShowLeaderboard(true)}
                style={{
                  backgroundColor: '#ffcc00',
                  color: '#4a2b7a',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(255, 204, 0, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🏆</span>
                Leaderboard
              </button>
              <WalletMultiButton />
            </div>
            
            {/* Анимация замка на весь экран */}
            {showLockAnimation && (
              <div className="lock-animation-overlay">
                <div className={`lock-animation ${lockClosed ? 'closed' : ''}`}>
                  <div className="lock-body">
                    <div className="lock-shackle"></div>
                    <div className="keyhole"></div>
                  </div>
                </div>
              </div>
            )}
            
            {showGamePage ? (
              <GamePage onBackToHome={() => setShowGamePage(false)} />
            ) : (
              <div className="home-page">
                {/* Заголовок и описание */}
                <div className="game-description">
                  <div className="description-container">
                    <h1 className="main-title">The Secret Jump</h1>
                    <p className="subtitle">Dive into the shadows of the blockchain realm.</p>
                    
                    <div className="cryptic-message">
                      <p className="enigma-text">Every leap you take, every point you score - encrypted in the shadows of Solana.</p>
                      <p className="arcium-text">Arcium: Where your achievements become immutable secrets on the blockchain.</p>
                    </div>
                    
                    <div className="features">
                      <div 
                        className="feature" 
                        id="leaderboardFeature"
                        onClick={() => setShowLeaderboard(true)}
                      >
                        <span className="feature-icon">🏆</span>
                        <h3>Challenge the Shadows</h3>
                        <p>View the encrypted leaderboard and claim your rightful place</p>
                      </div>
                      <div 
                        className="feature" 
                        onClick={() => {
                          // Проверяем, подключен ли кошелек и привязано ли имя
                          const walletConnected = window.solana && window.solana.isConnected;
                          const walletAddress = walletConnected ? window.solana.publicKey.toString() : null;
                          
                          // Проверяем, есть ли имя для этого кошелька
                          let hasNickname = false;
                          
                          if (walletAddress) {
                            const walletNamesStr = localStorage.getItem('walletNames');
                            const walletNames = walletNamesStr ? JSON.parse(walletNamesStr) : {};
                            hasNickname = !!walletNames[walletAddress];
                          }
                          
                          // Если кошелек подключен и имя привязано, переходим к игре
                          // В противном случае, устанавливаем флаг, что нужно показать диалог ввода имени
                          if (walletConnected && hasNickname) {
                            setShowGamePage(true);
                          } else {
                            // Сохраняем флаг, что нужно показать диалог ввода имени после перехода на страницу игры
                            localStorage.setItem('showNameDialogOnGame', 'true');
                            
                            // Показываем всплывающее сообщение о необходимости ввести ник Discord
                            const nameMsg = document.createElement('div');
                            nameMsg.className = 'name-required-msg';
                            nameMsg.innerHTML = `
                              <div class="name-msg-content">
                                <div class="name-msg-icon">👤</div>
                                <div class="name-msg-text">Пожалуйста, введите ваш ник Discord для начала игры</div>
                              </div>
                            `;
                            
                            // Стили для сообщения
                            nameMsg.style.position = 'fixed';
                            nameMsg.style.top = '80px';
                            nameMsg.style.right = '20px';
                            nameMsg.style.backgroundColor = 'rgba(26, 9, 51, 0.9)';
                            nameMsg.style.color = 'white';
                            nameMsg.style.padding = '15px';
                            nameMsg.style.borderRadius = '10px';
                            nameMsg.style.boxShadow = '0 0 20px rgba(176, 38, 255, 0.5)';
                            nameMsg.style.zIndex = '9999';
                            nameMsg.style.animation = 'fadeIn 0.5s ease-out';
                            nameMsg.style.border = '1px solid rgba(176, 38, 255, 0.3)';
                            
                            // Стили для содержимого
                            const content = nameMsg.querySelector('.name-msg-content');
                            content.style.display = 'flex';
                            content.style.alignItems = 'center';
                            content.style.gap = '10px';
                            
                            // Стили для иконки
                            const icon = nameMsg.querySelector('.name-msg-icon');
                            icon.style.fontSize = '1.5rem';
                            icon.style.color = '#b026ff';
                            
                            // Стили для текста
                            const text = nameMsg.querySelector('.name-msg-text');
                            text.style.fontSize = '0.9rem';
                            
                            // Добавляем сообщение в DOM
                            document.body.appendChild(nameMsg);
                            
                            // Удаляем сообщение через 5 секунд
                            setTimeout(() => {
                              if (nameMsg && nameMsg.parentNode) {
                                nameMsg.style.opacity = '0';
                                nameMsg.style.transform = 'translateY(-20px)';
                                nameMsg.style.transition = 'all 0.5s ease-out';
                                
                                setTimeout(() => {
                                  if (nameMsg && nameMsg.parentNode) {
                                    nameMsg.parentNode.removeChild(nameMsg);
                                  }
                                }, 500);
                              }
                            }, 5000);
                            
                            setShowGamePage(true);
                          }
                        }}
                      >
                        <span className="feature-icon">🎮</span>
                        <h3>Enter The Void</h3>
                        <p>Your journey awaits - each score immortalized on Solana</p>
                      </div>
                      <div 
                        className="feature"
                        onClick={triggerLockAnimation}
                      >
                        <span className="feature-icon">🔒</span>
                        <h3>Cryptic Glory</h3>
                        <p>Your achievements are sealed in the Arcium protocol, forever hidden yet eternally proven</p>
                      </div>
                    </div>
                    
                    <div className="creator-note">
                      <p>A cryptographic masterpiece by <span className="creator-name">Oiratos</span></p>
                      <p style={{ fontSize: '0.8rem', opacity: '0.7', marginTop: '10px' }}>
                        Protected by Arcium
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Таблица лидеров */}
            {showLeaderboard && (
              <Leaderboard
                playerName=""
                visible={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
              />
            )}
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
