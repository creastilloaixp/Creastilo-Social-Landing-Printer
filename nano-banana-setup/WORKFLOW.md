# 🍌 Flujo de Trabajo: Nano Banana + Claude Code para Crear Sitios Web

## Objetivo
Crear sitios web premium con imágenes generadas por IA + animaciones 3D estilo Apple.

---

## Paso 1: Generar Imágenes

**Prompt para Claude Code:**
```
Genera una imagen hero para un sitio web de seguros con estilo premium: gradiente azul oscuro y dorado, familia siliconizada, edificio moderno, escudo. Aspecto 16:9.
```

**Qué hacer después:**
- Claude te dará la ruta del archivo (ej: `C:\Users\...\nano-banana-images\generated-xxx.png`)
- **Copia esa ruta**

---

## Paso 2: Crear/Actualizar Sitio Web

**Prompt para Claude Code:**
```
Crea un sitio web de seguros usando esta imagen como hero background:

Imagen: [PEGAR LA RUTA AQUÍ]

Requisitos:
- React + Vite + TypeScript
- Tailwind CSS
- La imagen como fondo del hero section
- Animaciones suaves con Framer Motion
- Diseño premium estilo Apple
- Guardar en carpeta "sitios-web/proyecto-seguros"

Después de crear, ejecuta "npm run dev" para ver el resultado.
```

---

## Errores Comunes

| Error | Solución |
|-------|----------|
| "this model does not support image input" | No intentes editar con el script. Usa Claude Code directamente para generar Y editar |
| "No images found" | Las imágenes se guardan en `%USERPROFILE%\Documents\nano-banana-images\` |

---

## Flujo Completo en una Sola Conversación

```
1. "Genera una imagen hero para sitio de seguros, estilo premium azul y dorado"

2. (Claude genera y da la ruta)

3. "Usa esa imagen para crear un sitio web con React, animaciones 3D, guarda en sitios-web/seguros-premium"

4. (Claude crea el proyecto)

5. "Ejecuta npm run dev"
```

---

## Ubicaciones

- **Imágenes generadas:** `%USERPROFILE%\Documents\nano-banana-images\`
- **Proyectos nuevos:** `C:\...\nano-banana-projects\`

---

## Video de Referencia
El flujo exacto está en: https://www.youtube.com/watch?v=bUt1WpDlI6E