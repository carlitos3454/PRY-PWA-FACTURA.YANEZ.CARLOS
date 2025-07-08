if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/public/service-worker.js', { scope: '/public/' }) 
      .then(registration => {
        console.log('Service Worker: Registrado con éxito. Alcance:', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker: Fallo el registro.', error);
      });
  });
}