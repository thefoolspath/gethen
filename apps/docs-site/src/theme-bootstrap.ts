(() => {
  const storageKey = "gethen-docs-theme";
  const storedTheme = window.localStorage.getItem(storageKey);
  const mode = storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
})();
