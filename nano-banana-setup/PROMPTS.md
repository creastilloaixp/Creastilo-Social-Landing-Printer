# Prompt para Claude Code - Crear Sitio Web Completo

Copia y pega esto en Claude Code:

---

**PARTE 1 - Generar imagen:**
```
Genera una imagen hero para un sitio web de seguros con estilo premium: gradiente azul oscuro y dorado, familia silhouette, edificio moderno, escudo. Aspecto 16:9. Sálvame la ruta del archivo.
```

**PARTE 2 - Después de que te dé la ruta, pega esto:**
```
Usa la imagen [RUTA_DEL_ARCHIVO] como fondo del hero section. Crea un sitio web completo con:

- React + Vite + TypeScript + Tailwind CSS
- Hero con la imagen de fondo + gradiente overlay
- Header con navegación
- Sección de servicios (3 cards)
- Sección de beneficios con icons
- Footer
- Animaciones con Framer Motion (fade-in, scroll)
- Diseño estilo Apple (minimal, premium)
- Guardar en: C:\Users\carlo\OneDrive\Escritorio\creastilo-agency\demos\seguros\landing-pro-app\nano-banana-projects\sitio-seguros

Después de crear ejecuta "npm run dev" y dime la URL local.
```

---

**Error que viste:** "this model does not support image input" significa que el modelo de edición de imágenes no está activo en tu cuenta. Solo usa la **generación** (no edición) y pásale la ruta a Claude Code para crear el sitio.