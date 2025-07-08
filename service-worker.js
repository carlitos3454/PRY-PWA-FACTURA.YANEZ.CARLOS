const CACHE_NAME = 'facturacion-pwa-cache-v25'; 


const urlsToCache = [
  '/public/',                     // La URL raíz de la aplicación PWA 
  '/public/index.html',           // El archivo HTML principal, que está directamente en public/
  // Archivos CSS 
  '/public/css/estilo.css',       
  // Archivos JavaScript.
  '/public/js/main.js',           
  '/public/js/data.js',           
  '/public/js/components/ClienteList.js',
  '/public/js/components/FacturaResumen.js',
  '/public/js/components/ProductoList.js',
  // ARCHIVOS EN js/helpers 
  '/public/js/helpers/selects.js',       
  '/public/js/helpers/limpiarCampos.js', 
  '/public/js/helpers/facturasGuardadas.js',
  // Archivos de PWA: manifest y iconos
  '/public/manifest.json',        
  '/public/icons/factura.png'     //Ruta ABSOLUTA que debe coincidir exactamente con el nombre del archivo de icono 
];

// Evento 'install'Se activa cuando el Service Worker se instala.
// Aquí cacheamos todos los recursos esenciales.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando y cacheando archivos estáticos...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Intentando cachear las siguientes URLs:', urlsToCache); 
        return cache.addAll(urlsToCache); 
      })
      .catch((error) => {
        console.error('Service Worker: Fallo al cachear los archivos durante la instalación. Error:', error); 
      
      })
  );
});

// Evento 'fetch': Se activa cada vez que el navegador hace una solicitud de red.
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Interceptando solicitud para:', event.request.url); 
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('Service Worker: Sirviendo desde caché:', event.request.url);
          return response; // Si el recurso está en caché, lo devolvemos
        }
        return fetch(event.request)
          .catch(() => {
            console.log('Service Worker: Fallo en la red o no en caché para:', event.request.url);
            // Esto se ejecuta si la solicitud de red falla (es decir, estamos offline)
            if (event.request.mode === 'navigate') {
              console.log('Service Worker: Solicitud de navegación fallida, sirviendo /public/');
              return caches.match('public'); 
            }
            return new Response(null, { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// Evento 'activate': Se activa después de la instalación y cuando el Service Worker toma el control.
// Aquí limpiamos cachés antiguos para evitar que la aplicación use recursos desactualizados.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando y limpiando cachés antiguos...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) { 
            console.log('Service Worker: Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // self.clients.claim() asegura que el Service Worker tome el control de todas las pestañas abiertas
        // en su alcance inmediatamente, sin necesidad de recargar la página.
        console.log('Service Worker: Tomando el control de los clientes...');
        return self.clients.claim(); 
    })
  );
});