const CACHE_NAME = 'facturacion-pwa-cache-v25'; // <--- ¡INCREMENTA SIEMPRE LA VERSIÓN! Cada vez que cambies este archivo o los recursos a cachear.

// Lista de URLs que el Service Worker debe cachear durante la instalación.
// ¡Todas las rutas deben ser ABSOLUTAS desde la raíz del dominio (http://localhost:8080/)!
// Dado que tu aplicación se sirve desde http://localhost:8080/public/, todas las rutas deben empezar con /public/.
const urlsToCache = [
  '/public/',                     // La URL raíz de tu aplicación PWA (representa http://localhost:8080/public/)
                                  // Es CRÍTICO que esta URL esté aquí para que el Service Worker sepa qué hacer
                                  // cuando la PWA intente cargar la raíz de su alcance.
  '/public/index.html',           // Tu archivo HTML principal, que está directamente en public/
         // Tu página de fallback para el modo offline (¡debe existir en public/!)
  // Archivos CSS (verifica si 'estilo.css' es el nombre exacto y está en public/css/)
  '/public/css/estilo.css',       

  // Archivos JavaScript. ¡CRÍTICO! Asegúrate de que TODAS las rutas y nombres de archivo sean correctos y existan.
  // Basado en tu estructura (image_b08ae0.png, image_a1f853.png):
  '/public/js/main.js',           
  '/public/js/data.js',           
  '/public/js/components/ClienteList.js',
  '/public/js/components/FacturaResumen.js',
  '/public/js/components/ProductoList.js',
  // ARCHIVOS EN js/helpers (confirmados en tus errores como buscados: image_a363de.png)
  '/public/js/helpers/selects.js',       
  '/public/js/helpers/limpiarCampos.js', 
  '/public/js/helpers/facturasGuardadas.js',
  // Si tienes archivos en 'js/actions' (tu estructura de carpeta lo indica: image_b08ae0.png), ¡añádelos aquí también! Ejemplo:
  // '/public/js/actions/nombreDeTuAction.js', 
  
  // Archivos de PWA: manifest y iconos
  '/public/manifest.json',        
  '/public/icons/factura.png'     // ¡CRÍTICO! Esta ruta debe ser ABSOLUTA y coincidir exactamente con el nombre de tu archivo de icono (image_a60e95.png)
];

// Evento 'install': Se activa cuando el Service Worker se instala.
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
        // Si este error ocurre, una de las URLs en 'urlsToCache' es incorrecta o no existe.
        // Revisa la pestaña 'Network' en DevTools para encontrar el 404.
      })
  );
});

// Evento 'fetch': Se activa cada vez que el navegador hace una solicitud de red.
// Aquí interceptamos las solicitudes y servimos desde la caché si el recurso está disponible.
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Interceptando solicitud para:', event.request.url); 
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('Service Worker: Sirviendo desde caché:', event.request.url);
          return response; // Si el recurso está en caché, lo devolvemos
        }

        // Si el recurso NO está en caché, intentamos obtenerlo de la red.
        // Esto es importante para contenido dinámico o recursos no cacheados.
        return fetch(event.request)
          .catch(() => {
            console.log('Service Worker: Fallo en la red o no en caché para:', event.request.url);
            // Esto se ejecuta si la solicitud de red falla (es decir, estamos offline)

            // **¡CRÍTICO para el modo offline!**
            // Si la solicitud original es una navegación (una solicitud de página HTML, como cuando abres la PWA),
            // entonces redirigimos a la página offline.html.
            if (event.request.mode === 'navigate') {
              // Asegúrate de que esta ruta a offline.html sea ABSOLUTA y correcta.
              // Debe coincidir exactamente con cómo lo cacheadaste.
              console.log('Service Worker: Solicitud de navegación fallida, sirviendo /public/');
              return caches.match('public'); // <-- ¡Verifica esta ruta!
            }
            // Para otros tipos de recursos (JS, CSS, imágenes) que no sean navegaciones y que fallen al cargarse
            // cuando estamos offline, devolvemos una respuesta de error genérica o simplemente un error.
            // Esto evita que la aplicación se "cuelgue" si falta un script o una imagen.
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
          if (cacheName !== CACHE_NAME) { // Si el nombre del caché es diferente al actual, lo borramos
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