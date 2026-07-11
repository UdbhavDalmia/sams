<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/a1c9bc96-1ffd-4869-bc8d-cbbcb3a66641

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Netlify deployment

Netlify build settings are defined in `netlify.toml`. Keep `GEMINI_API_KEY` and
`FIREBASE_SERVICE_ACCOUNT` in Netlify environment variables; never add their
values to the repository. `FIREBASE_DATABASE_ID` is excluded from secret-value
scanning because it is a public database identifier used by the application.
