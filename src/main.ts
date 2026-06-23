import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

// Extensão do tipo Window para suportar gtag e dataLayer
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// ── Google Analytics 4 ───────────────────────────────────────────────────────
const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

if (GA_ID) {
  // Injeta o script do gtag.js dinamicamente
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // Inicializa o dataLayer e configura a propriedade
  window.dataLayer = window.dataLayer ?? [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);
}

// ── App ───────────────────────────────────────────────────────────────────────
const app = createApp(App);
app.use(router);
app.mount("#app");
