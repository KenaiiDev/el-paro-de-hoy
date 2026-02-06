# ¿Hay Paro de Transporte Hoy?

Una app simple que responde la pregunta más importante de la mañana: **¿hay paro de transporte hoy en el AMBA?**

Porque nadie quiere enterarse en la parada del colectivo.

**[Ver app en vivo](https://el-paro-de-hoy.vercel.app/)**

## ¿Qué hace?

La app scrapea noticias de Google en tiempo real buscando información sobre paros de transporte en el Área Metropolitana de Buenos Aires (AMBA). Si encuentra algo, te muestra:

- **SI** o **NO** hay paro (bien grande, imposible no verlo)
- **Qué líneas están afectadas** (colectivos, trenes, subtes)
- **Última actualización** de la información

El favicon cambia de color como un semáforo: 🔴 rojo si hay paro, 🟢 verde si todo normal.

## Tecnologías

- **Next.js 16** - Framework principal
- **TypeScript** - Para no meter la pata
- **Cheerio** - Scraping de noticias
- **Upstash Redis** - Caché de datos
- **Tailwind CSS** - Estilos

## Cómo funciona

1. Busca en Google News artículos con "paro transporte AMBA" de las últimas 6 horas
2. Entra a cada artículo que mencione "paro" en el titular
3. Verifica que el artículo mencione "hoy" o la fecha actual
4. Extrae las líneas afectadas usando regex (colectivos, trenes, subtes)
5. Filtra falsos positivos (artículos relacionados, paros pasados)
6. Cachea el resultado en Redis

## Desarrollo local

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
# Crear .env.local con:
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...

# Correr el servidor
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000) y listo.

## Notas técnicas

El scraper está optimizado para detectar diferentes formatos de menciones:

- "Línea 60"
- "líneas 161, 501, 228"
- "subte A, C y H"
- "tren Roca"

Los regex filtran artículos relacionados para evitar tomar paros de otros días o menciones irrelevantes.

## Autor

Hecho por [Lucas Villanueva](https://www.lucasvillanueva.tech/)

[GitHub](https://github.com/KenaiiDev)

## Licencia

MIT
