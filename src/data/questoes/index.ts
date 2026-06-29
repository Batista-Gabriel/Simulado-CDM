import type { Questao } from "@/types/quiz";

import administracaoFinanceira from "./administracao-financeira.json";
import apologetica from "./apologetica.json";
import atualidades from "./atualidades.json";
import bibliaManualFe from "./biblia-manual-fe.json";
import caraterEticaIntegridade from "./carater-etica-integridade.json";
import comunicacaoEficaz from "./comunicacao-eficaz.json";
import cristaoPolitica from "./cristao-politica.json";
import estruturaEclesiastica from "./estrutura-eclesiastica.json";
import evangelismoDiscipuladoMissao from "./evangelismo-discipulado-missao.json";
import familia from "./familia.json";
import fatorOracao from "./fator-oracao.json";
import fundamentosTeologiaPentecostal from "./fundamentos-teologia-pentecostal.json";
import gestaoEquipes from "./gestao-equipes.json";
import hermeneutica from "./hermeneutica.json";
import homiletica from "./homiletica.json";
import inciacaoTeologia from "./inciacao-teologia.json";
import liderancaInteligenciaEmocional from "./lideranca-inteligencia-emocional.json";
import liturgia from "./liturgia.json";
import obreiroAprovado from "./obreiro-aprovado.json";
import relacionamentos from "./relacionamentos.json";
import saudeIntegralObreiro from "./saude-integral-obreiro.json";
import vocacaoMinisterial from "./vocacao-ministerial.json";

export const todasQuestoes: Questao[] = [
  ...(administracaoFinanceira as Questao[]),
  ...(apologetica as Questao[]),
  ...(atualidades as Questao[]),
  ...(bibliaManualFe as Questao[]),
  ...(caraterEticaIntegridade as Questao[]),
  ...(comunicacaoEficaz as Questao[]),
  ...(cristaoPolitica as Questao[]),
  ...(estruturaEclesiastica as Questao[]),
  ...(evangelismoDiscipuladoMissao as Questao[]),
  ...(familia as Questao[]),
  ...(fatorOracao as Questao[]),
  ...(fundamentosTeologiaPentecostal as Questao[]),
  ...(gestaoEquipes as Questao[]),
  ...(hermeneutica as Questao[]),
  ...(homiletica as Questao[]),
  ...(inciacaoTeologia as Questao[]),
  ...(liderancaInteligenciaEmocional as Questao[]),
  ...(liturgia as Questao[]),
  ...(obreiroAprovado as Questao[]),
  ...(relacionamentos as Questao[]),
  ...(saudeIntegralObreiro as Questao[]),
  ...(vocacaoMinisterial as Questao[]),
];
