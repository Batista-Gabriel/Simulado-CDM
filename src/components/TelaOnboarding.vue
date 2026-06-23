<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ConfiguracaoInicio, Questao } from '@/types/quiz'
import { todasQuestoes } from '@/data/questoes'
import { useQuizStore } from '@/composables/useQuizStore'

const router = useRouter()
const { configurar } = useQuizStore()

const questoes = todasQuestoes as Questao[]
const LIMITE = 40

// ── Estado ──────────────────────────────────────────────────────────────────
const step = ref(0)
const direcao = ref<'forward' | 'back'>('forward')
const nome = ref('')
const shake = ref(false) // shake no botão quando desabilitado

const disciplinasDisponiveis = computed(() =>
    [...new Set(questoes.map((q) => q.disciplina))].sort()
)
const selecionadas = ref<string[]>([...disciplinasDisponiveis.value])
const todasOn = computed(() => selecionadas.value.length === disciplinasDisponiveis.value.length)

const quantDisponivel = computed(() => {
    const total = questoes.filter((q) => selecionadas.value.includes(q.disciplina)).length
    return Math.min(total, LIMITE)
})
const quantidade = ref(Math.min(quantDisponivel.value, LIMITE))

watch(quantDisponivel, (max) => {
    if (quantidade.value > max) quantidade.value = max
    if (max >= LIMITE && quantidade.value < LIMITE) quantidade.value = LIMITE
})

const mostrarImediato = ref(false)

const sliderPct = computed(() =>
    quantDisponivel.value <= 1 ? 100 : ((quantidade.value - 1) / (quantDisponivel.value - 1)) * 100
)

// ── Navegação ────────────────────────────────────────────────────────────────
function avancar() {
    if (step.value === 1 && selecionadas.value.length === 0) {
        // Shake para indicar que precisa selecionar ao menos uma disciplina
        shake.value = true
        setTimeout(() => { shake.value = false }, 500)
        return
    }
    if (step.value < 2) {
        direcao.value = 'forward'
        step.value++
    } else {
        iniciar()
    }
}

function voltar() {
    if (step.value === 0) return
    direcao.value = 'back'
    step.value--
}

// ── Disciplinas ──────────────────────────────────────────────────────────────
function toggleDisciplina(d: string) {
    const idx = selecionadas.value.indexOf(d)
    if (idx >= 0) {
        if (selecionadas.value.length > 1)
            selecionadas.value = selecionadas.value.filter((_, i) => i !== idx)
    } else {
        selecionadas.value = [...selecionadas.value, d]
    }
}

function toggleTodas() {
    selecionadas.value = todasOn.value
        ? [disciplinasDisponiveis.value[0]]
        : [...disciplinasDisponiveis.value]
}

// ── Iniciar ──────────────────────────────────────────────────────────────────
function iniciar() {
    configurar({
        nome: nome.value.trim(),
        disciplinas: [...selecionadas.value],
        quantidade: quantidade.value,
        mostrarRespostaImediata: mostrarImediato.value,
    } as ConfiguracaoInicio, questoes)
    router.push('/quiz')
}

// ── Labels ───────────────────────────────────────────────────────────────────
const stepTitulo = ['Identificação', 'Disciplinas', 'Configurações']
const stepSubtitulo = [
    'Como quer ser chamado?',
    'Escolha o que quer estudar',
    'Ajuste como quer fazer o simulado',
]
const btnLabel = computed(() => step.value === 2 ? 'Iniciar Simulado' : 'Continuar →')
</script>

