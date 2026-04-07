const shell = document.querySelector(".preview-shell");
const themeButtons = Array.from(document.querySelectorAll("[data-theme-target]"));

if (!shell) {
  throw new Error("Missing .preview-shell root for history preview.");
}

function readTheme() {
  const params = new URLSearchParams(window.location.search);
  return params.get("theme") || shell.dataset.theme || "dark";
}

function writeTheme(theme) {
  const params = new URLSearchParams(window.location.search);
  params.set("theme", theme);
  window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
}

function setTheme(theme) {
  shell.dataset.theme = theme;
  document.body.dataset.theme = theme;

  for (const button of themeButtons) {
    const active = button.dataset.themeTarget === theme;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  }

  writeTheme(theme);
}

for (const button of themeButtons) {
  button.addEventListener("click", () => setTheme(button.dataset.themeTarget || "dark"));
}

setTheme(readTheme());
