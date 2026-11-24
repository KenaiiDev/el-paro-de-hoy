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

1. Busca en Google News artículos del día utilizando consultas específicas para cada sector (ej: "paro colectivos hoy amba", "paro bancarios hoy argentina", "paro docentes hoy amba").
2. Filtra los titulares que mencionan una medida de fuerza o una interrupción de servicio.
3. Clasifica cada titular para el sector con un clasificador basado en reglas (`src/lib/scraper/classifier.ts`):
   - Compara palabras completas sin tildes, así "paro" no coincide con "amparo" ni "ate" con "debate".
   - Distingue palabras clave **fuertes** del sector ("colectivos", "UTA") de las **débiles** ("transporte"), y exige que el sector y el paro aparezcan en la misma frase del titular.
   - Detecta si el paro es **hoy**, si está **anunciado** para otro día, si ya **pasó**, si fue **levantado** (o hay conciliación obligatoria) o si el sector **no adhiere**.
   - Descarta interrupciones que no son paros (obras, temporal, fallas técnicas), titulares en forma de pregunta y paros de otras provincias en sectores con alcance AMBA.
4. En transporte, entra al artículo original para confirmar el sector cuando el titular es ambiguo y para extraer las líneas afectadas (colectivos, trenes o subtes, según el sector).
5. Guarda el resultado en Redis con un TTL. La web sólo muestra los estados actualizados hoy.

## Desarrollo local## Desarrollo local

```bash
# Instalar dependencias usando pnpm (requerido)
pnpm install

# Configurar variables de entorno
# Crear un archivo .env.local con:
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...
# CRON_SECRET=...   # opcional en desarrollo, obligatorio en producción

# Iniciar el servidor de desarrollo
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000) para ver la aplicación localmente.

### Ejecutar el scraper

La ruta `/api/scraper` requiere el header `Authorization: Bearer <CRON_SECRET>`. En desarrollo, si `CRON_SECRET` no está definido, se permite el acceso sin header.

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/scraper?debug=1"
```

Agregar `?debug=1` incluye el detalle de las consultas y artículos analizados.

En producción se ejecuta desde GitHub Actions (`.github/workflows/scraper.yml`), que necesita los secrets `SCRAPER_URL` y `CRON_SECRET`. El mismo `CRON_SECRET` debe estar configurado en las variables de entorno de Vercel.

### Calidad

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Notas técnicas

El extractor de líneas reconoce distintos formatos de mención en el texto:

- "Línea 60", "líneas 161, 501 y 228" o listados como "17, 28, 34 (ramal 2) y 44"
- "subte A, C y H" o "todas las líneas de subte"
- "tren Roca" o "línea Sarmiento"

Ignora horarios y fechas ("entre las 10 y 14 horas") y las secciones de notas relacionadas de los portales.

El clasificador se prueba con un conjunto de titulares etiquetados en `src/lib/scraper/__tests__/headlines.fixtures.ts`. Al correr `pnpm test` se informan la precisión y el recall sobre ese conjunto. Para agregar un caso nuevo (por ejemplo, un falso positivo detectado en producción), sumá el titular con el veredicto esperado por sector.

## Autor

Hecho por [Lucas Villanueva](https://www.lucasvillanueva.com.ar/)

[GitHub](https://github.com/KenaiiDev)

## Licencia

MIT
