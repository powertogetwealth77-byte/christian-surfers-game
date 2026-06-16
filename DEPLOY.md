## Deploy Christian Surfers to Vercel

This game is ready to deploy. Since the environment here cannot authenticate with Vercel (network policy), follow these steps on your own machine:

### Quick Deploy (Recommended)

1. **On your machine,** install Vercel CLI if you haven't:
   ```bash
   npm install -g vercel
   ```

2. **In the game directory:**
   ```bash
   cd christian-surfers-game
   vercel --prod
   ```

3. When prompted:
   - **Log in to Vercel** with your GitHub account (or email)
   - **Link to existing project?** → choose "N" (new project)
   - **Project name** → `christian-surfers` (or your choice)
   - **Scope** → Select your account
   - **Framework preset** → "Vite"
   - **Build command** → (leave default, it will read `vercel.json`)
   - **Output directory** → (leave default)

4. **Wait for deployment.** Vercel will build and deploy automatically. You'll get a URL like:
   ```
   https://christian-surfers-abc123.vercel.app
   ```

### GitHub-Integrated Deploy (Alternative)

If your repo is connected to GitHub, you can also:

1. Push the `claude/christian-surfers-game-gsdw86` branch to GitHub
2. Go to https://vercel.com/new and connect your GitHub repo
3. Import the repo, select the branch, and Vercel auto-deploys on every push

### Deploy from GitHub Web UI (Easiest)

1. Go to https://vercel.com
2. Click **"Add New..." → "Project"**
3. Select your GitHub repo (powertogetwealth77-byte/Claude-Code-Test)
4. In **Root Directory**, set: `christian-surfers-game`
5. Click **Deploy**

Vercel will auto-detect the `vercel.json` config and deploy from there.

---

## What's Deployed

- ✅ Vite build (optimized JS + CSS + assets)
- ✅ PWA manifest (installable app)
- ✅ Service worker (offline cache)
- ✅ App icons (192px, 512px, maskable, Apple touch)
- ✅ All meta tags (safe-area, viewport-fit, theme color)
- ✅ Mobile-optimized layout (portrait, notch support, scroll lock)

---

## Testing After Deploy

Once you get the Vercel URL, test:

1. **Open on desktop:** Game loads, sounds work, all screens functional
2. **Open on iPhone/Android:** Swipes work, canvas fills screen, no page scroll
3. **Tap "Add to Home Screen"** (Settings screen): App installs, runs full-screen
4. **Offline test:** Close the tab, airplane mode on, re-open: game still loads (service worker cached assets)
5. **Share the URL** — any device can play immediately, no installation needed

---

## Troubleshooting

- **Build fails?** Check that you're in the `christian-surfers-game/` directory and `npm install` has run.
- **HTTPS required for PWA:** Vercel always serves HTTPS, so install prompt will work live.
- **Service worker not updating?** Hard refresh (Cmd+Shift+R or Ctrl+Shift+R) to bust the cache.

Good luck, and enjoy sharing the game! 🙏✝️
