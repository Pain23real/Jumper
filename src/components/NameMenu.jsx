import React, { useState, useEffect } from 'react';

const NameMenu = ({ visible, onSave, initialName, walletConnected }) => {
  const [name, setName] = useState(initialName || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setName(initialName || '');
  }, [initialName]);
  
  // Проверка, занят ли ник
  const checkNameAvailability = (nickname) => {
    // Получаем все сохраненные имена и их привязки к кошелькам
    const walletNamesStr = localStorage.getItem('walletNames');
    if (!walletNamesStr) return true; // Нет сохраненных имен
    
    const walletNames = JSON.parse(walletNamesStr);
    
    // Проверяем, есть ли этот ник среди значений
    return !Object.values(walletNames).includes(nickname);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Проверка на пустое имя
    if (!name.trim()) {
      setError('Пожалуйста, введите ваш ник Discord');
      return;
    }
    
    // Проверка на соответствие формату Discord (например, name#0000)
    // Эту проверку можно модифицировать по вашему усмотрению
    if (!/^[a-zA-Z0-9_]{2,32}(#\d{4})?$/.test(name.trim())) {
      setError('Пожалуйста, введите корректный ник Discord');
      return;
    }
    
    // Проверяем, занят ли ник
    if (!checkNameAvailability(name.trim())) {
      setError('Этот ник уже привязан к другому кошельку');
      return;
    }
    
    setLoading(true);
    
    // Сохраняем имя
    onSave(name.trim());
    
    // Запускаем подключение кошелька, если он еще не подключен
    if (!walletConnected) {
      setTimeout(() => {
        // Находим кнопку подключения кошелька и имитируем клик
        const walletButton = document.querySelector('.wallet-adapter-button-trigger');
        
        if (walletButton) {
          // Отмечаем, что ник уже был сохранен перед подключением кошелька
          localStorage.setItem('nicknameAlreadySaved', 'true');
          
          // Показываем уведомление о необходимости подключить кошелек
          if (window.showNotification) {
            window.showNotification({
              type: 'info',
              message: 'Для игры необходимо подключить кошелек',
              duration: 5000
            });
          }
          
          // Имитируем клик по кнопке кошелька
          walletButton.click();
        }
        
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className="name-menu-overlay">
      <div className="name-menu">
        <div className="name-header">
          <div className="name-icon">👤</div>
          <h2>Как вас зовут?</h2>
        </div>
        
        <p className="name-description">
          Введите ваш ник Discord для сохранения результатов
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(''); // Сбрасываем ошибку при изменении имени
              }}
              placeholder="Ваш ник Discord"
              className={error ? 'error' : ''}
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          
          <button 
            className="save-button" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Подключение...
              </>
            ) : (
              'Сохранить'
            )}
          </button>
        </form>
      </div>
      
      <style jsx>{`
        .name-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
          animation: fadeIn 0.3s ease-out;
        }
        
        .name-menu {
          background-color: rgba(26, 9, 51, 0.95);
          border-radius: 15px;
          padding: 30px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 0 30px rgba(138, 43, 226, 0.4);
          animation: scaleIn 0.3s ease-out;
          border: 1px solid rgba(138, 43, 226, 0.3);
        }
        
        .name-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          gap: 15px;
        }
        
        .name-icon {
          font-size: 2rem;
          color: #8a2be2;
        }
        
        h2 {
          margin: 0;
          color: white;
          font-size: 1.8rem;
        }
        
        .name-description {
          margin-bottom: 25px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .input-group {
          margin-bottom: 20px;
          position: relative;
        }
        
        input {
          width: 100%;
          padding: 12px 15px;
          border-radius: 10px;
          border: 1px solid rgba(138, 43, 226, 0.3);
          background-color: rgba(0, 0, 0, 0.2);
          color: white;
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
        }
        
        input:focus {
          border-color: #8a2be2;
          box-shadow: 0 0 10px rgba(138, 43, 226, 0.4);
        }
        
        input.error {
          border-color: #ff4757;
        }
        
        .error-message {
          color: #ff4757;
          font-size: 0.9rem;
          margin-top: 5px;
          animation: fadeIn 0.3s ease-out;
        }
        
        .save-button {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          background-color: #8a2be2;
          color: white;
          border: none;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }
        
        .save-button:hover {
          background-color: #9845f5;
          transform: translateY(-2px);
        }
        
        .save-button:disabled {
          background-color: #6a11cb;
          cursor: wait;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default NameMenu; 