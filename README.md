# ¿Hay Paro Hoy?

Una app simple que responde la pregunta más importante de la mañana: **¿hay paro hoy en Argentina?**

Porque nadie quiere enterarse de sorpresas al salir de casa.

**[Ver app en vivo](https://el-paro-de-hoy.vercel.app/)**

## ¿Qué hace?

La app consulta y procesa noticias de Google en tiempo real buscando información sobre paros en **10 sectores clave** (tanto en el AMBA como a nivel Nacional). Presenta la información a través de un diseño de estilo editorial profesional y claro. Si encuentra algo, te muestra:

- **SI** o **NO** hay paro en cada uno de los sectores monitoreados: Colectivos, Trenes, Subtes, Aeronáutico, Educación, Salud, Administración Pública, Bancarios, Recolección y Logística, Justicia.
- **Qué líneas están afectadas** (específico para sectores de transporte como colectivos, trenes y subtes).
- **Última actualización**, mostrada de forma relativa ("hace x tiempo") para mayor claridad.

La aplicación incluye un contador de "sectores afectados" en la cabecera si hay paros activos, y su favicon es dinámico: 🔴 rojo si hay paro en algún sector, 🟢 verde si todo funciona con normalidad.

## Tecnologías

- **Next.js 16** y **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Cheerio** para el scraping del contenido.
- **google-news-url-decoder** para sortear las redirecciones ofuscadas de Google News y obtener las URLs reales.
- **Upstash Redis** para el sistema de caché.

## Cómo funciona

1. Busca en Google News artículos recientes utilizando consultas específicas para cada sector (ej: "paro colectivos hoy amba", "paro bancarios hoy argentina", "paro docentes hoy amba").
2. Utiliza un pipeline robusto para decodificar las URLs ofuscadas por los redireccionamientos de Google News.
3. Entra al sitio web original de cada artículo que mencione "paro" o palabras clave de cada sector en el titular.
4. Verifica que el artículo mencione "hoy" o la fecha actual para descartar noticias antiguas.
5. Extrae el estado del sector y, en el caso del transporte, las líneas afectadas utilizando expresiones regulares (regex).
6. Filtra falsos positivos (artículos sugeridos por los diarios, paros levantados o noticias no relacionadas).
7. Almacena el resultado temporalmente en Redis para optimizar tiempos de respuesta y no saturar las webs de noticias.

## Desarrollo local

```bash
# Instalar dependencias usando pnpm (requerido)
pnpm install

# Configurar variables de entorno
# Crear un archivo .env.local con:
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...

# Iniciar el servidor de desarrollo
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000) para ver la aplicación localmente.

Para probar u obligar la ejecución del scraper:
Visitá o hacé un GET a la ruta de la API en el entorno local (usualmente `/api/scraper`).

## Notas técnicas

El scraper está altamente optimizado y modulado para distintos sectores. Además, en sectores de transporte puede detectar diferentes formatos de menciones en el texto, como:

- "Línea 60" o "líneas 161, 501, 228"
- "subte A, C y H"
- "tren Roca" o "línea Sarmiento"

El sistema cuenta con filtros avanzados para ignorar enlaces a artículos sugeridos por los propios portales de noticias o resultados genéricos, garantizando una alta precisión en la detección diaria de conflictos gremiales. La arquitectura del código sigue principios limpios (SOLID), aislando la lógica en servicios por sector.

## Autor

Hecho por [Lucas Villanueva](https://www.lucasvillanueva.tech/)

[GitHub](https://github.com/KenaiiDev)

## Licencia

MIT
