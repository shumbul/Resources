/* Context-aware AI assistant, moved into functions/. Call initAssistant() once. */
/*
 * Context-aware AI assistant, self-contained.
 * Drop into any page with:  <script src="./components/ai-assistant.js" defer></script>
 *
 * - Runs a small model fully in the browser via WebLLM (WebGPU). Free, private, no server.
 * - Falls back to bring-your-own-key for any OpenAI-compatible provider (Groq, OpenRouter...).
 * - Reads the current page's main text so answers are grounded in the guide you're reading.
 */
export function initAssistant() {
    if (window.__aiAssistantLoaded) return;
    window.__aiAssistantLoaded = true;

    const WEBLLM_URL = 'https://esm.run/@mlc-ai/web-llm';
    const DEFAULT_MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
    const BYOK_KEY = 'ai_tools_byok';

    // Set this to your deployed Cloudflare Worker URL (see worker/README.md).
    // When set, the assistant works for every visitor with no key and no GPU.
    // Leave '' to disable the shared proxy and fall back to on-device / own key.
    const SHARED_PROXY_URL = 'https://resources-ai.shumbul-resources.workers.dev';

    let engine = null;
    let loading = false;

    // Which backend will handle requests, in priority order.
    function mode() {
        if (byok().key) return 'byok';       // visitor's own key wins (offloads your quota)
        if (SHARED_PROXY_URL) return 'proxy'; // zero-setup shared worker, works everywhere
        return 'ondevice';                    // local WebGPU model
    }

    // ---------- styles ----------
    const css = `
    .ai-fab{position:fixed;right:20px;bottom:20px;z-index:9998;display:inline-flex;align-items:center;gap:.55rem;
        padding:.7rem 1.05rem;border:none;border-radius:999px;cursor:pointer;font:600 .95rem/1 Inter,Segoe UI,sans-serif;
        color:#fff;background:linear-gradient(135deg,var(--primary,#8b5cf6),var(--secondary,#7c3aed));
        box-shadow:0 8px 24px rgba(124,58,237,.45);
        transition:transform .2s ease, box-shadow .2s ease;
        animation:aiFabBreathe 2.8s ease-in-out infinite;}
    /* breathing glow: shadow expands and contracts */
    @keyframes aiFabBreathe{
        0%,100%{box-shadow:0 8px 24px rgba(124,58,237,.45),
                            0 0 0 0 rgba(124,58,237,.30);}
        50%    {box-shadow:0 10px 30px rgba(124,58,237,.60),
                            0 0 22px 6px rgba(124,58,237,.22);}
    }
    /* expanding halo ring that pulses outward */
    .ai-fab::after{content:'';position:absolute;inset:0;border-radius:999px;
        border:2px solid rgba(124,58,237,.55);pointer-events:none;
        animation:aiFabRipple 2.8s ease-out infinite;}
    @keyframes aiFabRipple{
        0%  {transform:scale(1);opacity:.55;}
        70% {transform:scale(1.28);opacity:0;}
        100%{transform:scale(1.28);opacity:0;}
    }
    /* pause the attention animation once hovered or focused */
    .ai-fab:hover,.ai-fab:focus-visible{transform:translateY(-2px);
        box-shadow:0 12px 30px rgba(124,58,237,.55);animation:none;}
    .ai-fab:hover::after,.ai-fab:focus-visible::after{animation:none;opacity:0;}
    /* stop drawing attention while the panel is open */
    .ai-fab.is-quiet{animation:none;}
    .ai-fab.is-quiet::after{animation:none;opacity:0;}
    .ai-fab .spark{font-size:1.1rem;filter:drop-shadow(0 0 6px rgba(255,255,255,.6));
        animation:aiSparkGlow 2.8s ease-in-out infinite;}
    @keyframes aiSparkGlow{
        0%,100%{filter:drop-shadow(0 0 6px rgba(255,255,255,.6));transform:scale(1);}
        50%    {filter:drop-shadow(0 0 11px rgba(255,255,255,.95));transform:scale(1.12);}
    }
    @media (prefers-reduced-motion:reduce){
        .ai-fab,.ai-fab .spark{animation:none;}
        .ai-fab::after{animation:none;opacity:0;}
    }
    .ai-panel{position:fixed;right:20px;bottom:84px;z-index:9999;width:min(400px,calc(100vw - 40px));
        height:min(560px,calc(100vh - 120px));display:none;flex-direction:column;overflow:hidden;
        border-radius:18px;border:1px solid rgba(255,255,255,.14);
        background:var(--bg-primary,#fff);color:var(--text-primary,#111);
        box-shadow:0 24px 60px rgba(2,6,23,.35);backdrop-filter:blur(14px);}
    .ai-panel.open{display:flex;animation:aiUp .22s ease;}
    @keyframes aiUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
    .ai-head{padding:.85rem 1rem;display:flex;align-items:center;gap:.6rem;
        background:linear-gradient(135deg,var(--primary,#8b5cf6),var(--secondary,#7c3aed));color:#fff;}
    .ai-head b{font:700 1rem/1.2 Inter,Segoe UI,sans-serif;}
    .ai-head .st{margin-left:auto;font-size:.72rem;opacity:.9;display:flex;align-items:center;gap:.35rem;}
    .ai-head .dot{width:8px;height:8px;border-radius:50%;background:#fca5a5;box-shadow:0 0 6px currentColor;}
    .ai-head.ready .dot{background:#86efac;}
    .ai-x{background:transparent;border:none;color:#fff;font-size:1.1rem;cursor:pointer;opacity:.85;padding:0 .2rem;}
    .ai-body{flex:1;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.7rem;
        background:var(--bg-secondary,#f9fafb);}
    .ai-msg{max-width:88%;padding:.6rem .8rem;border-radius:14px;font:400 .9rem/1.5 Inter,Segoe UI,sans-serif;}
    .ai-msg.user{align-self:flex-end;background:var(--primary,#8b5cf6);color:#fff;border-bottom-right-radius:4px;white-space:pre-wrap;}
    .ai-msg.bot{align-self:flex-start;background:var(--bg-primary,#fff);border:1px solid var(--border,#e5e7eb);
        color:var(--text-primary,#111);border-bottom-left-radius:4px;}
    .ai-msg.bot p{margin:0 0 .5rem;} .ai-msg.bot p:last-child{margin-bottom:0;}
    .ai-msg.bot .ai-h{display:block;margin:.5rem 0 .25rem;font-size:.95rem;} .ai-msg.bot .ai-h:first-child{margin-top:0;}
    .ai-msg.bot ul,.ai-msg.bot ol{margin:.25rem 0 .5rem;padding-left:1.25rem;} .ai-msg.bot li{margin:.15rem 0;}
    .ai-msg.bot code{background:var(--bg-tertiary,#eef1f8);border-radius:5px;padding:.05rem .35rem;
        font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.85em;}
    .ai-msg.bot a{color:var(--primary,#7c3aed);text-decoration:underline;}
    .ai-msg.bot br{line-height:.5;}
    .ai-chips{display:flex;flex-wrap:wrap;gap:.4rem;padding:.6rem 1rem 0;}
    .ai-chip{font:500 .78rem/1 Inter,Segoe UI,sans-serif;padding:.45rem .7rem;border-radius:999px;cursor:pointer;
        background:var(--bg-tertiary,#f1f5f9);color:var(--text-secondary,#555);border:1px solid var(--border,#e5e7eb);}
    .ai-chip:hover{color:var(--primary,#8b5cf6);border-color:var(--primary,#8b5cf6);}
    .ai-foot{padding:.7rem 1rem 1rem;display:flex;flex-direction:column;gap:.5rem;background:var(--bg-secondary,#f9fafb);}
    .ai-inrow{display:flex;gap:.5rem;}
    .ai-in{flex:1;resize:none;min-height:42px;max-height:120px;padding:.6rem .7rem;border-radius:12px;
        border:1px solid var(--border,#e5e7eb);background:var(--bg-primary,#fff);color:var(--text-primary,#111);
        font:400 .9rem/1.4 Inter,Segoe UI,sans-serif;}
    .ai-send{border:none;border-radius:12px;padding:0 .95rem;cursor:pointer;color:#fff;font-weight:600;
        background:linear-gradient(135deg,var(--primary,#8b5cf6),var(--secondary,#7c3aed));}
    .ai-send:disabled{opacity:.5;cursor:not-allowed;}
    .ai-mic{border:1px solid var(--border,#e5e7eb);border-radius:12px;width:42px;flex:0 0 42px;
        cursor:pointer;background:var(--bg-primary,#fff);font-size:1.05rem;line-height:1;
        display:inline-flex;align-items:center;justify-content:center;position:relative;
        transition:background .18s ease,border-color .18s ease,transform .18s ease;}
    .ai-mic:hover{border-color:var(--primary,#8b5cf6);background:var(--bg-tertiary,#f1f5f9);}
    .ai-mic:focus-visible{outline:2px solid var(--primary,#8b5cf6);outline-offset:2px;}
    .ai-mic[hidden]{display:none;}
    .ai-mic.rec{border-color:#ef4444;background:rgba(239,68,68,.10);
        animation:aiMicPulse 1.3s ease-in-out infinite;}
    @keyframes aiMicPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.45);}
        70%{box-shadow:0 0 0 9px rgba(239,68,68,0);}}
    .ai-mic.rec::after{content:'';position:absolute;top:5px;right:5px;width:6px;height:6px;
        border-radius:50%;background:#ef4444;}
    @media (prefers-reduced-motion:reduce){.ai-mic.rec{animation:none;}}
    .ai-note{font:400 .72rem/1.4 Inter,Segoe UI,sans-serif;color:var(--text-secondary,#777);}
    .ai-note a{color:var(--primary,#8b5cf6);cursor:pointer;text-decoration:underline;}
    .ai-byok{display:none;flex-direction:column;gap:.4rem;padding:.4rem 0;}
    .ai-byok input{padding:.5rem .6rem;border-radius:10px;border:1px solid var(--border,#e5e7eb);
        background:var(--bg-primary,#fff);color:var(--text-primary,#111);font:400 .82rem/1 Inter,sans-serif;}
    @media (max-width:480px){.ai-panel{right:10px;left:10px;width:auto;bottom:78px;}}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // ---------- page context ----------
    function pageContext() {
        const main = document.querySelector('main') || document.body;
        let text = (main.innerText || '').replace(/\s+/g, ' ').trim();
        if (text.length > 6000) text = text.slice(0, 6000);
        const title = document.title.replace(/\|.*$/, '').trim();
        return { title, text };
    }

    function suggestChips(title) {
        const t = title.toLowerCase();
        if (t.includes('linkedin')) return ['Rewrite my headline', 'Draft my About section', 'Improve a project bullet'];
        if (t.includes('git')) return ['Explain this like I am new', 'What is the everyday workflow?', 'When do I use rebase vs merge?'];
        if (t.includes('roadmap') && t.includes('ai')) return ['Make me a week-1 plan', 'Explain month 3 simply', 'Suggest a capstone project'];
        if (t.includes('12') || t.includes('week')) return ['Tailor week 1 to my role', 'Give me resources for week 4', 'Turn this into a checklist'];
        if (t.includes('job') || t.includes('hunt')) return ['Rewrite a resume bullet', 'Draft an outreach message', 'Build my weekend plan'];
        if (t.includes('companies') || t.includes('models')) return ['Quiz me on business models', 'Explain Amazon\'s model', 'Analyze a company I name'];
        return ['Summarize this page', 'Make this a checklist', 'Explain the key idea simply'];
    }

    // ---------- markup ----------
    const ctx = pageContext();
    const fab = document.createElement('button');
    fab.className = 'ai-fab';
    fab.innerHTML = '<span class="spark">✦</span> Ask AI';
    fab.setAttribute('aria-label', 'Open AI assistant');

    const panel = document.createElement('div');
    panel.className = 'ai-panel';
    panel.innerHTML = `
      <div class="ai-head" id="aiHead">
        <span class="spark">✦</span><b>AI helper</b>
        <span class="st"><span class="dot"></span><span id="aiStatus">on-device, off</span></span>
        <button class="ai-x" id="aiClose" aria-label="Close">✕</button>
      </div>
      <div class="ai-body" id="aiBody">
        <div class="ai-msg bot">Hey there! 👋 I'm here to help you get the most out of <b>${ctx.title || 'this guide'}</b>. I've read this page, so feel free to ask me to tailor it to you, rewrite something, or explain a tricky bit. I run right on your device for free, no sign-up needed.</div>
      </div>
      <div class="ai-chips" id="aiChips"></div>
      <div class="ai-foot">
        <div class="ai-inrow">
          <textarea class="ai-in" id="aiIn" placeholder="Ask about this page..."></textarea>
          <button class="ai-mic" id="aiMic" type="button" title="Speak your question" aria-label="Speak your question">&#127908;</button>
          <button class="ai-send" id="aiSend">Send</button>
        </div>
        <div class="ai-note" id="aiNote">First message loads a small model (a one-time download). <a id="aiByokToggle">Use my own key instead</a></div>
        <div class="ai-byok" id="aiByok">
          <div class="ai-note">Free option: create a key at <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a> (Groq has a free tier), then paste it below. It is stored only in this browser.</div>
          <input id="aiBase" placeholder="Base URL (default https://api.groq.com/openai/v1)">
          <input id="aiModel" placeholder="Model (default llama-3.1-8b-instant)">
          <input id="aiKey" type="password" placeholder="API key (stored only in this browser)">
          <button class="ai-send" id="aiKeySave" style="padding:.5rem;">Save key</button>
        </div>
      </div>`;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const $ = (id) => panel.querySelector('#' + id);
    const body = $('aiBody'), head = $('aiHead'), statusEl = $('aiStatus');
    const input = $('aiIn'), send = $('aiSend');

    // chips
    const chipWrap = $('aiChips');
    suggestChips(ctx.title).forEach((label) => {
        const c = document.createElement('span');
        c.className = 'ai-chip';
        c.textContent = label;
        c.onclick = () => { input.value = label; ask(); };
        chipWrap.appendChild(c);
    });

    function syncFabState() {
        const open = panel.classList.contains('open');
        fab.classList.toggle('is-quiet', open);
        fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    // ---------- voice input (Web Speech API, on-device in most browsers) ----------
    (function setupMic() {
        const mic = $('aiMic');
        if (!mic) return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { mic.hidden = true; return; }   // unsupported, hide rather than break

        const rec = new SR();
        rec.lang = document.documentElement.lang || 'en-US';
        rec.interimResults = true;
        rec.continuous = false;
        rec.maxAlternatives = 1;

        let listening = false;
        let baseText = '';

        function setListening(on) {
            listening = on;
            mic.classList.toggle('rec', on);
            mic.setAttribute('aria-label', on ? 'Stop listening' : 'Speak your question');
            mic.title = on ? 'Listening, click to stop' : 'Speak your question';
            if (on) input.setAttribute('placeholder', 'Listening...');
            else input.setAttribute('placeholder', 'Ask about this page...');
        }

        mic.addEventListener('click', () => {
            if (listening) { rec.stop(); return; }
            baseText = input.value.trim();
            try { rec.start(); } catch (_) { /* already started */ }
        });

        rec.onstart = () => setListening(true);

        rec.onresult = (e) => {
            let txt = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                txt += e.results[i][0].transcript;
            }
            input.value = (baseText ? baseText + ' ' : '') + txt.trim();
            input.dispatchEvent(new Event('input', { bubbles: true }));
        };

        rec.onerror = (e) => {
            setListening(false);
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
                input.setAttribute('placeholder', 'Microphone blocked. Allow access in your browser.');
                setTimeout(() => input.setAttribute('placeholder', 'Ask about this page...'), 4000);
            }
        };

        rec.onend = () => {
            setListening(false);
            input.focus();
        };

        // stop listening if the panel closes
        panel.addEventListener('transitionend', () => {
            if (!panel.classList.contains('open') && listening) rec.stop();
        });
    })();

    fab.onclick = () => {
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) input.focus();
        syncFabState();
    };
    $('aiClose').onclick = () => { panel.classList.remove('open'); syncFabState(); };
    syncFabState();

    // BYOK
    function byok() { try { return JSON.parse(localStorage.getItem(BYOK_KEY) || '{}'); } catch { return {}; } }
    $('aiByokToggle').onclick = () => {
        const el = $('aiByok');
        el.style.display = el.style.display === 'flex' ? 'none' : 'flex';
        const b = byok(); if (b.base) $('aiBase').value = b.base; if (b.model) $('aiModel').value = b.model;
    };
    $('aiKeySave').onclick = () => {
        const b = {
            base: ($('aiBase').value.trim() || 'https://api.groq.com/openai/v1'),
            model: ($('aiModel').value.trim() || 'llama-3.1-8b-instant'),
            key: ($('aiKey').value.trim() || byok().key || ''),
        };
        if (!b.key) { setStatus('enter a key'); return; }
        localStorage.setItem(BYOK_KEY, JSON.stringify(b));
        $('aiKey').value = ''; $('aiByok').style.display = 'none';
        setStatus('key saved'); head.classList.add('ready');
    };

    function setStatus(s) { statusEl.textContent = s; }
    // Render a safe subset of Markdown. We escape all HTML first, then re-introduce
    // ONLY a known set of tags, so untrusted model/proxy output can't inject HTML.
    function renderMarkdown(src) {
        let s = String(src).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const codes = [];
        s = s.replace(/`([^`\n]+)`/g, (_, c) => { codes.push(c); return '\u0000' + (codes.length - 1) + '\u0000'; });
        s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
        s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        const out = [];
        let list = null; // 'ul' | 'ol'
        const closeList = () => { if (list) { out.push('</' + list + '>'); list = null; } };
        s.split('\n').forEach((line) => {
            const t = line.trim();
            let m;
            if ((m = t.match(/^#{1,6}\s+(.*)$/))) { closeList(); out.push('<strong class="ai-h">' + m[1] + '</strong>'); return; }
            if ((m = t.match(/^[-*]\s+(.*)$/))) { if (list !== 'ul') { closeList(); list = 'ul'; out.push('<ul>'); } out.push('<li>' + m[1] + '</li>'); return; }
            if ((m = t.match(/^\d+\.\s+(.*)$/))) { if (list !== 'ol') { closeList(); list = 'ol'; out.push('<ol>'); } out.push('<li>' + m[1] + '</li>'); return; }
            closeList();
            if (t === '') out.push('<br>'); else out.push('<p>' + line + '</p>');
        });
        closeList();
        let html = out.join('');
        html = html.replace(/\u0000(\d+)\u0000/g, (_, i) => '<code>' + codes[+i] + '</code>');
        return html;
    }

    // Set/stream text into a bot bubble as rendered Markdown; keeps the raw text
    // on the node so streaming chunks re-render cleanly. User text stays literal.
    function setBotContent(el, raw) {
        el._raw = raw;
        el.innerHTML = renderMarkdown(raw);
        body.scrollTop = body.scrollHeight;
    }
    function appendBotChunk(el, chunk) {
        setBotContent(el, (el._raw || '') + chunk);
    }

    function addMsg(role, text) {
        const d = document.createElement('div');
        d.className = 'ai-msg ' + (role === 'user' ? 'user' : 'bot');
        if (role === 'user') d.textContent = text;
        else setBotContent(d, text);
        body.appendChild(d); body.scrollTop = body.scrollHeight;
        return d;
    }

    class NeedKeyError extends Error {}

    async function ensureEngine() {
        // Proxy and BYOK need no local engine.
        if (mode() !== 'ondevice') return;
        if (engine) return;

        // Robust WebGPU detection: navigator.gpu can exist but have no usable adapter.
        let adapter = null;
        if ('gpu' in navigator) {
            try { adapter = await navigator.gpu.requestAdapter(); } catch { adapter = null; }
        }
        if (!adapter) {
            throw new NeedKeyError('This device cannot run the on-device model (no compatible WebGPU GPU). No problem, you can still use this for free: click "Use my own key instead" and paste a free Groq key. I opened it for you below.');
        }

        if (loading) return;
        loading = true;
        setStatus('loading model...');
        try {
            const { CreateMLCEngine } = await import(WEBLLM_URL);
            engine = await CreateMLCEngine(DEFAULT_MODEL, {
                initProgressCallback: (p) => setStatus('loading ' + Math.round((p.progress || 0) * 100) + '%'),
            });
            setStatus('ready, on-device'); head.classList.add('ready');
        } catch (e) {
            setStatus('on-device unavailable');
            throw new NeedKeyError('The on-device model could not start on this device. You can still use this for free: click "Use my own key instead" and paste a free Groq key. I opened it for you below.');
        } finally {
            loading = false;
        }
    }

    function openByok() {
        $('aiByok').style.display = 'flex';
        const b = byok(); if (b.base) $('aiBase').value = b.base; if (b.model) $('aiModel').value = b.model;
    }

    // Read an OpenAI-style SSE stream from a fetch Response into the target element.
    async function pipeSSE(res, target) {
        if (!res.ok || !res.body) throw new Error('Provider error ' + res.status + ': ' + (await res.text().catch(() => res.statusText)));
        const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
        while (true) {
            const { value, done } = await reader.read(); if (done) break;
            buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop();
            for (const line of lines) {
                const t = line.trim(); if (!t.startsWith('data:')) continue;
                const data = t.slice(5).trim(); if (data === '[DONE]') return;
                try { const j = JSON.parse(data); const d = j.choices?.[0]?.delta?.content || ''; if (d) { appendBotChunk(target, d); } } catch {}
            }
        }
    }

    async function stream(messages, target) {
        const m = mode();
        if (m === 'ondevice') {
            const chunks = await engine.chat.completions.create({ messages, temperature: 0.7, max_tokens: 700, stream: true });
            for await (const c of chunks) { const d = c.choices?.[0]?.delta?.content || ''; if (d) { appendBotChunk(target, d); } }
            return;
        }
        if (m === 'proxy') {
            const res = await fetch(SHARED_PROXY_URL, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, temperature: 0.7, max_tokens: 700, stream: true }),
            });
            await pipeSSE(res, target);
            return;
        }
        // byok
        const b = byok();
        const res = await fetch(b.base.replace(/\/$/, '') + '/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + b.key },
            body: JSON.stringify({ model: b.model, messages, temperature: 0.7, max_tokens: 700, stream: true }),
        });
        await pipeSSE(res, target);
    }

    async function ask() {
        const q = input.value.trim(); if (!q) return;
        input.value = ''; send.disabled = true;
        addMsg('user', q);
        const bot = addMsg('bot', '');
        try {
            await ensureEngine();
            const page = pageContext();
            const messages = [
                { role: 'system', content: 'You are a concise, practical assistant embedded in a career-resources website. Ground your answers in the page context when relevant. Give specific, actionable output. Never use em dashes or en dashes, use plain punctuation.' },
                { role: 'user', content: `Page: ${page.title}\n\nPage context:\n"""${page.text}"""\n\nMy request: ${q}` },
            ];
            await stream(messages, bot);
        } catch (err) {
            bot.textContent = '⚠️ ' + (err.message || err);
            if (err instanceof NeedKeyError) { openByok(); setStatus('add a key to continue'); }
        } finally {
            send.disabled = false; input.focus();
        }
    }

    send.onclick = ask;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } });

    // Initial status + note reflect which backend will be used.
    (function initMode() {
        const m = mode();
        if (m === 'byok') { head.classList.add('ready'); setStatus('your key'); $('aiNote').innerHTML = 'Using your saved key. <a id="aiByokToggle2">Change key</a>'; }
        else if (m === 'proxy') { head.classList.add('ready'); setStatus('ready'); $('aiNote').innerHTML = 'Free and ready, no setup needed. <a id="aiByokToggle2">Use my own key instead</a>'; }
        else { setStatus('on-device, off'); }
        const t2 = $('aiNote').querySelector('#aiByokToggle2');
        if (t2) t2.onclick = () => { const el = $('aiByok'); el.style.display = el.style.display === 'flex' ? 'none' : 'flex'; };
    })();
}