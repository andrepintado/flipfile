# Deployment Guide for FlipFile

## GitHub Pages Deployment

FlipFile works perfectly on GitHub Pages since it's a 100% static website.

### Option 1: Deploy from Main Branch

1. **Push to main branch:**
   ```bash
   git checkout main
   git merge claude/flipfile-converter-app-U96DJ
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository: https://github.com/andrepintado/flipfile
   - Click **Settings** > **Pages**
   - Under **Source**, select: `main` branch, `/ (root)` folder
   - Click **Save**

3. **Your site will be live at:**
   - Default: `https://andrepintado.github.io/flipfile/`
   - Custom domain: `https://flipfile.tools` (if DNS is configured)

### Option 2: Deploy from docs/ folder

1. Move files to docs folder (if preferred)
2. In GitHub Pages settings, select `main` branch, `/docs` folder

### Option 3: Deploy from gh-pages branch

```bash
# Create gh-pages branch with your files
git checkout -b gh-pages
git push origin gh-pages

# In GitHub settings, select gh-pages branch
```

## Custom Domain Setup (flipfile.tools)

The `CNAME` file is already created. To use your custom domain:

1. **In your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare):**

   Add these DNS records:
   ```
   Type: A
   Name: @
   Value: 185.199.108.153

   Type: A
   Name: @
   Value: 185.199.109.153

   Type: A
   Name: @
   Value: 185.199.110.153

   Type: A
   Name: @
   Value: 185.199.111.153

   Type: CNAME
   Name: www
   Value: andrepintado.github.io
   ```

2. **In GitHub Pages settings:**
   - Enter `flipfile.tools` in the Custom domain field
   - Enable "Enforce HTTPS" (wait a few minutes for cert)

3. **DNS propagation takes 1-48 hours**

## Other Deployment Options

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

Or simply drag and drop the folder to https://app.netlify.com/drop

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Cloudflare Pages
1. Go to https://pages.cloudflare.com/
2. Connect your GitHub repository
3. No build settings needed (static site)
4. Deploy!

## Verification

After deployment, test these features:
- [ ] Upload an image file
- [ ] Convert image to different formats (PNG → JPG, JPG → WebP)
- [ ] Download converted file
- [ ] Test drag & drop
- [ ] Test on mobile device
- [ ] Check privacy badge displays correctly
- [ ] Verify no console errors

## Performance

Since all conversion happens in the browser:
- ✅ Works offline (after first load)
- ✅ No server costs
- ✅ Unlimited conversions
- ✅ No bandwidth limits for conversion
- ✅ Fast - no upload/download time

## Troubleshooting

**Issue: "404 Not Found" on GitHub Pages**
- Wait 5-10 minutes after enabling GitHub Pages
- Ensure index.html is in the root (or selected folder)
- Check GitHub Actions tab for deployment status

**Issue: Custom domain not working**
- Verify DNS records are correct
- Wait for DNS propagation (up to 48 hours)
- Check CNAME file contains only: `flipfile.tools`
- Ensure custom domain is set in GitHub Pages settings

**Issue: Files not converting**
- Check browser console for errors
- Ensure using modern browser (Chrome, Firefox, Safari, Edge)
- Some older browsers may not support WebP or other formats

## Security Headers (Optional)

For enhanced security, create a `_headers` file for Netlify or configure headers in your hosting:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Monitoring

No analytics are included by design (privacy-first). If needed:
- Use privacy-friendly analytics (Plausible, Fathom)
- GitHub Pages traffic stats in Insights
- Cloudflare analytics (if using Cloudflare)

---

**Your site is ready to deploy! No build process, no dependencies, just pure HTML/CSS/JS.** 🚀
