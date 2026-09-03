# Word Explorers — deployment guide

This folder is ready to deploy to **Cloudflare Pages** for free.

```
word-explorers-site/
├── index.html                     ← the app
├── functions/
│   └── api/
│       └── generate-quiz.js       ← serverless function, keeps your API key private
└── README.md
```

## 1. Get an Anthropic API key
Go to https://console.anthropic.com/settings/keys and create one. Keep it secret — you'll paste it into Cloudflare's dashboard, never into the code.

Note: API usage here is billed separately from any Claude.ai subscription, pay-as-you-go per request. For a class quiz app this is normally very cheap (a handful of cents per 100 quizzes), but it's worth keeping an eye on usage in the console.

## 2. Put this folder in a GitHub repository
1. Create a new repository on https://github.com (can be private).
2. Upload these three items (`index.html`, the `functions` folder, this `README.md`) to it — either via GitHub's web "Add file → Upload files", or with git:
   ```
   git init
   git add .
   git commit -m "Word Explorers"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

## 3. Connect it to Cloudflare Pages
Cloudflare's dashboard layout has changed — Pages now lives inside a combined **Workers & Pages** section, not its own icon.

1. Go to https://dash.cloudflare.com and sign up (free, no card required) or log in.
2. In the left sidebar, select **Workers & Pages**.
3. Click **Create application**.
4. Select the **Pages** tab, then **Import an existing Git repository**.
5. Choose your GitHub account, authorize Cloudflare to access it, then select your repository.
6. On the build settings screen: leave **Framework preset** as *None*, leave **Build command** blank, and set **Build output directory** to `/` (this is a plain static site — nothing needs building).

   **If you see a "Deploy command" field instead of "Build output directory"**, Cloudflare has routed you into its newer unified Workers flow rather than classic Pages. This project includes a `wrangler.jsonc` file that tells that flow to treat it as a static Pages site — leave **Deploy command** as its default (`npx wrangler deploy`) and it should pick that config up automatically. If it still doesn't work, go back and explicitly choose the **Pages** tab (not **Workers**) when creating the application — that's the simpler path for this project and skips the deploy-command question altogether.
7. Click **Save and Deploy**. You'll get a live URL like `word-explorers.pages.dev` within a minute or two.

(If you'd rather skip GitHub entirely, step 4 also offers **Use direct upload** — you can drag and drop this whole folder instead. You'll just need to re-upload manually each time you make a change, rather than it updating automatically.)

For Cloudflare's own always-current walkthrough with screenshots, see: https://developers.cloudflare.com/pages/get-started/

## 4. Add your API key
1. In your Pages project, go to **Settings**.
2. Find **Variables and Secrets** (this used to be called "Environment variables" — Cloudflare renamed it in 2026).
3. Select **Add**, choose type **Secret**, set the name to `ANTHROPIC_API_KEY`, and paste in the key from step 1.
4. Save, then go to **Deployments** and redeploy (or push a small change to the repo) so the function picks up the new variable.

That's it — the quiz-generation button will now work on your live site, and scores save locally in each pupil's/device's browser via `localStorage`.

## Optional: use a custom domain
In the Pages project, **Custom domains** tab → **Set up a custom domain**, and follow the prompts if you own one (e.g. `vocab.yourschool.co.uk`). Not required — the free `.pages.dev` address works fine.

## If something doesn't generate a quiz
Open the browser dev tools (F12) → Console tab, and look for an error. The most common cause is the `ANTHROPIC_API_KEY` not being set yet, or not redeployed after adding it.
