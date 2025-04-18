import { writable } from 'svelte/store';

function createNyTime() {
  const { subscribe, set } = writable({
    timeString: '',
    dateString: '',
    timezone: 'EDT'
  });

  function update() {
    const now = new Date();
    const options = { timeZone: 'America/New_York' };
    
    set({
      timeString: now.toLocaleTimeString('es-ES', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        ...options
      }),
      dateString: now.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        ...options
      }),
      timezone: now.toLocaleTimeString('es-ES', {
        timeZoneName: 'short',
        ...options
      }).split(' ')[2] || 'EDT'
    });
  }

  // Actualizar inmediatamente y cada segundo
  update();
  const interval = setInterval(update, 1000);

  return {
    subscribe,
    stop: () => clearInterval(interval)
  };
}

export const nyTime = createNyTime();