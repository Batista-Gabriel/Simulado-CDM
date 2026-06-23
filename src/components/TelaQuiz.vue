<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/composables/useQuizStore'

import { useAnalytics } from '@/composables/useAnalytics'
import { useFormUrls } from '@/composables/useFormUrls'


const { registrarAbandono } = useQuizStore()
const { trackErrorReported } = useAnalytics()
const { urlErro } = useFormUrls()

const router = useRouter()
const {
  sessao, questaoAtual, respostaAtual, indiceAtual,
  questoesEmbaralhadas, progresso, finalizado,
  mostrarRespostaAtual, responder, proximaQuestao,
} = useQuizStore()

onMounted(() => { if (!sessao.value) router.replace('/') })
onMounted(() => window.addEventListener('beforeunload', registrarAbandono))
onUnmounted(() => window.removeEventListener('beforeunload', registrarAbandono))

// Redireciona ao finalizar — com delay para a animação de "calculando" tocar
watch(finalizado, (val) => {
  if (val) setTimeout(() => router.push('/resultado'), 1200)
})

const mostrarModal = ref(false)
const questaoVisivel = ref(true) // controla slide entre questões
const direcaoSlide = ref<'in' | 'out'>('in')

async function avancar() {
  // Slide out
  direcaoSlide.value = 'out'
  questaoVisivel.value = false
  await new Promise((r) => setTimeout(r, 200))
  proximaQuestao()
  // Slide in
  direcaoSlide.value = 'in'
  await new Promise((r) => setTimeout(r, 20))
  questaoVisivel.value = true
}

function confirmarVoltar() {
  mostrarModal.value = false
  router.replace('/')
}

const podeAvancar = computed(() => {
  const r = respostaAtual.value
  if (!sessao.value) return false
  if (sessao.value.mostrarRespostaImediata) return mostrarRespostaAtual.value
  return r?.alternativaEscolhida !== null && r?.alternativaEscolhida !== undefined
})

function classeAlternativa(idx: number) {
  const r = respostaAtual.value
  const q = questaoAtual.value
  const respondeu = r?.alternativaEscolhida !== null && r?.alternativaEscolhida !== undefined

  if (mostrarRespostaAtual.value) {
    if (idx === q?.indiceCorretaEmbaralhada)
      return 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 cursor-default'
    if (idx === r?.alternativaEscolhida && !r?.correta)
      return 'border-red-400 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 cursor-default'
    return 'border-gray-200 dark:border-white/10 opacity-40 cursor-default'
  }

  if (respondeu && r?.alternativaEscolhida === idx)
    return 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500/20'

  return 'border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 cursor-pointer'
}

const LETRAS = ['A', 'B', 'C', 'D', 'E']
</script>

