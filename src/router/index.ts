import { createRouter, createWebHistory } from "vue-router";
import TelaOnboarding from "@/components/TelaOnboarding.vue";
import TelaQuiz from "@/components/TelaQuiz.vue";
import TelaResultado from "@/components/TelaResultado.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "inicio", component: TelaOnboarding },
    { path: "/quiz", name: "quiz", component: TelaQuiz },
    { path: "/resultado", name: "resultado", component: TelaResultado },
  ],
});

export default router;
