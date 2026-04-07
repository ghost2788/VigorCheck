const shell = document.querySelector(".preview-shell");
const themeButtons = document.querySelectorAll("[data-theme-target]");

function applyTheme(nextTheme) {
  if (!shell) {
    return;
  }

  shell.setAttribute("data-theme", nextTheme);

  themeButtons.forEach((button) => {
    const isActive = button.getAttribute("data-theme-target") === nextTheme;
    button.classList.toggle("is-active", isActive);
  });
}

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextTheme = button.getAttribute("data-theme-target");

    if (!nextTheme) {
      return;
    }

    applyTheme(nextTheme);
  });
});

applyTheme("dark");
