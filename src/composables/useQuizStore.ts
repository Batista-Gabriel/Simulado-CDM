import { ref, computed, readonly } from "vue";
import type {
  Questao,
  QuestaoEmbaralhada,
  RespostaUsuario,
  SessaoQuiz,
  ConfiguracaoInicio,
  AlternativaEmbaralhada,
} from "@/types/quiz";
import { useStorage } from "./useStorage";
import { useAnalytics } from "./useAnalytics";

// ─── Utilitários ─────────────────────────────────────────────────────────────

function gerarSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function embaralharQuestao(q: Questao): QuestaoEmbaralhada {
  const alts: AlternativaEmbaralhada[] = q.alternativas.map(
    (texto, originalIndex) => ({ texto, originalIndex }),
  );
  const embaralhadas = embaralhar(alts);
  return {
    questao: q,
    alternativasEmbaralhadas: embaralhadas,
    indiceCorretaEmbaralhada: embaralhadas.findIndex(
      (a) => a.originalIndex === q.correta,
    ),
  };
}

function selecionarDistribuido(
  todas: Questao[],
  disciplinas: string[],
  total: number,
): Questao[] {
  const porDisc: Record<string, Questao[]> = {};
  for (const d of disciplinas)
    porDisc[d] = embaralhar(todas.filter((q) => q.disciplina === d));

  const base = Math.floor(total / disciplinas.length);
  const extras = total % disciplinas.length;
  const ordem = embaralhar([...disciplinas]);

  const result: Questao[] = [];
  ordem.forEach((d, i) =>
    result.push(...porDisc[d].slice(0, base + (i < extras ? 1 : 0))),
  );
  return embaralhar(result);
}

// ─── Estado singleton ─────────────────────────────────────────────────────────

const sessao = ref<SessaoQuiz | null>(null);
const questoesEmb = ref<QuestaoEmbaralhada[]>([]);
const respostas = ref<RespostaUsuario[]>([]);
const indiceAtual = ref(0);
const finalizado = ref(false);
const mostrarRespAtual = ref(false);
const tempoSegundos = ref(0);

let t0Total = Date.now();
let t0Questao = Date.now();
let tempoTotal = 0;
let timer: ReturnType<typeof setInterval> | null = null;

// ─── Computed ─────────────────────────────────────────────────────────────────

const questaoAtual = computed(
  () => questoesEmb.value[indiceAtual.value] ?? null,
);
const respostaAtual = computed(
  () => respostas.value[indiceAtual.value] ?? null,
);
const progresso = computed(() =>
  questoesEmb.value.length === 0
    ? 0
    : Math.round((indiceAtual.value / questoesEmb.value.length) * 100),
);
const totalAcertos = computed(
  () => respostas.value.filter((r) => r.correta).length,
);
const percentualAcertos = computed(() => {
  const resp = respostas.value.filter((r) => r.correta !== null).length;
  return resp === 0 ? 0 : Math.round((totalAcertos.value / resp) * 100);
});

const acertosPorDisciplina = computed(() => {
  const mapa: Record<string, { acertos: number; total: number }> = {};
  questoesEmb.value.forEach((q, i) => {
    const d = q.questao.disciplina;
    if (!mapa[d]) mapa[d] = { acertos: 0, total: 0 };
    mapa[d].total++;
    if (respostas.value[i]?.correta) mapa[d].acertos++;
  });
  return Object.entries(mapa)
    .map(([disciplina, v]) => ({ disciplina, ...v }))
    .sort((a, b) => a.acertos / a.total - b.acertos / b.total);
});

// ─── Métodos ──────────────────────────────────────────────────────────────────

