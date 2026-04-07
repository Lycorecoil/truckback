/**
 * Elimmekatruck — JS central
 * Gère : auth JWT, appels API, routing par rôle, helpers UI
 */

const API = '/v1';

// ─── Géographie (pays + villes) ───────────────────────────────────────────────

let geoData = null;

/**
 * Charge les données pays/villes depuis le fichier JSON.
 * À appeler une seule fois au démarrage de l'app.
 */
async function loadGeo() {
  if (geoData) return geoData;
  try {
    const r = await fetch('data/geo.json');
    if (!r.ok) throw new Error(`geo.json: ${r.status}`);
    geoData = await r.json();
    return geoData;
  } catch (err) {
    console.error('Erreur chargement géographie:', err);
    return { countries: [] };
  }
}

/** Retourne le tableau de villes pour un pays donné */
function getCities(countryName) {
  if (!geoData) return [];
  const country = geoData.countries.find(c => c.name === countryName);
  return country ? country.cities : [];
}

/** Retourne la liste de tous les noms de pays */
function getCountryNames() {
  if (!geoData) return [];
  return geoData.countries.map(c => c.name);
}

/**
 * Remplit tous les <select class="country-select"> de la page.
 * @param {boolean} withAll - si true, ajoute une option "Tous" en tête (pour les filtres)
 */
function fillCountrySelects(withAll = false) {
  const countries = getCountryNames();
  if (countries.length === 0) return;

  document.querySelectorAll('select.country-select').forEach(sel => {
    const current = sel.value;
    const first = withAll
      ? '<option value="">Tous</option>'
      : '<option value="">-- Choisir --</option>';
    sel.innerHTML = first + countries.map(p =>
      `<option${current === p ? ' selected' : ''}>${p}</option>`
    ).join('');
  });
}

/**
 * Remplit un <select class="city-select"> en fonction du pays sélectionné.
 * @param {HTMLSelectElement|string} countrySelect - Le select pays ou son ID
 * @param {HTMLSelectElement|string} citySelect - Le select villes ou son ID
 * @param {boolean} withAll - si true, ajoute "Toutes" en tête (pour les filtres)
 */
function fillCitySelect(countrySelect, citySelect, withAll = false) {
  const countryEl = typeof countrySelect === 'string'
    ? document.getElementById(countrySelect) : countrySelect;
  const cityEl = typeof citySelect === 'string'
    ? document.getElementById(citySelect) : citySelect;
  if (!countryEl || !cityEl) return;

  const cities = getCities(countryEl.value);
  const first = withAll
    ? '<option value="">Toutes</option>'
    : '<option value="">-- Choisir une ville --</option>';

  if (cities.length === 0) {
    cityEl.innerHTML = first + '<option value="__custom__">✏️ Autre ville (saisie libre)</option>';
  } else {
    cityEl.innerHTML = first +
      cities.map(c => `<option>${c}</option>`).join('') +
      '<option value="__custom__">✏️ Autre ville (saisie libre)</option>';
  }

  // Cacher l'input custom s'il existe
  const customInput = cityEl.parentElement.querySelector('.custom-city-input');
  if (customInput) customInput.style.display = 'none';
}

/**
 * Bind les événements change sur tous les country-select pour mettre à jour
 * les city-select associés. Stratégie de pairing :
 *   1. Cherche un city-select dont l'ID correspond (pays→ville, Pays→Ville)
 *   2. Sinon cherche le .city-select le plus proche dans le même conteneur
 */
