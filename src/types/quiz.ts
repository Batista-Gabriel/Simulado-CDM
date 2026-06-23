export type FonteType = 'apostila' | 'video' | 'site' | 'outro'

export interface Fonte {
  tipo: FonteType
  descricao?: string
  pagina?: number
  minuto?: number
  url?: string
}

export interface Questao {
  id: string
  disciplina: string
  enunciado: string
  alternativas: string[]
  correta: number // índice da alternativa correta no array original
  explicacao: string
  fonte: Fonte
}

export interface AlternativaEmbaralhada {
  texto: string
  originalIndex: number
}

export interface QuestaoEmbaralhada {
  questao: Questao
  alternativasEmbaralhadas: AlternativaEmbaralhada[]
  indiceCorretaEmbaralhada: number
}

export interface RespostaUsuario {
  questaoId: string
  alternativaEscolhida: number | null // índice na lista embaralhada
  correta: boolean | null
  tempoSegundos: number
}

export interface SessaoQuiz {
  sessionId: string
  nome: string
  disciplinasSelecionadas: string[]
  quantidadeQuestoes: number
  mostrarRespostaImediata: boolean
  timestampInicio: string
  timestampFim?: string
  respostas: RespostaUsuario[]
}

export interface ConfiguracaoInicio {
  nome: string
  disciplinas: string[]
  quantidade: number
  mostrarRespostaImediata: boolean
}
