/**
 * Copy text to the clipboard with a fallback for non-secure (HTTP) contexts.
 *
 * navigator.clipboard is only available in secure contexts (HTTPS / localhost).
 * When the app is served over plain HTTP (e.g. an S3 website endpoint) we fall
 * back to a hidden <textarea> + document.execCommand('copy').
 *
 * Returns true on success, false otherwise.
 */
export async function copyToClipboard(text) {
  const value = String(text ?? '');

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // fall through to the legacy approach
    }
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
