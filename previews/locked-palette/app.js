const appShell = document.querySelector(".app-shell");

if (!appShell) {
  throw new Error("Missing .app-shell root for locked palette preview.");
}

const screenButtons = Array.from(document.querySelectorAll("[data-screen-target]"));
const themeButtons = Array.from(document.querySelectorAll("[data-theme-target]"));
const screenPanels = Array.from(document.querySelectorAll("[data-screen-panel]"));
const tokenLabels = {
  teal: document.getElementById("teal-token"),
  gold: document.getElementById("gold-token"),
  blue: document.getElementById("blue-token"),
};

const themeTokens = {
  dark: {
    teal: "#5ebaa9",
    gold: "#c4a46c",
    blue: "#78a0c8",
  },
  light: {
    teal: "#3a9e8a",
    gold: "#b8965a",
    blue: "#6090c0",
  },
};

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  return {
    screen: params.get("screen"),
    theme: params.get("theme"),
  };
}

function writeUrlState() {
  const params = new URLSearchParams(window.location.search);
  params.set("screen", appShell.dataset.screen || "home");
  params.set("theme", appShell.dataset.theme || "dark");

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", nextUrl);
}

function syncActiveState(buttons, activeValue, attributeName) {
  for (const button of buttons) {
    const isActive = button.dataset[attributeName] === activeValue;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }
}

function updateTokens(theme) {
  const tokens = themeTokens[theme] ?? themeTokens.dark;
  tokenLabels.teal.textContent = tokens.teal;
  tokenLabels.gold.textContent = tokens.gold;
  tokenLabels.blue.textContent = tokens.blue;
}

function replayScreenAnimations(panel) {
  const staggeredNodes = panel.querySelectorAll(".stagger");

  for (const node of staggeredNodes) {
    node.classList.remove("stagger");
  }

  // Force layout so the same animation can replay on each screen switch.
  void panel.offsetWidth;

  for (const node of staggeredNodes) {
    node.classList.add("stagger");
  }
}

function setTheme(theme) {
  appShell.dataset.theme = theme;
  document.body.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  syncActiveState(themeButtons, theme, "themeTarget");
  updateTokens(theme);
  writeUrlState();
}

function setScreen(screen) {
  appShell.dataset.screen = screen;

  for (const panel of screenPanels) {
    const isVisible = panel.dataset.screenPanel === screen;
    panel.classList.toggle("is-hidden", !isVisible);

    if (isVisible) {
      replayScreenAnimations(panel);
    }
  }

  syncActiveState(screenButtons, screen, "screenTarget");
  writeUrlState();
}

for (const button of screenButtons) {
  button.addEventListener("click", () => setScreen(button.dataset.screenTarget));
}

for (const button of themeButtons) {
  button.addEventListener("click", () => setTheme(button.dataset.themeTarget));
}

const urlState = readUrlState();
const initialTheme = urlState.theme || appShell.dataset.theme || "dark";
const initialScreen = urlState.screen || appShell.dataset.screen || "home";

setTheme(initialTheme);
setScreen(initialScreen);
