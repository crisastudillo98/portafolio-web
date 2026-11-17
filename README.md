# Portafolio — Cristian Camilo Muñoz Astudillo

Portafolio personal: AI Engineer, Data Scientist & Full-stack.

**Stack:** HTML + CSS + JS sin dependencias ni paso de build · Desplegado en Vercel

## Estructura

```
index.html          # todo el contenido (textos, proyectos, enlaces)
assets/site.css     # estilos, tonos de cada panel y animaciones
assets/site.js      # transición entre paneles, contador, entradas
assets/boot.js      # marca que hay JS antes del primer pintado
favicon.svg · og-image.png · vercel.json (cabeceras de seguridad)
```

Para editar un texto o añadir un proyecto basta con cambiar `index.html`.
Seis paneles a pantalla completa con scroll-snap vertical; respeta `prefers-reduced-motion`.
