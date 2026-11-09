(() => {
  const key = 'zigotos-theme-v1';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  function readPreference() {
    try { const value = localStorage.getItem(key); return value === 'dark' || value === 'light' ? value : null; }
    catch { return null; }
  }
  function applyTheme() {
    const dark = (preference || (system.matches ? 'dark' : 'light')) === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101c19' : '#173f35');
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', 'Mode sombre');
      button.title = dark ? 'Passer au mode clair' : 'Passer au mode sombre';
      button.querySelector('[data-theme-icon]').textContent = dark ? '☀' : '☾';
    });
  }
  preference = readPreference();
  applyTheme();
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch { /* Le thème reste utilisable sans stockage. */ }
      applyTheme();
    }));
  });
  system.addEventListener('change', () => { if (!preference) applyTheme(); });
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) { preference = readPreference(); applyTheme(); } });
})();
