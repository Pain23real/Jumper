// Полифилл для глобального объекта process в браузере
// Этот полифилл необходим для работы с библиотеками, которые зависят от Node.js API

// Базовый полифилл для process
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {},
    browser: true,
    version: '',
    versions: { node: false },
    nextTick: function(fn) {
      setTimeout(fn, 0);
    },
    cwd: function() {
      return '/';
    },
    platform: 'browser',
    release: { name: 'browser' },
    hrtime: function(previousTimestamp) {
      var clocktime = performance.now() * 1e-3;
      var seconds = Math.floor(clocktime);
      var nanoseconds = Math.floor((clocktime % 1) * 1e9);
      if (previousTimestamp) {
        seconds = seconds - previousTimestamp[0];
        nanoseconds = nanoseconds - previousTimestamp[1];
        if (nanoseconds < 0) {
          seconds--;
          nanoseconds += 1e9;
        }
      }
      return [seconds, nanoseconds];
    }
  };
}

// Расширяем process.env для поддержки переменных окружения из Vercel
if (typeof window !== 'undefined' && window.process && window.process.env) {
  // Добавляем переменные окружения из Vercel
  const vercelEnvVars = {};
  
  // Извлекаем переменные окружения из мета-тегов (если Vercel добавил их)
  document.querySelectorAll('meta[name^="env-"]').forEach(meta => {
    const name = meta.getAttribute('name').replace('env-', '');
    const content = meta.getAttribute('content');
    if (name && content) {
      vercelEnvVars[name] = content;
    }
  });
  
  // Добавляем переменные из объекта window.__NEXT_DATA__ (если Next.js)
  if (window.__NEXT_DATA__ && window.__NEXT_DATA__.env) {
    Object.assign(vercelEnvVars, window.__NEXT_DATA__.env);
  }
  
  // Объединяем с текущими переменными process.env
  Object.assign(window.process.env, {
    NODE_ENV: process.env.NODE_ENV || 'production',
    VERCEL: '1',
    VERCEL_ENV: 'production',
    ...vercelEnvVars
  });
}

export default {}; 