<template>
    <!--
    Não usa min-h-screen — herda flex-1 do App.vue para não criar scroll fantasma.
    O flex flex-col + overflow-hidden confina os orbs sem criar scrollbar.
  -->
    <div class="flex flex-col relative overflow-hidden onboarding-bg">

        <!-- Orbs — se movem suavemente conforme o step -->
        <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full
                  bg-violet-600/20 blur-[100px] transition-all duration-700"
                :style="{ transform: `translateX(${step * 40}px)` }" />
            <div class="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full
                  bg-indigo-500/15 blur-[80px] transition-all duration-700"
                :style="{ transform: `translateX(${-step * 30}px)` }" />
        </div>

        <!--
      Conteúdo scrollável apenas quando necessário (step 1 com 24 disciplinas).
      padding-bottom reserva espaço para o botão fixo (56px) + step dots (32px) + gap.
    -->
        <div class="relative z-10 flex flex-col max-w-lg mx-auto w-full px-5 pt-12 pb-40 flex-1 overflow-y-auto">

            <!-- Cabeçalho: botão voltar + ícone (step 0) + título animado -->
            <div class="mb-6 pr-12">
                <button v-if="step > 0" @click="voltar" class="flex items-center gap-1.5 text-sm mb-4 transition-colors select-none cursor-pointer
                 text-onboarding-muted hover:text-onboarding">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar
                </button>

                <div v-if="step === 0" class="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4
                 bg-violet-500/20 border border-violet-500/30">
                    <svg class="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" stroke-width="1.5"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                </div>

                <!-- Título desliza junto com o conteúdo -->
                <div class="relative min-h-14 overflow-hidden">
                    <Transition :name="direcao === 'forward' ? 'slide-fwd' : 'slide-back'" mode="out-in">
                        <div :key="step">
                            <h2 class="text-2xl font-extrabold tracking-tight text-onboarding">
                                {{ stepTitulo[step] }}
                            </h2>
                            <p class="text-sm mt-1 text-onboarding-muted">{{ stepSubtitulo[step] }}</p>
                        </div>
                    </Transition>
                </div>
            </div>

            <!-- Área de conteúdo animada -->
            <div class="relative flex-1 min-h-0">
                <Transition :name="direcao === 'forward' ? 'slide-fwd' : 'slide-back'" mode="out-in">

                    <!-- Step 0: nome -->
                    <div v-if="step === 0" key="s0" class="space-y-3">
                        <label class="block text-xs font-bold uppercase tracking-widest text-onboarding-muted">
                            Nome ou apelido <span class="font-normal normal-case">(opcional)</span>
                        </label>
                        <input v-model="nome" type="text" placeholder="Como quer ser identificado?" maxlength="60"
                            @keydown.enter="avancar" class="input-onboarding w-full rounded-xl px-4 py-3 text-sm transition-all
                     focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50" />
                        <p class="text-xs text-onboarding-muted opacity-60">Usado apenas para identificar seu resultado
                        </p>
                    </div>

                    <!-- Step 1: disciplinas -->
                    <div v-else-if="step === 1" key="s1" class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-medium text-onboarding-muted">
                                {{ selecionadas.length }} de {{ disciplinasDisponiveis.length }} selecionadas
                            </span>
                            <button @click="toggleTodas" class="text-xs font-semibold text-violet-500 hover:text-violet-400 transition-colors
                       select-none cursor-pointer">
                                {{ todasOn ? 'Desmarcar todas' : 'Selecionar todas' }}
                            </button>
                        </div>

                        <!-- Hint quando nenhuma disciplina selecionada -->
                        <Transition name="fade-hint">
                            <p v-if="selecionadas.length === 0"
                                class="text-xs text-amber-500 dark:text-amber-400 font-medium">
                                ⚠️ Selecione ao menos uma disciplina para continuar
                            </p>
                        </Transition>

                        <div class="grid grid-cols-2 gap-2">
                            <button v-for="d in disciplinasDisponiveis" :key="d" type="button"
                                @click="toggleDisciplina(d)" :class="[
                                    'relative flex items-center justify-center text-center px-3 py-4',
                                    'rounded-2xl border text-sm font-semibold select-none',
                                    'transition-all duration-150 active:scale-95',
                                    selecionadas.includes(d) ? 'chip-active' : 'chip-inactive cursor-pointer',
                                ]">
                                <span v-if="selecionadas.includes(d)" class="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500
                         flex items-center justify-center pointer-events-none">
                                    <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor"
                                        stroke-width="3" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span class="leading-snug pointer-events-none">{{ d }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Step 2: configurações -->
                    <div v-else key="s2" class="space-y-6">
                        <div class="card-surface rounded-2xl p-4">
                            <p class="text-xs font-bold uppercase tracking-widest mb-1 text-onboarding-muted">
                                Disciplinas</p>
                            <p class="font-semibold text-onboarding">
                                {{ selecionadas.length }} selecionada{{ selecionadas.length !== 1 ? 's' : '' }}
                            </p>
                        </div>

                        <div class="space-y-3">
                            <div class="flex items-end justify-between">
                                <div>
                                    <p class="text-xs font-bold uppercase tracking-widest mb-1 text-onboarding-muted">
                                        Questões</p>
                                    <p class="text-xs text-onboarding-muted">máx. disponível: {{ quantDisponivel }}</p>
                                </div>
                                <span class="text-5xl font-extrabold tabular-nums leading-none text-onboarding">{{
                                    quantidade }}</span>
                            </div>
                            <input v-model.number="quantidade" type="range" :min="1" :max="quantDisponivel"
                                class="slider w-full h-1.5 appearance-none rounded-full outline-none cursor-pointer"
                                :style="{ '--pct': sliderPct + '%' }" />
                            <div class="flex justify-between text-xs text-onboarding-muted">
                                <span>1</span><span>{{ quantDisponivel }}</span>
                            </div>
                        </div>

                        <div class="card-surface rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div>
                                <p class="text-sm font-semibold text-onboarding">Gabarito após cada questão</p>
                                <p class="text-xs mt-0.5 text-onboarding-muted">Padrão: ver apenas no resultado final
                                </p>
                            </div>
                            <button @click="mostrarImediato = !mostrarImediato" :class="['relative shrink-0 w-12 h-6 rounded-full transition-all duration-300 select-none cursor-pointer',
                                mostrarImediato ? 'bg-violet-600' : 'toggle-off']" role="switch"
                                :aria-checked="mostrarImediato">
                                <span :class="['absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300',
                                    mostrarImediato ? 'translate-x-6' : 'translate-x-0']" />
                            </button>
                        </div>
                    </div>

                </Transition>
            </div>
        </div>

        <!-- Step indicator -->
        <div class="absolute bottom-[4.75rem] left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
            <span v-for="i in 3" :key="i" :class="['h-1.5 rounded-full transition-all duration-300',
                step === i - 1 ? 'w-6 bg-violet-500' : 'w-1.5 step-dot']" />
        </div>

        <!-- Botão fixo acima do footer do App.vue -->
        <!-- O footer tem ~44px; somamos o gap de 8px = 52px de bottom -->
        <div class="sticky bottom-0 z-20 px-5 pt-6 pb-3 btn-gradient-overlay pointer-events-none">
            <div class="max-w-lg mx-auto pointer-events-auto">
                <button @click="avancar" :class="[
                    'w-full py-3.5 rounded-xl font-bold text-sm text-white select-none',
                    'transition-all duration-150 shadow-lg shadow-violet-500/25 cursor-pointer',
                    selecionadas.length === 0 && step === 1
                        ? 'bg-violet-600/50 cursor-not-allowed'
                        : 'bg-violet-600 hover:bg-violet-500 active:scale-95',
                    shake ? 'animate-shake' : '',
                ]">
                    {{ btnLabel }}
                </button>
            </div>
        </div>

    </div>
