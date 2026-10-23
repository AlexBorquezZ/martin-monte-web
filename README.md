# Tu sitio web — Lic. Martín Monte
## Guía de edición (para no técnicos)

---

## ¿Cómo ver el sitio en tu computadora?

1. Abrí la carpeta **martin-monte**
2. Hacé doble clic en **index.html**
3. Se va a abrir en tu navegador (Chrome, Firefox, Edge — cualquiera sirve)

Eso es todo. No necesitás instalar nada.

---

## ¿Cómo subir el sitio a Hostinger?

1. Entrá a tu cuenta de Hostinger: **hpanel.hostinger.com**
2. Hacé clic en **"Administrar"** en tu hosting
3. En el menú lateral, buscá **"Administrador de archivos"** (File Manager)
4. Navegá hasta la carpeta **public_html**
5. Arrastrá TODA la carpeta **martin-monte** (o el contenido de adentro) al panel
6. Esperá que suba (puede tardar 1-2 minutos)
7. Abrí tu dominio en el navegador — ya debería verse el sitio

> ⚠️ Si ves una página en blanco, asegurate de que el archivo **index.html** está directamente dentro de **public_html**, no en una subcarpeta.

---

## ¿Cómo cambiar los textos, número de WhatsApp, precio, etc.?

Abrí el archivo **lib/manifest.js** con el **Bloc de notas** (click derecho → Abrir con → Bloc de notas).

Vas a ver algo así:

```
nombre:       "Lic. Martín Monte",
whatsapp:     "5492615550000",
sesion_precio:"$25.000 ARS",
```

Cambiá solo lo que está entre comillas **""**. Por ejemplo:
- Para cambiar el precio: buscá `sesion_precio` y cambiá el número
- Para cambiar el WhatsApp: buscá `whatsapp` y ponés tu número sin espacios, sin +, empezando con 549...
  - Ejemplo correcto: `"5492615501234"`
- Para cambiar los testimonios: bajá hasta la sección `testimonios` y editá el texto y las iniciales

Guardá el archivo (Ctrl+S) y ya está.

---

## ¿Cómo cambiar el link de Mercado Pago?

En el mismo archivo **lib/manifest.js**, buscá la línea:

```
mp_link: "https://mpago.la/TU_LINK_AQUI",
```

Reemplazá `TU_LINK_AQUI` con el link de cobro de tu seña en Mercado Pago.

Para obtener ese link: entrá a tu cuenta de Mercado Pago → Cobrar → Crear link de pago → ingresá el monto de la seña ($12.500 si la sesión vale $25.000) → copiá el link que te da.

---

## ¿Cómo cambiar la foto de perfil?

1. Tomá tu foto nueva y guardala con el nombre exacto: **perfil.jpg** (o perfil.webp si la convertiste)
2. Abrí la carpeta **assets → img**
3. Reemplazá el archivo **perfil.jpg** por tu foto nueva (mismo nombre)
4. Para la foto del consultorio, el archivo se llama **consultorio.jpg**

> 💡 El sitio muestra un placeholder gris si no encuentra la foto — no se rompe, pero se ve mejor con foto real.

---

## ¿Cómo cambiar el mapa de Google Maps?

1. Andá a **maps.google.com**
2. Buscá tu dirección
3. Hacé clic en **Compartir → Incorporar un mapa**
4. Copiá el código que dice `<iframe src="https://www.google.com/maps/embed?...`
5. Abrí **lib/manifest.js** con el Bloc de notas
6. Buscá la línea `mapa_embed:` y reemplazá el link largo de adentro

---

## ¿Qué hacer si cambié algo y no se actualiza?

Esto pasa por el **caché** del navegador. Solución:

- Presioná **Ctrl + Shift + R** (Windows) o **Cmd + Shift + R** (Mac)
- O abrí una ventana incógnita y escribí tu dominio ahí

Si subiste algo a Hostinger y no aparece, esperá 2-3 minutos y recargá.

---

## Estructura de archivos (referencia)

```
martin-monte/
├── index.html          ← El sitio entero
├── styles.css          ← Los estilos (colores, tipografías)
├── main.js             ← Las animaciones e interacciones
├── .htaccess           ← Configuración del servidor
├── README.md           ← Esta guía
├── lib/
│   ├── manifest.js     ← ⭐ TUS DATOS (editá acá)
│   ├── gsap.min.js     ← Librería de animaciones
│   └── ScrollTrigger.min.js
└── assets/
    └── img/
        ├── perfil.jpg      ← ⭐ TU FOTO DE PERFIL
        └── consultorio.jpg ← ⭐ TU FOTO DEL CONSULTORIO
```

---

## ¿Tenés dudas?

Si algo no funciona o querés hacer un cambio más grande, contactá a quien te hizo el sitio.

Para cambios menores (texto, precio, foto, WhatsApp, link de pago), esta guía cubre todo.

---

*Sitio desarrollado para Lic. Martín Monte — Psicólogo Clínico · Mendoza*

---

## Aplicación RITMO (carpeta `ritmo/`)

La carpeta **`ritmo/`** contiene una aplicación independiente (PWA de hábitos personales) que no modifica este sitio. Sus instrucciones completas están en [`ritmo/README.md`](ritmo/README.md).