<template>
  <main class="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0f0e17]">
    <!-- Header fixo — pr-14 reserva espaço para o botão de tema fixo (top-4 right-4 w-9) -->
    <header
      class="sticky top-0 z-10 bg-white/90 dark:bg-[#0f0e17]/90 backdrop-blur-md border-b border-gray-100 dark:border-white/5 px-4 py-4">
      <div class="max-w-2xl mx-auto flex items-center gap-4 pr-14">
        <button @click="mostrarModal = true"
          class="shrink-0 flex items-center gap-1.5 text-sm font-medium text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white/70 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Início</span>
        </button>

        <div class="flex-1">
          <div class="flex justify-between text-xs text-gray-400 dark:text-white/30 mb-2">
            <span class="font-semibold">{{ indiceAtual + 1 }} / {{ questoesEmbaralhadas.length }}</span>
            <span>{{ progresso }}%</span>
          </div>
          <div class="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
            <div class="h-full bg-violet-500 rounded-full transition-all duration-500 ease-out"
              :style="{ width: progresso + '%' }" />
          </div>
        </div>
      </div>
    </header>

    <!-- Conteúdo com slide -->
    <div class="flex-1 flex items-start justify-center p-4 pt-6 overflow-hidden">
      <div class="w-full max-w-2xl space-y-4 transition-all duration-200" :class="questaoVisivel
        ? 'opacity-100 translate-x-0'
        : direcaoSlide === 'out' ? 'opacity-0 -translate-x-4' : 'opacity-0 translate-x-4'">
        <template v-if="questaoAtual">
          <!-- Chip disciplina -->
          <span
            class="inline-block text-xs font-semibold bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800/50">
            {{ questaoAtual.questao.disciplina }}
          </span>

          <!-- Enunciado -->
          <div
            class="bg-white dark:bg-white/[0.04] rounded-2xl border border-gray-100 dark:border-white/8 p-5 shadow-sm">
            <p class="text-gray-900 dark:text-white/90 leading-relaxed font-semibold text-[15px]">
              {{ questaoAtual.questao.enunciado }}
            </p>
          </div>

          <!-- Alternativas -->
          <div class="space-y-2.5">
            <button v-for="(alt, idx) in questaoAtual.alternativasEmbaralhadas" :key="idx" @click="responder(idx)"
              :disabled="mostrarRespostaAtual" :class="[
                'w-full text-left flex items-start gap-3 rounded-xl border-2 p-4 transition-all duration-150 active:scale-[0.99]',
                classeAlternativa(idx),
              ]">
              <span
                class="shrink-0 w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
                {{ LETRAS[idx] }}
              </span>
              <span class="pt-0.5 text-sm leading-relaxed">{{ alt.texto }}</span>
            </button>
          </div>

          <!-- Explicação -->
          <Transition name="slide-down">
            <div v-if="mostrarRespostaAtual && questaoAtual.questao.explicacao"
              class="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 space-y-2">
              <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Explicação</p>
              <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ questaoAtual.questao.explicacao }}
              </p>
              <p class="text-xs text-gray-400 mt-1">
                <template v-if="questaoAtual.questao.fonte.tipo === 'apostila'">
                  📖 {{ questaoAtual.questao.fonte.descricao }} — p. {{ questaoAtual.questao.fonte.pagina }}
                </template>
                <template v-else-if="questaoAtual.questao.fonte.tipo === 'video'">
                  🎬 {{ questaoAtual.questao.fonte.descricao }} — {{ questaoAtual.questao.fonte.minuto }}min
                </template>
                <template v-else>{{ questaoAtual.questao.fonte.descricao }}</template>
              </p>
            </div>
          </Transition>

          <!-- Botão próxima — sempre visível, inativo sem resposta -->
          <div class="flex items-center justify-between pb-4">
            <a :href="sessao ? urlErro(sessao.sessionId, questaoAtual?.questao.id ?? '') : '#'" target="_blank" @click="sessao && questaoAtual && trackErrorReported({
              questaoId: questaoAtual.questao.id,
              disciplina: questaoAtual.questao.disciplina,
              sessaoId: sessao.sessionId,
            })" rel="noopener noreferrer"
              class="text-xs text-gray-400 dark:text-white/25 hover:text-red-500 dark:hover:text-red-400 transition-colors">
              ⚠️ Reportar erro
            </a>
            <button @click="avancar" :disabled="!podeAvancar" :class="[
              'px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-150',
              podeAvancar
                ? 'bg-violet-600 hover:bg-violet-500 text-white active:scale-95 shadow-lg shadow-violet-500/20'
                : 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed',
            ]">
              {{ indiceAtual === questoesEmbaralhadas.length - 1 ? 'Ver resultado' : 'Próxima →' }}
            </button>
          </div>
        </template>

        <!-- Tela calculando resultado -->
        <template v-if="finalizado">
          <div class="flex flex-col items-center justify-center min-h-64 gap-4 animate-fadein">
            <div class="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center">
              <svg class="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p class="text-gray-600 dark:text-white/60 font-semibold text-sm">Calculando resultado...</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Modal voltar -->
    <Transition name="fade">
      <div v-if="mostrarModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="mostrarModal = false">
        <div
          class="bg-white dark:bg-[#1e1b2e] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 p-6 w-full max-w-sm space-y-4 animate-fadein">
          <div class="text-center space-y-2">
            <div
              class="w-12 h-12 bg-amber-100 dark:bg-amber-950/60 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" stroke-width="2"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 class="font-bold text-gray-900 dark:text-white">Voltar ao início?</h3>
            <p class="text-sm text-gray-500 dark:text-white/40">
              O progresso atual será perdido.
            </p>
          </div>
          <div class="flex gap-3">
            <button @click="mostrarModal = false"
              class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              Continuar
            </button>
            <button @click="confirmarVoltar"
              class="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors active:scale-95">
              Sim, voltar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
@keyframes fadein {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadein {
  animation: fadein 0.35s ease both;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>