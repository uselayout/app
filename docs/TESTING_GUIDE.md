# Layout V1 Alpha — User Testing Guide

Thank you for testing Layout before our public launch. This guide walks you through 10 key flows. For each one, follow the steps in order, note what you see, and report any issues using the template at the bottom.

**Estimated time:** 45–90 minutes for all flows. You can also pick individual flows.

**Report issues to:** [testing@layout.design] or the shared Slack channel.

---

## Before You Start

- Use a modern browser (Chrome 120+, Firefox 120+, or Safari 17+)
- You will need a Figma account for Flows 2, 6, 7, and 8
- You will need Node.js 18+ installed for Flow 5
- Have a text editor open to paste notes as you go

---

## Flow 1: Sign Up and Create Your First Project

**Goal:** Confirm that account creation and project setup work end-to-end.

1. Go to [layout.design](https://layout.design)
2. Click **Sign Up** in the top right
3. Enter an email address and password, then click **Create Account**
   - Alternatively, click **Continue with Google** or **Continue with GitHub**
4. Check your inbox for a verification email and click the confirmation link
5. You will land on your organisation dashboard — click **New Project**
6. Enter a name for your project (e.g. "My First Project") and click **Create**

**Expected outcome:** You are taken to the Studio with an empty editor panel. The project name appears in the top bar.

**What to report if it fails:**
- Which step failed (e.g. "Step 3")
- The exact error message, if any
- Whether you were using email/password or OAuth

---

## Flow 2: Extract a Design System from Figma

**Goal:** Confirm that Figma extraction produces a complete DESIGN.md.

**Before you start:** You need a Figma file that has local styles (paint, text, or effect styles) set up. A public Figma Community file with a design system works well.

1. In Studio, click the **Source** panel on the left and select **Figma**
2. Paste a Figma file URL into the URL field. It should look like:
   `https://www.figma.com/file/XXXXXXXXXXXX/My-Design-System`
3. If you do not have a Figma personal access token, generate one now:
   - Go to [figma.com/settings](https://www.figma.com/settings)
   - Scroll to **Personal access tokens**
   - Click **Generate new token**, give it a name, copy it
4. Paste your token into the **Figma token** field in Studio
5. Click **Extract**
6. Watch the progress bar — extraction takes 30–90 seconds
7. When complete, the editor panel will populate with a DESIGN.md document
8. Scroll through the generated document. It should contain sections for:
   - Quick Reference
   - Colour palette (hex values, token names)
   - Typography (font families, sizes, weights)
   - Spacing scale
   - Component inventory

**Expected outcome:** DESIGN.md is populated with your design system content. A health score (0–100) appears in the Source panel.

**What to report if it fails:**
- Which step failed
- Any error message shown (copy it exactly)
- Whether the Figma file was public or private
- How many styles the file had (visible in Figma's Assets panel)

---

## Flow 3: Extract a Design System from a Website

**Goal:** Confirm that website extraction correctly reads CSS from a live site.

**Note:** Website extraction uses Playwright running server-side. It will not work on localhost URLs or on sites that require login.

1. Click **New Project** to create a fresh project (or use an existing empty one)
2. In the Source panel, select **Website**
3. Paste a public URL into the field — for example: `https://stripe.com`
4. Click **Extract**
5. Wait 1–2 minutes — Playwright takes a screenshot and reads the computed CSS
6. Review the DESIGN.md when it appears

**Expected outcome:** Colours, font families, and spacing values are extracted from the live site. DESIGN.md is generated with at least a colour palette and typography section.

**What to report if it fails:**
- The URL you tried
- Whether a progress bar appeared at all
- Any error message shown

**Known limitation:** Does not work on sites behind authentication, or on localhost URLs.

---

## Flow 4: Export Your AI Kit

**Goal:** Confirm that the export bundle contains all expected files in working order.

1. With a project open in Studio (from Flow 2 or 3), click **Export** in the top bar
2. Select **Download ZIP** from the modal
3. The ZIP will download — open it in your file manager
4. Verify the archive contains all of the following files:
   - `DESIGN.md` — the human and AI readable design system document
   - `tokens.css` — CSS custom properties for all design tokens
   - `tokens.json` — W3C DTCG format token file
   - `tailwind.config.js` — Tailwind theme extending your tokens
   - `CLAUDE.md` — Claude Code context snippet

**Expected outcome:** All 5 files present. Open `tokens.css` and confirm it contains CSS variables (e.g. `--color-primary: #...`). Open `DESIGN.md` and confirm it matches what you saw in the Studio editor.

**What to report if it fails:**
- Which files were missing
- Whether the ZIP itself failed to download (error in browser)
- File sizes if they seem unexpectedly small (0 bytes or a few bytes suggests empty file)

---

## Flow 5: Use the CLI with Claude Code

**Goal:** Confirm that the MCP server connects and Claude can answer design system questions.

**Prerequisites:**
- Node.js 18 or later (`node --version` to check)
- Claude Code installed (`claude --version` to check)
- A Layout export ZIP from Flow 4

1. Open a terminal in any project directory
2. Import your bundle:
   ```bash
   npx @layoutdesign/context import ./your-bundle.zip
   ```
   You should see a `.layout/` folder created with your design system files.

3. Install the MCP server into Claude Code:
   ```bash
   npx @layoutdesign/context install
   ```
   You should see a confirmation message like "MCP server configured for Claude Code".

4. Open that directory in Claude Code:
   ```bash
   claude .
   ```

5. Ask Claude: **"What colours are in my design system?"**
   Claude should call the `get_design_system` MCP tool and return the colour palette from your DESIGN.md.

6. Ask Claude: **"Check this code for design system compliance: `<div style={{ color: '#ff0000' }}>Hello</div>`"**
   Claude should call `check_compliance` and flag the hardcoded hex colour.

**Expected outcome:** Claude answers both questions using information from your design system, not from its general training data. The colour answer should match what is in your DESIGN.md.

**What to report if it fails:**
- Which step failed
- The exact output from `npx @layoutdesign/context install`
- Whether Claude acknowledged the MCP tools were available
- What Claude said when asked about colours (did it make something up, or say it had no context?)

---

## Flow 6: Figma Plugin — Setup and Connection

**Goal:** Confirm the plugin installs and connects to your Layout account.

**Note:** The plugin is not yet on the Figma Community marketplace. You will load it as a development plugin.

1. Download or clone the plugin from the link provided to alpha testers
2. In Figma, go to **Plugins → Development → Import plugin from manifest**
3. Navigate to the downloaded plugin folder and select `manifest.json`
4. The plugin should now appear in your Figma plugins list as "Layout"
5. Open any Figma file and run the plugin
6. Go to the **Settings** tab
7. Get your Layout API key: in Layout Studio, click your org name → **Settings → API Keys → Generate New Key**
8. Copy the key, paste it into the plugin's Settings tab, and click **Verify**

**Expected outcome:** The Settings tab shows "Connected" with a green indicator and your organisation name.

**What to report if it fails:**
- Whether the plugin appeared in Figma after import
- Any error shown when clicking Verify
- Whether the API key was newly generated (not reused from a previous test)

---

## Flow 7: Figma Plugin — Token Sync (Variables)

**Goal:** Confirm that design tokens sync from Layout into Figma Variables.

**Prerequisite:** Flow 6 completed (plugin connected).

1. With the plugin open in a Figma file that has local styles, go to the **Variables** tab
2. Click **Pull from Layout**
3. A diff view appears showing:
   - Green rows: tokens being added
   - Yellow rows: tokens being updated
   - Red rows: tokens being removed
4. Review the diff, then click **Apply**
5. In Figma, open the local variables panel (right-click the canvas → **Local variables**)

**Expected outcome:** A "Layout" variables collection is created (or updated) in Figma. Token values match your design system.

**What to report if it fails:**
- Whether the diff appeared at all
- Whether the error mentions "Enterprise plan" (this is expected — the plugin should fall back to styles)
- Whether the Variables collection was created in Figma

**Known limitation:** The Figma Variables API requires an Enterprise plan. On Professional and Starter plans, the plugin automatically falls back to syncing Local Styles instead.

---

## Flow 8: Figma Plugin — Canvas Push

**Goal:** Confirm that selecting a component in Figma and pushing it to Layout's Explorer Canvas works.

**Prerequisite:** Flow 6 completed. You must have at least one project in Layout Studio.

1. In Figma, select a component frame or frame that represents a UI component
2. With the plugin open, go to the **Canvas** tab
3. Click **Capture Selection** — a preview of the selected frame should appear in the plugin
4. Click **Push to Layout Canvas**
5. A link appears in the plugin — click it to open in your browser

**Expected outcome:** You are taken to the Explorer Canvas in Layout Studio, where the captured component appears as a reference image. The AI can then generate variants of it using your design system tokens.

**What to report if it fails:**
- Whether you had a frame selected in Figma before clicking Capture
- Whether the preview appeared in the Canvas tab
- The error message if Push failed
- Whether you have a project in Layout Studio (required)

---

## Flow 9: Team and Organisation

**Goal:** Confirm that inviting a team member works and they can access projects.

**Prerequisite:** A second email address you can access (could be a Gmail alias).

1. In Layout Studio, click your org name in the top left
2. Go to **Settings → Members**
3. Click **Invite Member**
4. Enter the second email address and select a role (Member)
5. Click **Send Invite**
6. Check the inbox of the invited email for an invitation link
7. Click the link and sign up or sign in with that email
8. Confirm that the invited user can see the organisation's projects in their dashboard

**Expected outcome:** The invited user sees the same projects you created. They can open projects in Studio but cannot access Settings unless given Admin role.

**What to report if it fails:**
- Whether the invitation email arrived (check spam)
- Whether clicking the link showed an error
- Whether the user could see projects after accepting

---

## Flow 10: API Key

**Goal:** Confirm that the API key generates correctly and authenticates against the API.

1. In Layout Studio, go to **Settings → API Keys**
2. Click **Generate New Key**
3. Give the key a name (e.g. "Test Key")
4. Copy the key immediately — it will only be shown once
5. Open a terminal and run:
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY_HERE" https://layout.design/api/plugin/tokens
   ```
   Replace `YOUR_KEY_HERE` with the key you copied.
6. Verify you receive a JSON response containing your design tokens

**Expected outcome:** A JSON response is returned (not a 401 or 403 error). The token data should match what you see in Studio.

**What to report if it fails:**
- The HTTP status code returned (e.g. `401 Unauthorized`)
- Whether the key was copied correctly (try again if unsure)
- Whether you have a project with extracted tokens in your org

---

## Known Limitations for Alpha Testers

| Limitation | Details |
|---|---|
| Website extraction requires Playwright | Works on the hosted version at layout.design. Not available if self-hosting on Vercel serverless. |
| Figma Variables API — Enterprise only | On non-Enterprise plans, the plugin falls back to syncing Local Styles. No action needed on your part. |
| One design system kit per project | Multiple kits per project coming in V1.1. |
| Auto re-extraction from Figma webhooks | Webhooks receive events, but automatic re-extraction is not yet active. Re-extract manually by clicking **Re-extract** in Studio. |
| Figma plugin not on Community yet | Must be loaded as a development plugin (see Flow 6). |

---

## How to Report Issues

For each issue, please include all of the following:

1. **Which flow and step** — e.g. "Flow 2, Step 4"
2. **What you expected** — one sentence describing the expected outcome
3. **What actually happened** — exact error message if shown, or description of what appeared
4. **Browser and OS** — e.g. "Chrome 124 on macOS 14.4" or "Firefox 125 on Windows 11"
5. **Screenshot** — if the issue is visual, a screenshot is very helpful

**Where to send reports:**
- Slack: `#alpha-testing` channel
- Email: testing@layout.design
- GitHub: Open an issue at github.com/uselayout/studio/issues (if you have access)

Thank you for helping us make Layout better.
