# Zombpocalypsis Terminal

Interfaz de terminal para gestion de inventarios de suministros en "Zombpocalypsis" consumiendo los datos de su [API hermana](URL_AL_REPO_DEL_BACKEND).

**[>>> Probá la terminal acá <<<]((https://elmoteroloco.github.io/zombpocalypsis-terminal/))**

---

## Sobre el Proyecto

`zombpocalypsis-terminal` es una aplicación estática que simula una experiencia de terminal de los años 80/90. No es solo una demo técnica, sino una **prueba de concepto de una mecánica de juego** para un hipotético RPG de supervivencia.

El objetivo es proporcionar una interfaz inmersiva donde el jugador, a través de comandos, interactúa con el mundo del juego para:

*   Comerciar con otros supervivientes (comprar/vender).
*   Gestionar su inventario personal (la "mochila").
*   Saquear recursos de diferentes locaciones.

La elección de tecnologías livianas (HTML, CSS y JavaScript puro) es deliberada, buscando una performance óptima y reforzando una estética retro y post-apocalíptica, donde los recursos computacionales serían limitados.

---

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

## Backend Asociado

Esta terminal no funcionaría sin su cerebro. Toda la lógica de negocio, la base de datos y la autenticación son manejadas por la **API Zombpocalypsis**, construida con Node.js, Express y Firestore.

---

## Licencia

Este proyecto está bajo la Licencia MIT. Podés ver el archivo LICENSE para más detalles.

---