</template>

<style scoped>
/* ── Tokens por tema ─────────────────────────────────────────────────────── */
:root.dark div,
div {
    --ob-bg: #0f0e17;
    --ob-text: #ffffff;
    --ob-muted: rgba(255, 255, 255, 0.4);
    --ob-card-bg: rgba(255, 255, 255, 0.04);
    --ob-card-border: rgba(255, 255, 255, 0.08);
    --ob-toggle-off: rgba(255, 255, 255, 0.12);
    --ob-slider-track: rgba(255, 255, 255, 0.12);
    --ob-input-bg: rgba(255, 255, 255, 0.05);
    --ob-input-border: rgba(255, 255, 255, 0.10);
    --ob-input-text: #ffffff;
    --ob-input-placeholder: rgba(255, 255, 255, 0.2);
    --ob-chip-active-bg: rgba(124, 58, 237, 0.3);
    --ob-chip-active-border: rgba(167, 139, 250, 0.6);
    --ob-chip-active-text: #ffffff;
    --ob-chip-bg: rgba(255, 255, 255, 0.04);
    --ob-chip-border: rgba(255, 255, 255, 0.10);
    --ob-chip-text: rgba(255, 255, 255, 0.5);
    --ob-chip-hover-bg: rgba(255, 255, 255, 0.07);
    --ob-chip-hover-border: rgba(255, 255, 255, 0.2);
    --ob-grad: #0f0e17;
}

