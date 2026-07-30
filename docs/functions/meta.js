/* Shared metadata helpers: run once, safe to call on any page. */

export function ensureMeta() {
    // Favicon: inject only if the page doesn't already declare one.
    if (!document.querySelector('link[rel="icon"]')) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = './favicon.svg';
        document.head.appendChild(link);
    }
    // Charset safety net for pages whose <meta charset> is injected late.
    if (!document.querySelector('meta[charset]')) {
        const m = document.createElement('meta');
        m.setAttribute('charset', 'UTF-8');
        document.head.insertBefore(m, document.head.firstChild);
    }
}
