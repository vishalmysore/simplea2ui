# GitHub Pages Deployment

This project is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

## Setup Instructions

1. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Build and deployment":
     - Source: Select **GitHub Actions**

2. **Push your code**:
   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

3. **Access your site**:
   - Your site will be available at: `https://<your-username>.github.io/a2uiclient-v21/`
   - The deployment typically takes 1-2 minutes

## How it Works

- The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:
  1. Installs dependencies
  2. Builds the Angular app with the correct base-href
  3. Deploys to GitHub Pages

## Build Configuration

The build command uses `--base-href=/a2uiclient-v21/` to ensure all assets load correctly from the subdirectory.

If your repository name is different, update the base-href in `.github/workflows/deploy.yml`:
```yaml
run: npm run build -- --base-href=/your-repo-name/
```

## Manual Build

To build locally with the same configuration:
```bash
npm run build -- --base-href=/a2uiclient-v21/
```

The output will be in `dist/a2uiclient-v21/browser/`.
