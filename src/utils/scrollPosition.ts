export function saveScrollPosition() {
  sessionStorage.setItem("scrollPosition", window.scrollY.toString());
}

export function restoreScrollPosition() {
  const savedPosition = sessionStorage.getItem("scrollPosition");
  if (savedPosition) {
    window.scrollTo(0, Number.parseInt(savedPosition, 10));
    sessionStorage.removeItem("scrollPosition");
  }
}
