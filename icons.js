(() => {
  const names = new Set(["waves","sailboat","tree-pine","flag","mountain","footprints","sunset","sparkles","house","calendar","euro","external-link","pencil","check","x","trash-2","plus","arrow-up","arrow-down","arrow-right","maximize","minimize","map-pin","sun","cloud","cloud-fog","cloud-lightning","cloud-snow","cloud-rain"]);
  const legacy = {"🏊":"waves","🏄":"sailboat","🛶":"sailboat","🌲":"tree-pine","⛳":"flag","⛰":"mountain","🥾":"footprints","🌅":"sunset","✨":"sparkles"};
  const icon = name => {
    name = legacy[name] || name;
    if (!names.has(name)) name = "map-pin";
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="assets/vendor/lucide/sprite.svg#' + name + '"></use></svg>';
  };
  const create = name => { const template = document.createElement("template"); template.innerHTML = icon(name); return template.content.firstChild; };
  window.TripIcons = { icon, create };
  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-icon]").forEach(element => element.replaceChildren(create(element.dataset.icon))));
})();
