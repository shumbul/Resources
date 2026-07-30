# Resources AI proxy (Cloudflare Worker)

This tiny Worker lets your site's "Ask AI" work for **every visitor with zero setup**, while keeping your Groq API key secret. It stays free: Cloudflare Workers free tier + Groq free tier.

How it works: the browser calls your Worker, the Worker adds your secret Groq key and forwards the request to Groq, then streams the answer back. The key never touches the website or git.

## One-time setup (about 10 minutes)

You need a free Cloudflare account and a free Groq API key.

### 1. Get a free Groq key
1. Go to https://console.groq.com/keys
2. Sign in, click "Create API Key", copy it. Keep it somewhere safe for step 4.

### 2. Install the deploy tool
You need Node.js installed. Then, from this `worker/` folder:
```
npm install -g wrangler
```
(or use `npx wrangler ...` for every command without installing globally)

### 3. Log in to Cloudflare
```
wrangler login
```
A browser opens, approve access. This creates the free Workers account if you don't have one.

### 4. Add your Groq key as a secret (never in code)
```
wrangler secret put GROQ_API_KEY
```
Paste the Groq key when prompted, press Enter.

### 5. Deploy
```
wrangler deploy
```
You'll get a URL like:
```
https://resources-ai.<your-subdomain>.workers.dev
```
Copy that URL.

### 6. Point the site at your Worker
Open `docs/functions/assistant.js`, set near the top:
```js
const SHARED_PROXY_URL = 'https://resources-ai.<your-subdomain>.workers.dev';
```
Do the same in `docs/ai-tools.html` (the `SHARED_PROXY_URL` constant in its script).

Commit and push. Done. The assistant now works on any device, no key or GPU needed.

## Editing the allow-list
`worker.js` has `ALLOWED_ORIGINS`. Make sure your live site origin is in it (default already includes `https://shumbul.github.io`). Redeploy with `wrangler deploy` after any change.

## Abuse protection built in
Because the key is shared, the Worker:
- only accepts requests from your allow-listed origins,
- caps message count, tokens, and body size,
- restricts which models can be called.

If you ever see heavy usage, rotate the Groq key (`wrangler secret put GROQ_API_KEY` again) and/or tighten the caps.

## Fallback order on the site
1. Visitor's own key (if they set one) - offloads your quota.
2. Your shared Worker (this) - zero setup, works everywhere.
3. On-device model (WebGPU) - only if the Worker URL is blank and the device supports it.