function bindCitySelects() {
  document.querySelectorAll('select.country-select').forEach(countrySel => {
    // Stratégie 1 : correspondance par ID
    let cityId = countrySel.id
      .replace(/pays/i, 'ville')
      .replace(/Pays/, 'Ville')
      .replace(/Depart/, 'Depart')
      .replace(/depart/, 'depart')
      .replace(/Arrivee/, 'Arrivee')
      .replace(/arrivee/, 'arrivee')
      .replace(/Base/, 'Base')
      .replace(/base/, 'base');

    let citySel = document.getElementById(cityId);

    // Stratégie 2 : chercher dans le même conteneur
    if (!citySel) {
      const container = countrySel.closest('.row, .card-body, .mb-3, form, .d-flex, .tracking-panel');
      if (container) {
        citySel = container.querySelector('.city-select');
      }
    }

    if (citySel) {
      // Remplir les villes au chargement si un pays est déjà sélectionné
      if (countrySel.value) {
        fillCitySelect(countrySel, citySel);
      }
      // Binder le changement
      countrySel.addEventListener('change', () => {
        fillCitySelect(countrySel, citySel);
      });
    }
  });

  // Gérer l'option "Autre ville (saisie libre)"
  document.addEventListener('change', (e) => {
    if (!e.target.classList.contains('city-select')) return;
    const sel = e.target;
    let customInput = sel.parentElement.querySelector('.custom-city-input');

    if (sel.value === '__custom__') {
      if (!customInput) {
        customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.className = 'form-control custom-city-input mt-1';
        customInput.placeholder = 'Nom de la ville…';
        sel.parentElement.appendChild(customInput);
        customInput.focus();
      } else {
        customInput.style.display = '';
        customInput.focus();
      }
    } else if (customInput) {
      customInput.style.display = 'none';
      customInput.value = '';
    }
  });
}

/**
 * Récupère la valeur réelle d'un city-select.
 * Si "__custom__" est sélectionné, retourne la valeur de l'input custom.
 */
function getCityValue(citySelect) {
  const el = typeof citySelect === 'string'
    ? document.getElementById(citySelect) : citySelect;
  if (!el) return '';
  if (el.value !== '__custom__') return el.value;
  const customInput = el.parentElement.querySelector('.custom-city-input');
  return customInput ? customInput.value.trim() : '';
}

// ─── Auth ────────────────────────────────────────────────────────────────────

const Auth = {
  getToken: () => localStorage.getItem('cu_token'),
  getUser:  () => { try { return JSON.parse(localStorage.getItem('cu_user')); } catch { return null; } },
  getRole:  () => Auth.getUser()?.role ?? null,
  isLoggedIn: () => !!Auth.getToken(),

  saveSession(token, user) {
    localStorage.setItem('cu_token', token);
    localStorage.setItem('cu_user', JSON.stringify(user));
  },

  logout() {
    fetch(`${API}/auth/logout`, { method: 'POST', headers: Auth.headers() }).catch(() => {});
    localStorage.removeItem('cu_token');
    localStorage.removeItem('cu_user');
    window.location.href = 'pages-sign-in.html';
  },

  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = Auth.getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },

  /** Redirige vers la bonne page si déjà connecté ET profil complet */
  redirectIfLoggedIn() {
    if (!Auth.isLoggedIn()) return;
    const role = Auth.getRole();
    if (!role) {
      // Session corrompue — on nettoie sans boucler
      localStorage.removeItem('cu_token');
      localStorage.removeItem('cu_user');
      return;
    }
    // Profil incomplet → on reste sur la page de connexion (la gate gérera après)
    if (!Auth.hasProfile()) return;
    Auth.redirectByRole();
  },

  /** Redirige vers login si pas connecté */
  requireAuth() {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'pages-sign-in.html';
      return false;
    }
    return true;
  },

  /** Retourne true si le profil entreprise est complet */
  hasProfile() {
    const user = Auth.getUser();
    return user?.role === 'ADMIN' || !!user?.orgId;
  },

  redirectByRole() {
    const role = Auth.getRole();
    if (role === 'EXPEDITEUR')       window.location.href = 'expediteur-dashboard.html';
    else if (role === 'TRANSPORTER') window.location.href = 'transporteur-dashboard.html';
    else if (role === 'ADMIN')       window.location.href = 'admin-dashboard.html';
    // Rôle inconnu : on ne redirige pas (évite la boucle infinie sur sign-in)
  }
};

