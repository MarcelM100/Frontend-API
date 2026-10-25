# Pokédex — Frontend API

Portal web básico para consultar Pokémon desde una API pública. Desarrollado con HTML, CSS y JavaScript, siguiendo los mecanismos de consumo de servicios web del [ejemplo de clase](https://github.com/CristopherLarios/Pokemondemo).

## Ejecutar en local

Necesitas Node.js 18 o superior y conexión a internet para consultar los datos e imágenes.

```bash
git clone https://github.com/MarcelM100/Frontend-API.git
cd Frontend-API
npm start
```

Abre **http://localhost:3000**. Detén el servidor con `Ctrl+C`.
No requiere `npm install`: el servidor usa únicamente módulos incluidos en Node.js.

## Funcionalidades

- Listado con 12 Pokémon por página y navegación anterior/siguiente.
- Búsqueda por nombre completo en inglés o número (por ejemplo, `pikachu` o `25`).
- Detalles con imagen, tipos en español, altura, peso, habilidades y estadísticas.
- Mensajes de carga, errores de conexión, búsqueda sin resultados y botón para reintentar.
- Diseño adaptable a celulares y computadoras.

## Consumo de la API

Se utiliza [PokéAPI v2](https://pokeapi.co/docs/v2), pública y sin clave de acceso:

```text
GET https://pokeapi.co/api/v2/pokemon?limit=12&offset=0
GET https://pokeapi.co/api/v2/pokemon/pikachu
```

En `js/app.js`, `getJSON()` realiza peticiones con `fetch`, comprueba `response.ok` y convierte la respuesta con `response.json()`. Utiliza promesas con `.then()`. `loadPage()` y `searchPokemon()` usan `async/await` y `try/catch/finally` para cargar datos y controlar errores. `Promise.all()` consulta los detalles del listado en paralelo.

Los resultados se guardan en memoria durante la sesión para evitar repetir peticiones. Al recargar la página se limpia esa memoria. Los datos se muestran mediante el DOM y `textContent`. Las habilidades y nombres se conservan como los entrega la API, en inglés.

## Archivos

```text
index.html       Estructura del portal
css/styles.css   Estilos y adaptación a móviles
js/app.js        Peticiones, búsqueda, paginación y detalles
server.js        Servidor local de archivos estáticos
package.json     Comando npm start y verificación de sintaxis
```

Para comprobar la sintaxis del JavaScript: `npm run check`.

El proyecto no requiere base de datos, registro de usuario ni variables de entorno. El servidor local solo entrega los archivos; el navegador consulta directamente PokéAPI. Pokémon y sus imágenes pertenecen a sus respectivos propietarios. Proyecto con fines educativos.
