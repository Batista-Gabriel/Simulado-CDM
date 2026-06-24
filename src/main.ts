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

// ── App ───────────────────────────────────────────────────────────────────────
const app = createApp(App);
app.use(router);
app.mount("#app");
