export function disableTransitions() {
  const { classList } = document.documentElement;
  classList.add("disable-transitions");
  setTimeout(() => classList.remove("disable-transitions"));
}
