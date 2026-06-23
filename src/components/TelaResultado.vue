<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/composables/useQuizStore'
import { useFormUrls } from '@/composables/useFormUrls'
import { useAnalytics } from '@/composables/useAnalytics'

const { trackFeedbackClicked } = useAnalytics()
const { urlFeedback } = useFormUrls()

const router = useRouter()
const { sessao, questoesEmbaralhadas, respostas, totalAcertos, percentualAcertos, acertosPorDisciplina } = useQuizStore()

onMounted(() => { if (!sessao.value) router.replace('/') })

const expandidos = ref<Set<string>>(new Set())

function toggleItem(id: string) {
  if (expandidos.value.has(id)) expandidos.value.delete(id)
  else expandidos.value.add(id)
}


const questoesComGabarito = computed(() =>
  questoesEmbaralhadas.value.map((q, i) => ({
    ...q, resposta: respostas.value[i], numero: i + 1,
  }))
)

const nivel = computed(() => {
  const p = percentualAcertos.value
  if (p >= 90) return { texto: 'Excelente!', emoji: '🏆', cor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50' }
  if (p >= 70) return { texto: 'Muito bom!', emoji: '🎯', cor: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/50' }
  if (p >= 50) return { texto: 'Bom esforço', emoji: '📚', cor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50' }
  return { texto: 'Continue estudando', emoji: '💪', cor: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50' }
})

const LETRAS = ['A', 'B', 'C', 'D', 'E']
</script>

<template>
  <main v-if="sessao" class="min-h-screen bg-gray-50 dark:bg-[#0f0e17] p-4 pb-16">
    <div class="max-w-2xl mx-auto pt-8 pr-12 space-y-6">

      <!-- Hero resultado -->
      <div :class="['rounded-2xl border p-6 text-center space-y-2 animate-fadein', nivel.bg]">
        <p class="text-4xl">{{ nivel.emoji }}</p>
        <p :class="['text-4xl font-extrabold', nivel.cor]">{{ percentualAcertos }}%</p>
        <p :class="['font-bold text-lg', nivel.cor]">{{ nivel.texto }}</p>
        <p class="text-gray-500 dark:text-white/40 text-sm">
          {{ totalAcertos }} de {{ questoesEmbaralhadas.length }} questões certas
          <span v-if="sessao.nome"> · {{ sessao.nome }}</span>
        </p>
      </div>

      <!-- Resumo por disciplina -->
      <div v-if="acertosPorDisciplina.length > 1" class="space-y-3 animate-fadein" style="animation-delay: 0.1s">
        <h3 class="text-xs font-bold text-gray-500 dark:text-white/30 uppercase tracking-widest">Por disciplina</h3>
        <div class="space-y-2">
          <div v-for="item in acertosPorDisciplina" :key="item.disciplina"
            class="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 px-4 py-3">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-sm font-semibold text-gray-800 dark:text-white/80">{{ item.disciplina }}</span>
              <span class="text-sm font-bold tabular-nums"
                :class="item.acertos / item.total >= 0.7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'">
                {{ item.acertos }}/{{ item.total }}
              </span>
            </div>
            <div class="h-1 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                :class="item.acertos / item.total >= 0.7 ? 'bg-emerald-500' : 'bg-red-400'"
                :style="{ width: `${(item.acertos / item.total) * 100}%` }" />
            </div>
          </div>
        </div>
      </div>

      <!-- Gabarito accordion -->
      <div class="space-y-3 animate-fadein" style="animation-delay: 0.2s">
        <h3 class="text-xs font-bold text-gray-500 dark:text-white/30 uppercase tracking-widest">Gabarito</h3>

        <div v-for="item in questoesComGabarito" :key="item.questao.id"
          class="bg-white dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/8 overflow-hidden">
          <!-- Header accordion -->
          <button @click="toggleItem(item.questao.id)"
            class="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
            <span :class="[
              'shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
              item.resposta?.correta ? 'bg-emerald-500' : 'bg-red-400',
            ]">
              {{ item.resposta?.correta ? '✓' : '✗' }}
            </span>
            <span class="flex-1 text-sm font-medium text-gray-800 dark:text-white/80 line-clamp-1">
              {{ item.numero }}. {{ item.questao.enunciado }}
            </span>
            <svg class="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
              :class="expandidos.has(item.questao.id) ? 'rotate-180' : ''" fill="none" stroke="currentColor"
              stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Conteúdo expandido -->
          <Transition name="accordion">
            <div v-if="expandidos.has(item.questao.id)"
              class="border-t border-gray-50 dark:border-white/5 px-4 pb-4 pt-3 space-y-3">
              <!-- Enunciado completo -->
              <p class="text-sm text-gray-700 dark:text-white/70 leading-relaxed font-medium">
                {{ item.questao.enunciado }}
              </p>

              <!-- Alternativas -->
              <div class="space-y-1.5">
                <div v-for="(alt, idx) in item.alternativasEmbaralhadas" :key="idx" :class="[
                  'flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm',
                  idx === item.indiceCorretaEmbaralhada
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : idx === item.resposta?.alternativaEscolhida && !item.resposta?.correta
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                      : 'text-gray-400 dark:text-white/30',
                ]">
                  <span class="shrink-0 font-bold text-xs w-4 mt-0.5">{{ LETRAS[idx] }}</span>
                  <span>{{ alt.texto }}</span>
                </div>
              </div>

              <!-- Explicação -->
              <div v-if="item.questao.explicacao"
                class="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg px-3 py-2.5 space-y-1 border border-indigo-100 dark:border-indigo-800/30">
                <p class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Explicação
                </p>
                <p class="text-xs text-gray-600 dark:text-white/50 leading-relaxed">{{ item.questao.explicacao }}</p>
                <p class="text-xs text-gray-400 dark:text-white/30 mt-1">
                  <template v-if="item.questao.fonte.tipo === 'apostila'">
                    📖 {{ item.questao.fonte.descricao }} — p. {{ item.questao.fonte.pagina }}
                  </template>
                  <template v-else-if="item.questao.fonte.tipo === 'video'">
                    🎬 {{ item.questao.fonte.descricao }} — {{ item.questao.fonte.minuto }}min
                  </template>
                  <template v-else>{{ item.questao.fonte.descricao }}</template>
                </p>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Ações -->
      <div class="flex flex-col sm:flex-row gap-3 animate-fadein" style="animation-delay: 0.3s">
        <a :href="urlFeedback()" @click="trackFeedbackClicked" target="_blank" rel="noopener noreferrer"
          class="flex-1 text-center py-3 rounded-xl border-2 border-violet-200 dark:border-violet-800/50 text-violet-600 dark:text-violet-400 font-bold text-sm hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
          Deixar feedback
        </a>
        <button @click="router.push('/')"
          class="flex-1 py-3 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-500/20">
          Novo simulado
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
@keyframes fadein {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadein {
  animation: fadein 0.4s ease both;
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 800px;
}
</style>