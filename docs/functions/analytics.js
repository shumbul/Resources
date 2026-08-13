/* Privacy-friendly, cookieless analytics.
 *
 * Why: with no analytics at all there is no way to know which of the 30+ guides
 * people actually read, where they leave, or whether "Ask AI" gets used, so
 * every improvement is guesswork.
 *
 * How this stays "private by default":
 * - No cookies, no localStorage, no fingerprinting, no cross-site tracking.
 * - Nothing loads until a provider is configured below (default: none).
 * - Visitors who send Do Not Track or Global Privacy Control are never counted.
 *
 * To switch it on, set PROVIDER and SITE_ID. All three supported providers are
 * cookieless and GDPR-friendly, and none of them need a consent banner:
 *
 *   PROVIDER = 'goatcounter'  SITE_ID = 'yourcode'          (yourcode.goatcounter.com)
 *   PROVIDER = 'plausible'    SITE_ID = 'shumbul.github.io' (your Plausible domain)
 *   PROVIDER = 'umami'        SITE_ID = 'website-id-uuid'   (set UMAMI_HOST too)
 */

const PROVIDER = '';          // '' | 'goatcounter' | 'plausible' | 'umami'
const SITE_ID = '';
const UMAMI_HOST = '';        // e.g. 'https://analytics.example.com'

export function initAnalytics() {
    if (!PROVIDER || !SITE_ID) return;
    if (optedOut()) return;
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
    if (document.querySelector('script[data-analytics]')) return;

    const script = document.createElement('script');
    script.defer = true;
    script.setAttribute('data-analytics', PROVIDER);

    if (PROVIDER === 'goatcounter') {
        script.src = 'https://gc.zgo.at/count.js';
        script.setAttribute('data-goatcounter', `https://${SITE_ID}.goatcounter.com/count`);
    } else if (PROVIDER === 'plausible') {
        script.src = 'https://plausible.io/js/script.js';
        script.setAttribute('data-domain', SITE_ID);
    } else if (PROVIDER === 'umami') {
        if (!UMAMI_HOST) return;
        script.src = UMAMI_HOST.replace(/\/$/, '') + '/script.js';
        script.setAttribute('data-website-id', SITE_ID);
    } else {
        return;
    }

    script.addEventListener('error', () => console.warn('[analytics] script blocked or unavailable'));
    document.head.appendChild(script);
}

/* Count one meaningful interaction (for example the AI assistant being opened).
 * Safe to call whether or not analytics is configured. */
export function trackEvent(name) {
    if (!PROVIDER || optedOut()) return;
    try {
        if (PROVIDER === 'goatcounter' && window.goatcounter && window.goatcounter.count) {
            window.goatcounter.count({ path: 'event/' + name, title: name, event: true });
        } else if (PROVIDER === 'plausible' && typeof window.plausible === 'function') {
            window.plausible(name);
        } else if (PROVIDER === 'umami' && window.umami && window.umami.track) {
            window.umami.track(name);
        }
    } catch (err) {
        console.warn('[analytics] event failed:', err);
    }
}

function optedOut() {
    return navigator.doNotTrack === '1'
        || window.doNotTrack === '1'
        || navigator.msDoNotTrack === '1'
        || navigator.globalPrivacyControl === true;
}
