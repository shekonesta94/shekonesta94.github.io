# Hisham Automation — Public Website

Public homepage + privacy policy, hosted free on **GitHub Pages**.
Required by Google Cloud to switch OAuth apps to **In production** (stops Google credentials in n8n from expiring every 7 days).

## Live URLs
| Page | URL |
|---|---|
| Homepage | https://shekonesta94.github.io |
| Privacy Policy | https://shekonesta94.github.io/privacy.html |

## Files
| File | Purpose |
|---|---|
| `index.html` | Homepage (business name, what the app does, contact) |
| `privacy.html` | Privacy policy covering Google Drive + Google Sheets access |
| `README.md` | This guide |

## Where these URLs are used
Google Cloud Console → **APIs & Services → OAuth consent screen (Google Auth Platform)**:
- **Branding**
  - Application home page → `https://shekonesta94.github.io`
  - Application privacy policy link → `https://shekonesta94.github.io/privacy.html`
  - Authorized domains → `shekonesta94.github.io`
  - App logo → leave EMPTY (a logo forces Google verification)
- **Audience** → Publish app → Confirm → status becomes **In production**
- Then in n8n: **Reconnect** every Google credential once (old Testing tokens still expire).

## How to edit
1. Open the file on github.com → pencil icon (Edit).
2. Change the text → **Commit changes**.
3. The live site updates within 1–2 minutes.

## Checklist for each new client
- [ ] Google Cloud project for the client (or reuse yours)
- [ ] Branding filled with these two URLs (or the client's own site)
- [ ] Publish app → In production
- [ ] Connect Google credentials in n8n after publishing

Contact: hishamfthi.business@gmail.com
Backup copy: Google Drive → `Hisham Automation / 01 - Website & Privacy Policy`
