# 🍌 Nano Banana 2 + Claude Code Setup

## Estado: ✅ Configurado

El servidor MCP de Nano Banana ya está agregado a tu configuración de Claude Code.

## Cómo usarlo

### 1. Inicia Claude Code
```bash
claude
```

### 2. Verifica que Nano Banana esté disponible
Pregunta: "What tools do you have available?" 

Deberías ver:
- `generate_image` - Generar imágenes con Gemini 2.5
- `edit_image` - Editar imágenes existentes
- `continue_editing` - Continuar editando la última imagen
- `get_last_image_info` - Ver info de la última imagen

### 3. Genera imágenes para sitios web

**Ejemplo - Hero section para sitio de seguros:**
```
Generate a premium hero image for an insurance company website. 
Style: luxury, professional, deep blue gradient with golden accents.
Elements: modern building silhouette, shield icon, family silhouette.
Aspect: 16:9 landscape
```

**Ejemplo - Background 3D:**
```
Generate a futuristic abstract background with geometric shapes, 
deep navy blue and cyan gradients, floating particles effect,
perfect for tech/SaaS landing page
```

### 4. Las imágenes se guardan en:
- Windows: `%USERPROFILE%\Documents\nano-banana-images\`
- O en la carpeta del proyecto donde ejecutes Claude Code

## Workflow para crear sitios web Apple-level

1. **Genera assets** con prompts específicos para cada sección
2. **Descarga las imágenes** de la carpeta de salida
3. **Intégralas** en tu proyecto React/Vite
4. **Añade animaciones** con Framer Motion o Three.js

## Carpetas del proyecto

- `nano-banana-projects/` - Carpeta para guardar proyectos generados
- `scripts/` - Scripts de utilidad para automatización

## Troubleshooting

**Si no aparecen los tools:**
```bash
# Reinicia Claude Code completamente
claude --stop 2>/dev/null || true
claude
```

**Error de cuota de API:**
El script tiene cuota limitada. Espera ~40 segundos e intenta de nuevo.

## Recursos

- [Repo Nano Banana MCP](https://github.com/ConechoAI/Nano-Banana-MCP)
- [Documentación Gemini API](https://ai.google.dev/gemini-api/docs)