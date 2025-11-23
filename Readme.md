# Zombpocalypsis Terminal

Interfaz de terminal para gestion de inventarios de suministros en "Zombpocalypsis" consumiendo los datos de su [API hermana](URL_AL_REPO_DEL_BACKEND).

**[>>> Probá la terminal acá <<<](URL_A_GITHUB_PAGES_CUANDO_ESTE_DESPLEGADO)**

---

## Sobre el Proyecto

`zombpocalypsis-terminal` es una aplicación estática que simula una experiencia de terminal de los años 80/90. No es solo una demo técnica, sino la **prueba de concepto de una mecánica de juego** para un hipotético RPG de supervivencia.

El objetivo es proporcionar una interfaz inmersiva donde el jugador, a través de comandos, interactúa con el mundo del juego para:

*   Comerciar con otros supervivientes (comprar/vender).
*   Gestionar su inventario personal (la "mochila").
*   Saquear recursos de diferentes locaciones.

La elección de tecnologías livianas (HTML, CSS y JavaScript puro) es deliberada, buscando una performance óptima y reforzando la estética retro y post-apocalíptica, donde los recursos computacionales serían limitados.

### Tecnologías Utilizadas

*   HTML5
*   CSS3
*   JavaScript

---

## Features Actuales

*   **Autenticación Segura:** Comando `login` para obtener un token JWT y acceder a operaciones protegidas.
*   **Gestión de Inventario Global (CRUD):**
    *   `inventario`: Lista todos los suministros disponibles en el mundo.
    *   `inspeccionar <id>`: Muestra los detalles de un suministro específico.
    *   `crear`, `actualizar`, `eliminar`: Comandos de administración para gestionar el catálogo global de ítems.
*   **Interfaz Inmersiva:** Diseño y efectos que emulan una terminal CRT clásica.
*   **Sistema de Ayuda:** Comando `ayuda` para guiar al usuario sobre los comandos disponibles.

---

## Hoja de Ruta del Proyecto

Este proyecto se desarrolla en fases, comenzando con un Producto Mínimo Viable (MVP) y expandiéndose hacia una experiencia de juego más rica.

### Fase 1: Fundación (MVP)
*El objetivo es construir el núcleo jugable y desplegar una versión funcional.*

-   [ ] **Sistema de Contenedores (Backend):** Implementar una colección `inventarios` en Firestore que funcione como base para cualquier tipo de contenedor de ítems (mochilas, almacenes, etc.).
-   [x] **API de Mochila Personal (Backend):** Crear los endpoints (`/api/mochila`) que permitan a un usuario gestionar su propio inventario.
-   [ ] **Comandos de Jugador (Frontend):** Desarrollar los comandos `mochila`, `comprar` y `vender` para interactuar con la API.
-   [ ] **Despliegue Inicial:** Publicar la API en Vercel y la terminal en GitHub Pages para tener una versión funcional y accesible.

### Fase 2: Expansión del Mundo
*El objetivo es dar vida al entorno, poblándolo con más interacciones.*

-   [ ] **NPCs y Comerciantes:** Utilizar el sistema de contenedores para crear inventarios para Vendedores NPC.
-   [ ] **Saqueo y Descubrimiento:** Implementar el comando `saquear` para permitir a los jugadores obtener ítems de contenedores estáticos en el mundo (almacenes abandonados, vehículos, etc.).
-   [ ] **Economía Persistente:** Mover el manejo de los créditos/dinero del jugador al backend para que sea persistente entre sesiones.

### Fase 3: El Mundo Viviente
*El objetivo es profundizar en las mecánicas de RPG y la narrativa.*

-   [ ] **Sistema de Misiones:** Crear la lógica y los comandos (`misiones`, `aceptar`) para un diario de misiones.
-   [ ] **Progresión del Personaje:** Implementar comandos como `stats` y `perks` para mostrar la evolución del jugador.
-   [ ] **Comunicaciones:** Desarrollar un sistema de `radio` o `chat` para recibir mensajes de NPCs o interactuar con otros jugadores.

---

## Backend Asociado

Esta terminal no funcionaría sin su cerebro. Toda la lógica de negocio, la base de datos y la autenticación son manejadas por la **API Zombpocalypsis**, construida con Node.js, Express y Firestore.

---

## Licencia

Este proyecto está bajo la Licencia MIT. Podés ver el archivo LICENSE para más detalles.
