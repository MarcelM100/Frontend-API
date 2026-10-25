const API = 'https://pokeapi.co/api/v2';
const PAGE_SIZE = 12;
const cache = new Map();
let offset = 0;
let total = 0;
let searching = false;
let busy = false;
let lastAction = () => loadPage(0);

const list = document.querySelector('#pokemon-list');
const status = document.querySelector('#status');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const dialog = document.querySelector('#details');
const types = { normal: 'Normal', fire: 'Fuego', water: 'Agua', grass: 'Planta', electric: 'Eléctrico', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro', steel: 'Acero', fairy: 'Hada' };
const statNames = { hp: 'PS', attack: 'Ataque', defense: 'Defensa', 'special-attack': 'Ataque especial', 'special-defense': 'Defensa especial', speed: 'Velocidad' };

// fetch devuelve una promesa. Comprobamos el estado HTTP antes de leer el JSON.
function getJSON(url) {
  if (cache.has(url)) return Promise.resolve(cache.get(url));
  return fetch(url, { signal: AbortSignal.timeout(15000) })
    .then(response => {
      if (!response.ok) {
        throw new Error(response.status === 404
          ? 'No encontramos ese Pokémon. Revisa el nombre o el número.'
          : `La API respondió con un error (${response.status}). Intenta de nuevo.`);
      }
      return response.json();
    })
    .then(data => {
      cache.set(url, data);
      return data;
    });
}

function setBusy(value) {
  busy = value;
  list.setAttribute('aria-busy', String(value));
  document.querySelector('#search-button').disabled = value;
  document.querySelector('#reset').disabled = value;
  document.querySelector('#retry').hidden = true;
  previous.disabled = value || searching || offset === 0;
  next.disabled = value || searching || offset + PAGE_SIZE >= total;
}

// Los textos recibidos de la API se agregan como texto, nunca como HTML.
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function portrait(pokemon) {
  const wrapper = element('div', 'portrait');
  const url = pokemon.sprites.other?.['official-artwork']?.front_default || pokemon.sprites.front_default;
  if (url) {
    const image = element('img');
    image.src = url;
    image.alt = pokemon.name;
    image.addEventListener('error', () => wrapper.replaceChildren(element('span', '', 'Sin imagen')), { once: true });
    wrapper.append(image);
  } else wrapper.textContent = 'Sin imagen';
  return wrapper;
}

function badges(pokemon) {
  const wrapper = element('div', 'types');
  pokemon.types.forEach(({ type }) => {
    wrapper.append(element('span', `type type-${type.name}`, types[type.name] || type.name));
  });
  return wrapper;
}

function showDetails(pokemon) {
  const content = document.querySelector('#detail-content');
  const title = element('h2', 'pokemon-name', pokemon.name);
  title.id = 'detail-title';
  const measures = element('dl', 'measurements');
  for (const [label, value] of [['Altura', `${pokemon.height / 10} m`], ['Peso', `${pokemon.weight / 10} kg`]]) {
    const item = element('div');
    item.append(element('dt', '', label), element('dd', '', value));
    measures.append(item);
  }
  const stats = element('ul', 'stats');
  pokemon.stats.forEach(({ stat, base_stat }) => {
    const row = element('li');
    row.append(element('span', '', statNames[stat.name] || stat.name), element('strong', '', base_stat));
    stats.append(row);
  });
  content.replaceChildren(portrait(pokemon), title, badges(pokemon), measures,
    element('h3', '', 'Habilidades'),
    element('p', '', pokemon.abilities.map(item => item.ability.name.replaceAll('-', ' ')).join(', ')),
    element('h3', '', 'Estadísticas base'), stats);
  dialog.showModal();
}

function render(pokemonList) {
  list.replaceChildren();
  pokemonList.forEach(pokemon => {
    const card = element('article', 'card');
    const button = element('button', 'secondary', 'Ver detalles');
    button.setAttribute('aria-label', `Ver detalles de ${pokemon.name}`);
    button.addEventListener('click', () => showDetails(pokemon));
    card.append(element('p', 'number', `#${String(pokemon.id).padStart(3, '0')}`),
      portrait(pokemon), element('h3', 'pokemon-name', pokemon.name), badges(pokemon), button);
    list.append(card);
  });
}

function showError(error) {
  status.className = 'error';
  status.textContent = ['TimeoutError', 'TypeError'].includes(error.name)
    ? 'No se pudo conectar con PokéAPI. Revisa tu conexión e intenta de nuevo.'
    : error.message;
}

// async/await permite esperar las peticiones y manejar errores con try/catch.
async function loadPage(newOffset) {
  if (busy) return;
  searching = false;
  lastAction = () => loadPage(newOffset);
  setBusy(true);
  status.className = '';
  status.textContent = 'Cargando Pokémon…';
  list.replaceChildren();
  document.querySelector('#counter').textContent = '';
  document.querySelector('#results-title').textContent = 'Todos los Pokémon';
  try {
    const data = await getJSON(`${API}/pokemon?limit=${PAGE_SIZE}&offset=${newOffset}`);
    const pokemon = await Promise.all(data.results.map(item => getJSON(item.url)));
    offset = newOffset;
    total = data.count;
    render(pokemon);
    document.querySelector('#counter').textContent = `${offset + 1}–${offset + pokemon.length} de ${total}`;
    document.querySelector('#page').textContent = `Página ${Math.floor(offset / PAGE_SIZE) + 1}`;
    status.textContent = '';
  } catch (error) {
    showError(error);
  } finally {
    setBusy(false);
    document.querySelector('#retry').hidden = !status.classList.contains('error');
  }
}

async function searchPokemon(query) {
  if (busy) return;
  searching = true;
  lastAction = () => searchPokemon(query);
  setBusy(true);
  list.replaceChildren();
  status.className = '';
  status.textContent = 'Buscando Pokémon…';
  document.querySelector('#results-title').textContent = 'Resultado de búsqueda';
  document.querySelector('#counter').textContent = '';
  document.querySelector('#page').textContent = 'Búsqueda';
  try {
    const pokemon = await getJSON(`${API}/pokemon/${encodeURIComponent(query)}`);
    render([pokemon]);
    status.textContent = '';
    document.querySelector('#counter').textContent = '1 resultado';
  } catch (error) {
    showError(error);
  } finally {
    setBusy(false);
    document.querySelector('#retry').hidden = !status.classList.contains('error');
  }
}

document.querySelector('#search-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.querySelector('#search');
  const query = input.value.trim().toLowerCase();
  if (!query) { input.value = ''; input.reportValidity(); return; }
  searchPokemon(/^\d+$/.test(query) ? String(Number(query)) : query);
});
document.querySelector('#reset').addEventListener('click', () => {
  document.querySelector('#search-form').reset();
  loadPage(0);
});
previous.addEventListener('click', () => loadPage(Math.max(0, offset - PAGE_SIZE)));
next.addEventListener('click', () => loadPage(offset + PAGE_SIZE));
document.querySelector('#retry').addEventListener('click', () => lastAction());
loadPage(0);
