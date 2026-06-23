import type { SessaoQuiz } from "@/types/quiz";

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL ?? "";

// ── Helpers ──────────────────────────────────────────────────────────────────

function track(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function")
    return;
  window.gtag("event", eventName, params ?? {});
}

/**
 * Retorna o número de vezes que este client_id já completou um quiz.
 * Incrementa e persiste no localStorage a cada chamada.
 */
function contarRepeticao(): number {
  const key = "quiz_completion_count";
  const atual = parseInt(localStorage.getItem(key) ?? "0", 10);
  const novo = atual + 1;
  localStorage.setItem(key, String(novo));
  return novo;
}

// ── Composable ───────────────────────────────────────────────────────────────

export function useAnalytics() {
  /** Dispara quando o usuário clica em "Iniciar Simulado" */
  function trackQuizStarted(params: {
    disciplinas: string[];
    quantidade: number;
    sessaoId: string;
  }): void {
    track("quiz_started", {
      disciplinas: params.disciplinas.join(", "),
      num_disciplinas: params.disciplinas.length,
      quantidade_questoes: params.quantidade,
      session_id: params.sessaoId,
    });
  }

  /** Dispara quando o usuário sai do quiz sem finalizar (beforeunload) */
  function trackQuizAbandoned(params: {
    indiceQuestao: number;
    totalQuestoes: number;
    sessaoId: string;
  }): void {
    const percentual = Math.round(
      (params.indiceQuestao / params.totalQuestoes) * 100,
    );
    track("quiz_abandoned", {
      questao_index: params.indiceQuestao,
      total_questoes: params.totalQuestoes,
      percentual_concluido: percentual,
      session_id: params.sessaoId,
    });
  }

  /** Dispara quando o usuário responde uma questão */
  function trackQuestionAnswered(params: {
    questaoId: string;
    disciplina: string;
    correta: boolean;
    tempoSegundos: number;
    sessaoId: string;
  }): void {
    track("question_answered", {
      questao_id: params.questaoId,
      disciplina: params.disciplina,
      correta: params.correta,
      tempo_segundos: params.tempoSegundos,
      session_id: params.sessaoId,
    });
  }

  /** Dispara quando o usuário clica em "Reportar erro" */
  function trackErrorReported(params: {
    questaoId: string;
    disciplina: string;
    sessaoId: string;
  }): void {
    track("error_reported", {
      questao_id: params.questaoId,
      disciplina: params.disciplina,
      session_id: params.sessaoId,
    });
  }

  /** Dispara quando o usuário clica em "Deixar feedback" */
  function trackFeedbackClicked(): void {
    track("feedback_clicked");
  }

  /**
   * Dispara ao finalizar o quiz + envia payload ao Google Sheets.
   * Também registra quantas vezes este dispositivo completou o quiz.
   */
  async function trackQuizCompleted(
    sessao: SessaoQuiz,
    tempoTotalMs: number,
  ): Promise<void> {
    const tempoTotalSegundos = Math.floor(tempoTotalMs / 1000);
    const totalAcertos = sessao.respostas.filter((r) => r.correta).length;
    const percentual =
      sessao.quantidadeQuestoes > 0
        ? Math.round((totalAcertos / sessao.quantidadeQuestoes) * 100)
        : 0;
    const vezesConcluido = contarRepeticao();

    // GA4
    track("quiz_completed", {
      session_id: sessao.sessionId,
      percentual_acertos: percentual,
      total_acertos: totalAcertos,
      total_questoes: sessao.quantidadeQuestoes,
      tempo_total_segundos: tempoTotalSegundos,
      vezes_concluido: vezesConcluido, // 1 = primeira vez, 2+ = repetição
      disciplinas: sessao.disciplinasSelecionadas.join(", "),
    });

    // Google Sheets
    await enviarResultados(sessao, tempoTotalMs);
  }

  // ── Google Sheets ───────────────────────────────────────────────────────────

  async function enviarResultados(
    sessao: SessaoQuiz,
    tempoTotalMs: number,
  ): Promise<void> {
    if (!APPS_SCRIPT_URL) {
      console.warn("[Analytics] VITE_APPS_SCRIPT_URL não configurada.");
      return;
    }

    const totalAcertos = sessao.respostas.filter((r) => r.correta).length;
    const payload = {
      sessionId: sessao.sessionId,
      nome: sessao.nome || "Anônimo",
      disciplinas: sessao.disciplinasSelecionadas.join(", "),
      quantidadeQuestoes: sessao.quantidadeQuestoes,
      totalAcertos,
      percentualAcertos:
        sessao.quantidadeQuestoes > 0
          ? Math.round((totalAcertos / sessao.quantidadeQuestoes) * 100)
          : 0,
      tempoTotalSegundos: Math.floor(tempoTotalMs / 1000),
      timestampInicio: sessao.timestampInicio,
      timestampFim: sessao.timestampFim ?? new Date().toISOString(),
      respostasJson: JSON.stringify(
        sessao.respostas.map((r) => ({
          questaoId: r.questaoId,
          correta: r.correta,
          tempoSegundos: r.tempoSegundos,
        })),
      ),
    };

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("[Analytics] Falha ao enviar para Sheets:", err);
      // Fallback local
      try {
        const fallback = JSON.parse(
          localStorage.getItem("quiz_fallback") ?? "[]",
        ) as unknown[];
        fallback.push(payload);
        localStorage.setItem("quiz_fallback", JSON.stringify(fallback));
      } catch {
        // silencioso
      }
    }
  }

  return {
    trackQuizStarted,
    trackQuizAbandoned,
    trackQuizCompleted,
    trackQuestionAnswered,
    trackErrorReported,
    trackFeedbackClicked,
  };
}
