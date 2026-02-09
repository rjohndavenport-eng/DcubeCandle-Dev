# Shopify CLI Setup & Commands — DCube Candle Co.

**CLI Status:** ✅ Installed (detected at `/c/Users/rjohn/AppData/Roaming/npm/shopify`)
**Version Check:** Run `shopify version` to confirm
**Platform:** Windows

---

## CLI Installation (Reference)

### If Shopify CLI Was Not Installed

**Windows (via npm):**
```bash
npm install -g @shopify/cli @shopify/theme
```

**macOS (via Homebrew):**
```bash
brew tap shopify/shopify
brew install shopify-cli
```

**Linux (via npm):**
```bash
npm install -g @shopify/cli @shopify/theme
```

**Verify Installation:**
```bash
shopify version
# Expected output: @shopify/cli/3.x.x
```

---

## First-Time Authentication

**Prerequisite:** Shopify store must exist (create at [shopify.com](https://www.shopify.com) if needed)

### Login to Shopify
```bash
shopify auth login
```

**What This Does:**
1. Opens browser window
2. Prompts you to select your Shopify store
3. Requests permissions (theme management, product access)
4. Saves authentication token locally

**Expected Output:**
```
✔ Logged into store: dcube-candle-co.myshopify.com
```

**Troubleshooting:**
- If browser doesn't open: Copy URL from terminal and paste in browser
- If "no stores found": Ensure you're logged into Shopify admin
- If permissions denied: Store owner must grant collaborator access

---

## Theme Development Workflow

### Step 1: Create New Theme from Scratch

**Navigate to project directory:**
```bash
cd /d/onedrive/Desktop/becandle
```

**Initialize new Shopify theme:**
```bash
shopify theme init shopify-theme-dcube
```

**What This Does:**
- Creates `shopify-theme-dcube/` directory
- Scaffolds basic OS 2.0 theme structure:
  ```
  shopify-theme-dcube/
  ├── assets/
  ├── config/
  ├── layout/
  ├── locales/
  ├── sections/
  ├── snippets/
  └── templates/
  ```

**Alternative:** Clone from existing theme repo
```bash
shopify theme pull --store=dcube-candle-co.myshopify.com
# Downloads current live theme to local directory
```

---

### Step 2: Start Local Development Server

```bash
cd shopify-theme-dcube
shopify theme dev
```

**What This Does:**
- Starts local preview server at `http://127.0.0.1:9292`
- Hot-reloads changes (no manual refresh needed)
- Syncs local changes to Shopify development theme
- Shows terminal output for errors/warnings

**Expected Output:**
```
✔ Synced theme to development theme #123456789
✔ Preview your theme: http://127.0.0.1:9292
✔ Customize your theme: https://dcube-candle-co.myshopify.com/admin/themes/123456789/editor
```

**Important:**
- Keep terminal window open while developing
- Press `Ctrl+C` to stop server
- Changes are auto-saved to Shopify (draft theme)

**Flags:**
- `--store=dcube-candle-co` — Specify store (if multiple stores)
- `--theme-editor-sync` — Enable live sync with Shopify customizer
- `--live-reload=off` — Disable hot reload

---

### Step 3: Push Theme to Shopify

**Push as unpublished (draft) theme:**
```bash
shopify theme push --unpublished
```

**What This Does:**
- Uploads all theme files to Shopify
- Creates new unpublished theme
- Does NOT affect live site
- Safe for testing/staging

**Push to specific theme ID:**
```bash
shopify theme push --theme=123456789
```

**Push and publish (⚠️ CAUTION: affects live site):**
```bash
shopify theme push --publish
```

**Flags:**
- `--only=sections/,snippets/` — Push only specific directories
- `--ignore=config/settings_data.json` — Ignore specific files
- `--nodelete` — Don't delete remote files not in local directory

---

### Step 4: Pull Theme from Shopify

**Download live theme:**
```bash
shopify theme pull
```

**Download specific theme by ID:**
```bash
shopify theme list
# Lists all themes with IDs

shopify theme pull --theme=123456789
```

**Use Case:**
- Backup theme before making changes
- Sync changes made in Shopify customizer to local files
- Download theme from production to development environment

---

### Step 5: Publish Theme (Go Live)

**Publish theme by ID:**
```bash
shopify theme publish --theme=123456789
```

**Publish current theme:**
```bash
shopify theme push --publish
```

**⚠️ WARNING:**
- This makes the theme LIVE on your store
- Always test thoroughly before publishing
- Consider creating a backup first: `shopify theme pull`

---

## Essential Shopify CLI Commands

### Theme Management

**List all themes:**
```bash
shopify theme list
```
**Output:**
```
#123456789 [live] Dawn
#987654321 [unpublished] dcube-theme-v1
#111222333 [unpublished] dcube-theme-dev
```

**Delete theme:**
```bash
shopify theme delete --theme=123456789
```
**⚠️ Confirmation required** (cannot be undone)

**Rename theme:**
```bash
shopify theme rename --theme=123456789 --name="DCube Theme v2"
```

**Share preview link:**
```bash
shopify theme share --theme=123456789
```
**Output:** Shareable preview URL (no login required)

---

### File Operations

**Check theme files:**
```bash
shopify theme check
```
**What This Does:**
- Validates Liquid syntax
- Checks for deprecated tags
- Identifies performance issues
- Reports accessibility warnings

**Example Output:**
```
✔ 0 errors, 2 warnings
⚠ sections/hero.liquid: Missing alt text on image
⚠ snippets/product-card.liquid: Consider using lazy loading
```

**Open theme in Shopify customizer:**
```bash
shopify theme open --editor
```
**Opens:** `https://dcube-candle-co.myshopify.com/admin/themes/[ID]/editor`

**Open storefront preview:**
```bash
shopify theme open --live
```
**Opens:** `https://dcube-candle-co.myshopify.com?preview_theme_id=[ID]`

---

### Environment Management

**Configure default store:**
```bash
shopify config set store dcube-candle-co.myshopify.com
```
**Saves:** Default store for future commands (no need to specify `--store` flag)

**View current config:**
```bash
shopify config
```

**Clear authentication:**
```bash
shopify auth logout
```

---

## Recommended Development Workflow

### Daily Development Loop

1. **Start development server:**
   ```bash
   cd /d/onedrive/Desktop/becandle/shopify-theme-dcube
   shopify theme dev
   ```

2. **Edit files in code editor:**
   - `sections/*.liquid` — Theme sections
   - `snippets/*.liquid` — Reusable components
   - `assets/site.css` — Styles
   - `assets/site.js` — Scripts

3. **View changes in browser:**
   - Navigate to `http://127.0.0.1:9292`
   - Changes auto-reload (hot module replacement)

4. **Test in Shopify customizer:**
   - Open customizer link from terminal output
   - Adjust section settings
   - Preview on mobile/desktop

5. **Commit changes (git):**
   ```bash
   git add .
   git commit -m "Add hero section with schema settings"
   git push origin main
   ```

6. **Stop development server:**
   - Press `Ctrl+C` in terminal

---

### Pre-Launch Workflow

**Week before launch:**

1. **Create staging theme:**
   ```bash
   shopify theme push --unpublished
   # Note the theme ID from output
   ```

2. **Share preview link with stakeholders:**
   ```bash
   shopify theme share --theme=123456789
   ```

3. **Run theme check:**
   ```bash
   shopify theme check
   ```

4. **Fix errors/warnings:**
   - Validate Liquid syntax
   - Add missing alt text
   - Optimize performance

5. **Test on real devices:**
   - Use preview link on mobile (iOS, Android)
   - Test on multiple browsers (Chrome, Safari, Firefox)

**Launch day:**

1. **Final pull from staging:**
   ```bash
   shopify theme pull --theme=123456789
   ```

2. **Backup current live theme:**
   ```bash
   shopify theme pull --live
   ```

3. **Publish new theme:**
   ```bash
   shopify theme publish --theme=123456789
   ```

4. **Verify live site:**
   - Check homepage, shop, product pages
   - Test add-to-cart functionality
   - Verify checkout flow

---

## Version Control Best Practices

### Git Setup (Recommended)

**Initialize git in theme directory:**
```bash
cd shopify-theme-dcube
git init
git add .
git commit -m "Initial theme scaffolding"
```

**Create `.gitignore`:**
```gitignore
# Shopify theme .gitignore
config/settings_data.json
.shopify/
*.log
node_modules/
.DS_Store
Thumbs.db
```

**Why ignore `settings_data.json`?**
- Contains instance-specific settings (theme customizer values)
- Differs between development/staging/production
- Causes merge conflicts if committed

**Branching Strategy:**
```bash
# Main branch = production-ready code
git checkout -b feature/hero-section
# Make changes, commit
git checkout main
git merge feature/hero-section
git push origin main
```

---

## Troubleshooting Common Issues

### Issue: "Authentication failed"
**Solution:**
```bash
shopify auth logout
shopify auth login
```

### Issue: "Theme not found"
**Solution:**
```bash
shopify theme list
# Verify theme ID exists
# If not, push theme first:
shopify theme push --unpublished
```

### Issue: "Port 9292 already in use"
**Solution:**
```bash
# Kill existing process (Windows)
netstat -ano | findstr :9292
taskkill /PID [process_id] /F

# Or use different port
shopify theme dev --port=9293
```

### Issue: "Liquid syntax error"
**Solution:**
```bash
shopify theme check
# Fix errors listed in output
# Common errors:
# - Unclosed {% tag %}
# - Invalid filter: {{ product.price | invalid_filter }}
# - Missing endfor/endif
```

### Issue: "Changes not syncing to Shopify"
**Solution:**
1. Check terminal output for errors
2. Verify internet connection
3. Restart `shopify theme dev`
4. Check file is not in `.shopifyignore`

### Issue: "Theme customizer changes not pulling to local"
**Solution:**
```bash
# Pull latest settings_data.json
shopify theme pull --only=config/settings_data.json
```

---

## Advanced CLI Features

### Theme Packages (Download from Theme Store)

**Download paid theme:**
```bash
shopify theme pull --live
# Pulls current live theme (if purchased from Theme Store)
```

**Note:** Theme Store themes are usually encrypted/obfuscated

---

### Shopify App Development (Future)

**If building custom app:**
```bash
shopify app init
# Scaffolds Shopify app structure (React + Node.js)

shopify app dev
# Starts app development server

shopify app deploy
# Deploys app to Shopify Partners account
```

**Not needed for DCube theme** (standard theme development only)

---

## Performance Optimization Commands

### Analyze theme bundle size:
```bash
shopify theme check --output=json
# Outputs detailed performance metrics
```

### Minify CSS/JS (manual):
```bash
# Use build tools (optional)
npm install --save-dev cssnano terser
# Add to package.json scripts
```

**Shopify does NOT auto-minify:**
- Minify CSS before uploading to `assets/`
- Minify JS before uploading to `assets/`
- Or use Shopify app like **Minifier** (paid)

---

## Useful Keyboard Shortcuts

**In `shopify theme dev` terminal:**
- `r` — Force reload browser
- `o` — Open preview in browser
- `e` — Open theme editor in browser
- `q` — Quit server (same as `Ctrl+C`)

---

## External Resources

### Official Documentation
- [Shopify CLI Reference](https://shopify.dev/docs/themes/tools/cli)
- [Theme Architecture](https://shopify.dev/docs/themes/architecture)
- [Liquid Cheat Sheet](https://www.shopify.com/partners/shopify-cheat-sheet)

### Community Resources
- [Shopify Community Forums](https://community.shopify.com/)
- [Shopify Partner Slack](https://shopifypartners.slack.com)
- [Liquid Code Examples](https://shopify.github.io/liquid-code-examples/)

---

## Quick Reference Command List

```bash
# Authentication
shopify auth login
shopify auth logout

# Theme initialization
shopify theme init [name]

# Development
shopify theme dev
shopify theme dev --store=[store-name]

# Deployment
shopify theme push --unpublished
shopify theme push --theme=[id]
shopify theme publish --theme=[id]

# Management
shopify theme list
shopify theme pull
shopify theme delete --theme=[id]
shopify theme share --theme=[id]

# Validation
shopify theme check

# Utilities
shopify theme open --editor
shopify theme open --live
shopify config
```

---

## Next Steps After CLI Setup

1. ✅ Verify Shopify CLI installation: `shopify version`
2. ✅ Authenticate with store: `shopify auth login`
3. 🚀 Initialize theme: `shopify theme init shopify-theme-dcube`
4. 📝 Review theme plan: `tools/shopify-theme-plan.md`
5. 🎨 Start building sections (header, footer, hero)
6. 🧪 Test locally: `shopify theme dev`
7. 📤 Push to Shopify: `shopify theme push --unpublished`
8. 🌐 Publish when ready: `shopify theme publish`

---

**Questions?** Reference:
- `tools/shopify-readiness-report.md` — Site audit
- `tools/shopify-theme-plan.md` — Theme architecture
- `tools/seo-social-plan.md` — SEO strategy
- [Shopify CLI Docs](https://shopify.dev/docs/themes/tools/cli)