:root:not(.dark) .onboarding-bg {
    --ob-bg: #f9fafb;
    --ob-text: #111827;
    --ob-muted: #6b7280;
    --ob-card-bg: #ffffff;
    --ob-card-border: #e5e7eb;
    --ob-toggle-off: #d1d5db;
    --ob-slider-track: #e5e7eb;
    --ob-input-bg: #ffffff;
    --ob-input-border: #e5e7eb;
    --ob-input-text: #111827;
    --ob-input-placeholder: #d1d5db;
    --ob-chip-active-bg: rgba(109, 40, 217, 0.08);
    --ob-chip-active-border: rgba(109, 40, 217, 0.5);
    --ob-chip-active-text: #5b21b6;
    --ob-chip-bg: #ffffff;
    --ob-chip-border: #e5e7eb;
    --ob-chip-text: #6b7280;
    --ob-chip-hover-bg: #f5f3ff;
    --ob-chip-hover-border: #c4b5fd;
    --ob-grad: #f9fafb;
}

.onboarding-bg {
    background-color: var(--ob-bg);
    transition: background-color 0.3s;
}

.text-onboarding {
    color: var(--ob-text);
}

.text-onboarding-muted {
    color: var(--ob-muted);
}

.input-onboarding {
    background-color: var(--ob-input-bg);
    border: 1px solid var(--ob-input-border);
    color: var(--ob-input-text);
}

.input-onboarding::placeholder {
    color: var(--ob-input-placeholder);
}

.card-surface {
    background-color: var(--ob-card-bg);
    border: 1px solid var(--ob-card-border);
}

.toggle-off {
    background-color: var(--ob-toggle-off);
}

.chip-active {
    background-color: var(--ob-chip-active-bg);
    border: 2px solid var(--ob-chip-active-border);
    color: var(--ob-chip-active-text);
    cursor: default;
}

.chip-inactive {
    background-color: var(--ob-chip-bg);
    border: 2px solid var(--ob-chip-border);
    color: var(--ob-chip-text);
}

.chip-inactive:hover {
    background-color: var(--ob-chip-hover-bg);
    border-color: var(--ob-chip-hover-border);
    color: var(--ob-text);
}

.step-dot {
    background-color: var(--ob-muted);
    opacity: 0.35;
}

.btn-gradient-overlay {
    background: linear-gradient(to top, var(--ob-grad) 55%, transparent);
}

/* Slider */
.slider {
    background: linear-gradient(to right, #7c3aed var(--pct), var(--ob-slider-track) var(--pct));
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.35);
}

.slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.35);
}

/* ── Transições de slide ─────────────────────────────────────────────────── */
.slide-fwd-enter-active,
.slide-fwd-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
    transition: opacity 0.22s ease, transform 0.22s ease;
    position: absolute;
    width: 100%;
}

.slide-fwd-enter-from {
    opacity: 0;
    transform: translateX(32px);
}

.slide-fwd-leave-to {
    opacity: 0;
    transform: translateX(-32px);
}

.slide-back-enter-from {
    opacity: 0;
    transform: translateX(-32px);
}

.slide-back-leave-to {
    opacity: 0;
    transform: translateX(32px);
}

/* Hint fade */
.fade-hint-enter-active,
.fade-hint-leave-active {
    transition: all 0.2s ease;
}

.fade-hint-enter-from,
.fade-hint-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

/* Shake no botão */
@keyframes shake {

    0%,
    100% {
        transform: translateX(0);
    }

    20% {
        transform: translateX(-6px);
    }

    40% {
        transform: translateX(6px);
    }

    60% {
        transform: translateX(-4px);
    }

    80% {
        transform: translateX(4px);
    }
}

.animate-shake {
    animation: shake 0.45s ease;
}
</style>