# Pulse Systems Main Website

Static landing page for Pulse Systems, designed for GitHub Pages.

## Included
- Responsive home page with Pulse Systems branding
- Features section for moderation, logs and Roblox role integrations
- Privacy Policy link to the current policy site
- Support server and contact links
- Login with Discord placeholder (not connected to OAuth/backend)

## Publish to the existing repository
1. Download and extract this ZIP.
2. Open `https://github.com/quin78089-ui/pulse-systems-privacy`.
3. Upload/replace `index.html`, `styles.css`, `script.js`, and the `assets` folder in the repository root.
4. Keep any existing privacy-policy content/files you still need. The homepage links to the currently published policy at `https://quin78089-ui.github.io/pulse-systems-privacy/`; if that policy is currently served by the root `index.html`, move its contents to a separate page such as `privacy.html` before replacing the homepage, then change the homepage privacy link to `privacy.html`.
5. Commit the changes to `main`. GitHub Pages should publish the update automatically if it is configured for `main` / root.

## Important
This is the static website only. Discord OAuth2 and the live bot control panel are not implemented. Do not add a Discord bot token or OAuth client secret to frontend files. A secure backend is required before enabling sign-in or saving server settings.
