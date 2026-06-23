# Integração GA4

O GA4 é inicializado em `main.ts` via `VITE_GA_ID`.
Se a variável estiver vazia, nenhum evento é disparado — seguro para rodar sem configurar.

---

## 1. Configure a variável de ambiente

Em `.env.local`:

```
VITE_GA_ID=G-XXXXXXXXXX
```

Como encontrar seu Measurement ID:

1. Acesse [analytics.google.com](https://analytics.google.com)
2. Crie uma propriedade GA4 (se ainda não tiver)
3. **Admin → Data Streams → Web → Measurement ID** (começa com `G-`)

---

## 2. Eventos já integrados no store

Os seguintes eventos são disparados automaticamente pelo `useQuizStore.ts`
— nenhuma alteração necessária:

| Evento                | Onde                    | Dados enviados                                                                |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `quiz_started`      | `configurar()`        | disciplinas, quantidade, session_id                                           |
| `question_answered` | `responder()`         | questao_id, disciplina, correta, tempo_segundos, session_id                   |
| `quiz_completed`    | `_finalizar()`        | percentual_acertos, total_questoes, tempo_total, vezes_concluido, disciplinas |
| `quiz_abandoned`    | `registrarAbandono()` | questao_index, total_questoes, percentual_concluido, session_id               |

---

## 3. TelaQuiz.vue — abandono + reporte de erro

Adicione no `<script setup>`:

```ts
import { onMounted, onUnmounted } from 'vue'
import { useAnalytics } from '@/composables/useAnalytics'
import { useFormUrls } from '@/composables/useFormUrls'

const { registrarAbandono } = useQuizStore()
const { trackErrorReported } = useAnalytics()
const { urlErro } = useFormUrls()

onMounted(() => window.addEventListener('beforeunload', registrarAbandono))
onUnmounted(() => window.removeEventListener('beforeunload', registrarAbandono))
```

No template, substitua o link de reporte de erro:

```html
<a
  :href="sessao ? urlErro(sessao.sessionId, questaoAtual?.questao.id ?? '') : '#'"
  @click="sessao && questaoAtual && trackErrorReported({
    questaoId: questaoAtual.questao.id,
    disciplina: questaoAtual.questao.disciplina,
    sessaoId: sessao.sessionId,
  })"
  target="_blank"
  rel="noopener noreferrer"
  class="text-xs text-gray-400 dark:text-white/25 hover:text-red-500 dark:hover:text-red-400 transition-colors"
>
  ⚠️ Reportar erro nesta questão
</a>
```

---

## 4. TelaResultado.vue — feedback

Adicione no `<script setup>`:

```ts
import { useAnalytics } from '@/composables/useAnalytics'
import { useFormUrls } from '@/composables/useFormUrls'

const { trackFeedbackClicked } = useAnalytics()
const { urlFeedback } = useFormUrls()
```

No template, substitua o botão de feedback:

```html
<a
  :href="urlFeedback()"
  @click="trackFeedbackClicked"
  target="_blank"
  rel="noopener noreferrer"
  class="flex-1 text-center py-3 rounded-xl border-2 border-violet-200 dark:border-violet-800/50
         text-violet-600 dark:text-violet-400 font-bold text-sm
         hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
>
  Deixar feedback
</a>
```

---

## 5. Como verificar

1. Instale a extensão **Google Analytics Debugger** no Chrome
2. Ative-a, abra o quiz e faça um simulado completo
3. No console, cada evento aparece em tempo real
4. No GA4: **Reports → Realtime** mostra os eventos com ~1 min de delay