// ─── API client ──────────────────────────────────────────────────────────────

const api = {
  async get(path) {
    const r = await fetch(`${API}${path}`, { headers: Auth.headers() });
    if (r.status === 401) { Auth.logout(); return null; }
    if (!r.ok) {
      console.error(`API GET ${path} failed: ${r.status} ${r.statusText}`);
      return null;
    }
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(`${API}${path}`, { method: 'POST', headers: Auth.headers(), body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw data;
    return data;
  },
  async put(path, body) {
    const r = await fetch(`${API}${path}`, { method: 'PUT', headers: Auth.headers(), body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw data;
    return data;
  },
  async delete(path, body) {
    const opts = { method: 'DELETE', headers: Auth.headers() };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const r = await fetch(`${API}${path}`, opts);
    const data = await r.json();
    if (!r.ok) throw data;
    return data;
  }
};

// ─── UI Helpers ───────────────────────────────────────────────────────────────

const UI = {
  /** Injecte les infos user dans la navbar */
  fillNavbar() {
    const user = Auth.getUser();
    if (!user) return;
    const nameEl = document.getElementById('navbar-user-name');
    const roleEl = document.getElementById('navbar-user-role');
    if (nameEl) nameEl.textContent = user.raisonSociale ?? user.email ?? '';
    if (roleEl) roleEl.textContent = user.role ?? '';

    // Logo dans la navbar
    if (user.logo) {
      const toggle = document.querySelector('.nav-link.dropdown-toggle');
      if (toggle) {
        const featherIcon = toggle.querySelector('[data-feather="user"]');
        if (featherIcon) featherIcon.replaceWith(Object.assign(document.createElement('img'), {
          src: user.logo,
          style: 'width:28px;height:28px;border-radius:50%;object-fit:cover;margin-right:6px',
          alt: 'logo',
        }));
      }
    }
  },

  /** Affiche une alerte Bootstrap dans #alert-container */
  alert(msg, type = 'danger') {
    const c = document.getElementById('alert-container');
    if (!c) return;
    c.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
  },

  /** Spinner sur un bouton */
  loading(btn, state) {
    if (state) {
      btn.dataset.orig = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Chargement...';
      btn.disabled = true;
    } else {
      btn.innerHTML = btn.dataset.orig ?? btn.innerHTML;
      btn.disabled = false;
    }
  },

  /** Badge statut expédition */
  shipmentBadge(statut) {
    const map = {
      PENDING:     { cls: 'bg-warning text-dark',  label: 'En attente' },
      PROPOSED:    { cls: 'text-white',            label: 'Proposée', style: 'background:#6f42c1' },
      ACCEPTED:    { cls: 'bg-info text-dark',    label: 'Acceptée' },
      IN_PROGRESS: { cls: 'bg-primary',           label: 'En cours' },
      DELIVERED:   { cls: 'bg-success',           label: 'Livrée' },
      CANCELLED:   { cls: 'bg-danger',            label: 'Annulée' },
    };
    const s = map[statut] ?? { cls: 'bg-secondary', label: statut };
    return `<span class="badge ${s.cls}"${s.style ? ` style="${s.style}"` : ''}>${s.label}</span>`;
  },

  /** Badge statut camion */
  truckBadge(statut) {
    const map = {
      AVAILABLE:   { cls: 'bg-success', label: 'Disponible' },
      BUSY:        { cls: 'bg-primary', label: 'En transit' },
      MAINTENANCE: { cls: 'bg-warning text-dark', label: 'Maintenance' },
    };
    const s = map[statut] ?? { cls: 'bg-secondary', label: statut };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  },

  /** Badge statut chauffeur */
  driverBadge(statut) {
    const map = {
      AVAILABLE: { cls: 'bg-success',   label: 'Disponible' },
      BUSY:      { cls: 'bg-primary',   label: 'En mission' },
      SUSPENDED: { cls: 'bg-warning text-dark', label: 'Suspendu' },
      DELETED:   { cls: 'bg-danger',    label: 'Supprimé' },
    };
    const s = map[statut] ?? { cls: 'bg-secondary', label: statut };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  },

  formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR');
  },

  toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast align-items-center text-bg-${type} border-0 show position-fixed bottom-0 end-0 m-3`;
    t.style.zIndex = 9999;
    t.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }
};

// ─── Profile Gate ────────────────────────────────────────────────────────────

const PUBLIC_PAGES = ['index.html', 'pages-sign-in.html', 'pages-sign-up.html', 'onboarding.html'];

function isPublicPage() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  return PUBLIC_PAGES.some(p => page === p);
}

function showProfileGate() {
  // Griser le contenu existant
  document.body.style.overflow = 'hidden';
  const overlay = document.createElement('div');
  overlay.id = 'profile-gate';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(15,38,64,0.75);
    backdrop-filter:blur(4px);
    display:flex;align-items:center;justify-content:center;
    padding:20px;
  `;
  overlay.innerHTML = `
    <div style="
      background:#fff;border-radius:20px;
      padding:48px 40px;max-width:480px;width:100%;
      text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,0.25);
    ">
      <div style="font-size:3.5rem;margin-bottom:16px">🏢</div>
      <h3 style="font-size:1.4rem;font-weight:800;color:#1a1a2e;margin-bottom:10px">
        Complétez votre profil
      </h3>
      <p style="color:#6c757d;font-size:0.9rem;line-height:1.7;margin-bottom:32px">
        Pour accéder à toutes les fonctionnalités de la plateforme,<br>
        vous devez d'abord renseigner les informations de votre entreprise.
      </p>
      <a href="onboarding.html" style="
        display:block;padding:15px 32px;border-radius:12px;
        background:linear-gradient(135deg,#1a7abf,#1557a0);
        color:#fff;font-weight:700;font-size:1rem;
        text-decoration:none;margin-bottom:14px;
        box-shadow:0 8px 20px rgba(26,122,191,0.35);
        transition:opacity .2s;
      " onmouseover="this.style.opacity='.9'" onmouseout="this.style.opacity='1'">
        Compléter mon profil →
      </a>
      <a href="#" onclick="Auth.logout();return false;" style="
        font-size:0.8rem;color:#adb5bd;text-decoration:none;
      ">Se déconnecter</a>
    </div>
  `;
  document.body.appendChild(overlay);
}

// Init sur toutes les pages avec sidebar
document.addEventListener('DOMContentLoaded', async () => {
  // Charger les données géographiques une seule fois
  await loadGeo();

  UI.fillNavbar();

  // Remplir les selects de pays
  fillCountrySelects();

  // Binder les selects de villes aux selects de pays
  bindCitySelects();

  // Afficher la gate si profil incomplet (hors pages publiques)
  if (!isPublicPage() && Auth.isLoggedIn() && !Auth.hasProfile()) {
    showProfileGate();
  }

  // Logout btn
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); Auth.logout(); });

  // Injecter "Mon profil" dans le dropdown si pas déjà présent
  const dropdownMenu = document.querySelector('.dropdown-menu.dropdown-menu-end');
  if (dropdownMenu && !dropdownMenu.querySelector('.profil-link')) {
    const profilLink = document.createElement('a');
    profilLink.className = 'dropdown-item profil-link';
    profilLink.href = 'profil.html';
    profilLink.innerHTML = '<i class="align-middle me-1" data-feather="settings"></i> Mon profil';
    const divider = document.createElement('div');
    divider.className = 'dropdown-divider';
    dropdownMenu.insertBefore(divider, dropdownMenu.firstChild);
    dropdownMenu.insertBefore(profilLink, dropdownMenu.firstChild);
    if (typeof feather !== 'undefined') feather.replace();
  }
});
