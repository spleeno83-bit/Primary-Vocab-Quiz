# Word Explorers — deployment guide

This project is a **Cloudflare Worker with static assets** — Cloudflare's current
recommended setup, which is what your dashboard actually created for you
(you'll see it under **Workers & Pages → your project → Workers service**,
not under a separate "Pages" section).


```
word-explorers-site/
├── public/
│   └── index.html          ← the app (served as-is, no build step)
├── src/
│   └── index.js             ← Worker script: handles /api/generate-quiz, serves everything else as static files
├── wrangler.jsonc            ← tells Cloudflare how to wire the two together
└── README.md
```

## 1. Get an Anthropic API key
Go to https://console.anthropic.com/settings/keys and create one. Keep it secret — you'll paste it into Cloudflare's dashboard, never into the code.

Note: this API usage is billed separately from any Claude.ai subscription, pay-as-you-go per request. For a class quiz app this is normally very cheap (a handful of cents per 100 quizzes), but it's worth keeping an eye on usage in the console.

## 2. Push this folder to your GitHub repository
Replace everything in your repo with this folder's contents (the structure has changed since your last push — `index.html` moved into `public/`, and `functions/` was replaced by `src/index.js`):
```
git add -A
git commit -m "Switch to Workers + static assets structure"
git push
```
If you're not using git locally, you can also delete the old files in GitHub's web UI and upload these ones in their place.

## 3. Let Cloudflare rebuild
Since your project is already connected to this GitHub repo, pushing the change above should trigger a new build automatically. Go to your project in the Cloudflare dashboard and check the **Deployments** (or **Builds**) tab — it should pick up `wrangler.jsonc` and deploy cleanly this time, since the config now matches a Workers service instead of a Pages project.

If it asks you again for a **Deploy command**, leave it as the default `npx wrangler deploy` — `wrangler.jsonc` now supplies everything else it needs (entry script, static assets folder).

## 4. Add your API key
1. In your Worker's project page, go to **Settings**.
2. Find **Variables and Secrets**.
3. Select **Add**, choose type **Secret**, set the name to `ANTHROPIC_API_KEY`, and paste in the key from step 1.
4. Save, then redeploy (push a small change, or use the dashboard's redeploy option) so the Worker picks up the new variable.

That's it — the quiz-generation button will now work on your live site, and scores save locally in each pupil's/device's browser via `localStorage`.

## Optional: use a custom domain
In your Worker's project page, look for **Domains & Routes** (or **Triggers**, depending on current dashboard wording) → **Add** → **Custom domain**, and follow the prompts if you own one (e.g. `vocab.yourschool.co.uk`). Not required — the free `*.workers.dev` address works fine.

## If something doesn't generate a quiz
Open the browser dev tools (F12) → Console tab, and look for an error. The most common cause is the `ANTHROPIC_API_KEY` not being set yet, or the Worker not redeployed after adding it.

## If the build still fails
Open the build log Cloudflare links you to and read the first red error line — it's almost always more specific than the summary message. Common causes at this stage: the repo still has old files (`functions/`, a top-level `index.html`) alongside the new ones — delete those so only `public/`, `src/`, and `wrangler.jsonc` remain, since duplicate/conflicting configs are what triggered the original error.


