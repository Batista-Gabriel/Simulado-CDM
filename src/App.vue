<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const isDark = ref(false)
const route = useRoute()

onMounted(() => {
  const stored = localStorage.getItem('quiz_theme')
  isDark.value = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme()
})

function applyTheme() {
  document.documentElement.classList.toggle('dark', isDark.value)
}

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('quiz_theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

const isOnboarding = computed(() => route.name === 'inicio')

const btnClass = computed(() =>
  isOnboarding.value && isDark.value
    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
)

const footerClass = computed(() =>
  isOnboarding.value && isDark.value
    ? 'text-white/20 border-white/5'
    : 'text-gray-400 dark:text-white/20 border-gray-100 dark:border-white/5'
)
</script>

<template>
  <!--
    Layout raiz: flex-col garante que RouterView (flex-1) empurra o footer para baixo.
    O bg se adapta para evitar flash entre rotas.
  -->
  <div :class="[
    'min-h-screen flex flex-col transition-colors duration-300',
    'text-gray-900 dark:text-gray-100',
    isOnboarding && isDark ? 'bg-[#0f0e17]' : isOnboarding ? 'bg-gray-50' : 'bg-gray-50 dark:bg-[#0f0e17]',
  ]">
    <!-- Botão de tema fixo -->
    <button @click="toggleTheme" :class="[
      'fixed top-4 right-4 z-50 w-9 h-9 rounded-full border shadow-sm cursor-pointer',
      'flex items-center justify-center transition-all duration-200',
      btnClass,
    ]" :aria-label="isDark ? 'Modo claro' : 'Modo escuro'">
      <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" />
        <path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
      <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>

    <!-- RouterView ocupa todo o espaço disponível antes do footer -->
    <RouterView v-slot="{ Component }">
      <Transition name="route-fade" mode="out-in">
        <div :key="$route.path" class="flex-1 flex flex-col min-h-0">
          <component :is="Component" />
        </div>
      </Transition>
    </RouterView>

    <!-- Footer sempre visível em todas as telas -->
    <footer :class="['py-3 text-center text-xs border-t shrink-0 transition-colors duration-300', footerClass]">
      Feito por
      <a href="https://batista-gabriel.github.io/Portfolio/" target="_blank" rel="noopener noreferrer"
        class="text-violet-500 hover:text-violet-400 transition-colors font-medium cursor-pointer">
        Gabriel Batista de Almeida
      </a>
    </footer>
  </div>
</template>

<style>
.route-fade-enter-active,
.route-fade-leave-active {
  transition: opacity 0.18s ease;
}

.route-fade-enter-from,
.route-fade-leave-to {
  opacity: 0;
}
</style>