function configurar(config: ConfiguracaoInicio, todas: Questao[]) {
  const sel = selecionarDistribuido(
    todas,
    config.disciplinas,
    config.quantidade,
  );
  questoesEmb.value = sel.map(embaralharQuestao);
  respostas.value = sel.map((q) => ({
    questaoId: q.id,
    alternativaEscolhida: null,
    correta: null,
    tempoSegundos: 0,
  }));
  indiceAtual.value = 0;
  finalizado.value = false;
  mostrarRespAtual.value = false;

  sessao.value = {
    sessionId: gerarSessionId(),
    nome: config.nome,
    disciplinasSelecionadas: config.disciplinas,
    quantidadeQuestoes: config.quantidade,
    mostrarRespostaImediata: config.mostrarRespostaImediata,
    timestampInicio: new Date().toISOString(),
    respostas: [],
  };

  t0Total = Date.now();
  t0Questao = Date.now();
  tempoSegundos.value = 0;

  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    tempoSegundos.value = Math.floor((Date.now() - t0Total) / 1000);
  }, 1000);

  const { salvarSessao } = useStorage();
  salvarSessao({
    sessao: sessao.value,
    questoesEmbaralhadas: questoesEmb.value,
    respostas: respostas.value,
    indiceAtual: 0,
  });

  const { trackQuizStarted } = useAnalytics();
  trackQuizStarted({
    disciplinas: config.disciplinas,
    quantidade: config.quantidade,
    sessaoId: sessao.value.sessionId,
  });
}

function responder(idx: number) {
  if (!sessao.value || mostrarRespAtual.value) return;
  const atual = questoesEmb.value[indiceAtual.value];
  if (!atual) return;

  const tempoGasto = Math.floor((Date.now() - t0Questao) / 1000);
  const correta = idx === atual.indiceCorretaEmbaralhada;

  respostas.value[indiceAtual.value] = {
    questaoId: atual.questao.id,
    alternativaEscolhida: idx,
    correta,
    tempoSegundos: tempoGasto,
  };

  if (sessao.value.mostrarRespostaImediata) mostrarRespAtual.value = true;

  const { trackQuestionAnswered } = useAnalytics();
  trackQuestionAnswered({
    questaoId: atual.questao.id,
    disciplina: atual.questao.disciplina,
    correta,
    tempoSegundos: tempoGasto,
    sessaoId: sessao.value.sessionId,
  });

  const { salvarSessao } = useStorage();
  if (sessao.value) {
    salvarSessao({
      sessao: sessao.value,
      questoesEmbaralhadas: questoesEmb.value,
      respostas: respostas.value,
      indiceAtual: indiceAtual.value,
    });
  }
}

function proximaQuestao() {
  mostrarRespAtual.value = false;
  t0Questao = Date.now();
  if (indiceAtual.value < questoesEmb.value.length - 1) {
    indiceAtual.value++;
  } else {
    _finalizar();
  }
}

async function _finalizar() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  tempoTotal = Date.now() - t0Total;
  finalizado.value = true;

  if (!sessao.value) return;
  sessao.value.timestampFim = new Date().toISOString();
  sessao.value.respostas = [...respostas.value];

  const { limparSessao } = useStorage();
  limparSessao();

  const { trackQuizCompleted } = useAnalytics();
  await trackQuizCompleted(sessao.value, tempoTotal);
}

function registrarAbandono() {
  if (!sessao.value || finalizado.value) return;
  const { trackQuizAbandoned } = useAnalytics();
  trackQuizAbandoned({
    indiceQuestao: indiceAtual.value,
    totalQuestoes: questoesEmb.value.length,
    sessaoId: sessao.value.sessionId,
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function useQuizStore() {
  return {
    sessao: readonly(sessao),
    questoesEmbaralhadas: readonly(questoesEmb),
    respostas: readonly(respostas),
    indiceAtual: readonly(indiceAtual),
    finalizado: readonly(finalizado),
    mostrarRespostaAtual: readonly(mostrarRespAtual),
    tempoSegundos: readonly(tempoSegundos),
    questaoAtual,
    respostaAtual,
    progresso,
    totalAcertos,
    percentualAcertos,
    acertosPorDisciplina,
    configurar,
    responder,
    proximaQuestao,
    registrarAbandono,
  };
}
