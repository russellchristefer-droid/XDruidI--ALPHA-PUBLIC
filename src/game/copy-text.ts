/** Copy during a click. execCommand still works in the preview iframe; the async clipboard often does not. */
export function copyText(text: string): boolean {
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    if (ok) return true;
  } catch {
    // try the async clipboard below
  }
  void navigator.clipboard?.writeText(text).catch(() => {});
  return false;
}
