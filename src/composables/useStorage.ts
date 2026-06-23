import type { SessaoQuiz, QuestaoEmbaralhada, RespostaUsuario } from '@/types/quiz'

const STORAGE_KEY = 'quiz_mvp_sessao'

interface EstadoSalvo {
  sessao: SessaoQuiz
  questoesEmbaralhadas: QuestaoEmbaralhada[]
  respostas: RespostaUsuario[]
  indiceAtual: number
}

export function useStorage() {
  function salvarSessao(estado: EstadoSalvo): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado))
    } catch {
      // localStorage pode falhar em modo privado — não é crítico
    }
  }

  function recuperarSessao(): EstadoSalvo | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as EstadoSalvo
    } catch {
      return null
    }
  }

  function limparSessao(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // silencioso
    }
  }

  return { salvarSessao, recuperarSessao, limparSessao }
}
