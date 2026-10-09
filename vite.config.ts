import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Politique de sécurité du contenu, ajoutée seulement au build (le serveur de dev a besoin de scripts inline).
 * GitHub Pages ne permet pas d'envoyer des en-têtes HTTP : la CSP passe donc par une balise <meta>.
 */
function contentSecurityPolicy(supabaseUrl: string | undefined): Plugin {
  const supabase = supabaseUrl ? new URL(supabaseUrl).origin : "";
  const realtime = supabase.replace(/^https:/, "wss:");
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    // React applique des styles en ligne (variables CSS par élément).
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${supabase} ${realtime}`.trim(),
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join("; ");
  return {
    name: "lifequest-csp",
    apply: "build",
    transformIndexHtml: (html) =>
      html.replace("<head>", `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: env.BASE_PATH || "/",
    plugins: [
      react(),
      contentSecurityPolicy(env.VITE_SUPABASE_URL),
      VitePWA({
        disable: env.PWA_DISABLE === "1",
        registerType: "autoUpdate",
        includeAssets: ["icon.svg", "icon-192.png"],
        manifest: {
          name: "LifeQuest",
          short_name: "LifeQuest",
          description: "Ta vie comme un jeu vidéo : XP, niveaux, quêtes quotidiennes et boss.",
          lang: "fr",
          display: "standalone",
          orientation: "portrait-primary",
          background_color: "#0E0B16",
          theme_color: "#0E0B16",
          categories: ["productivity", "lifestyle", "games"],
          icons: [
            { src: "icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png}"],
          // Les appels à Supabase ne doivent jamais être servis depuis le cache.
          navigateFallbackDenylist: [/^\/auth/],
        },
      }),
    ],
    build: { target: "es2022" },
  };
});
