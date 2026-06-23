# Simulado de Questões - CDM

Plataforma de simulado estática construída com  **Vue 3 + TypeScript + Tailwind CSS v4** .

Deploy sem backend obrigatório.

Desenvolvido originalmente para um simulado de curso, mas adaptável para qualquer contexto de quiz.

---

## Funcionalidades

* Banco de questões em JSON dividido por disciplina
* Seleção de disciplinas e quantidade de questões
* Embaralhamento de questões e alternativas
* Gabarito imediato ou apenas no resultado final (configurável)
* Distribuição equilibrada de questões entre disciplinas
* Resultado com acertos por disciplina
* Modo claro / escuro (respeita preferência do sistema)
* Reporte de erro por questão via Google Forms
* Coleta de resultados via Google Sheets (Apps Script)
* Analytics via Google Analytics 4 (opcional)

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/Simulado-CDM.git
cd Simulado-CDM

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com seus valores (veja seção abaixo)

# Inicie o servidor de desenvolvimento
npm run dev
```

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores:

| Variável                  | Obrigatória | Descrição                                                |
| -------------------------- | ------------ | ---------------------------------------------------------- |
| `VITE_GA_ID`             | Não         | Measurement ID do Google Analytics 4 (ex:`G-XXXXXXXXXX`) |
| `VITE_APPS_SCRIPT_URL`   | Não         | URL do Apps Script para salvar resultados no Google Sheets |
| `VITE_FORM_ERRO_URL`     | Não         | URL base do Google Form de reporte de erro                 |
| `VITE_FORM_FEEDBACK_URL` | Não         | URL base do Google Form de feedback final                  |

Todas as integrações são opcionais — o quiz funciona sem nenhuma configurada.

---

## Adicionar questões

Crie um arquivo JSON em `src/data/questoes/` seguindo o schema:

```json
[
  {
    "id": "xx-001",
    "disciplina": "Nome da Disciplina",
    "enunciado": "Texto da pergunta?",
    "alternativas": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correta": 1,
    "explicacao": "Explicação da resposta correta.",
    "fonte": {
      "tipo": "apostila",
      "descricao": "Nome do material",
      "pagina": 14
    }
  }
]
```

Tipos de fonte aceitos: `apostila` (usa `pagina`), `video` (usa `minuto`), `site` (usa `url`), `outro`.

Após criar o arquivo, importe-o em `src/data/questoes/index.ts`:

```ts
import novaDisciplina from './nova-disciplina.json'

export const todasQuestoes: Questao[] = [
  // ...existentes
  ...novaDisciplina as Questao[],
]
```

---

## Configurar Google Sheets

Veja o guia completo em [`APPS_SCRIPT_SETUP.md`](./APPS_SCRIPT_SETUP.md).

---

## Configurar Google Analytics 4

Veja o guia completo em [`GA4_INTEGRATION.md`](./GA4_INTEGRATION.md "GA4 Integration").

---

## Estrutura do projeto

```
src/
├── assets/
│   └── main.css                # Tailwind v4 + tokens de design
├── components/
│   ├── TelaOnboarding.vue      # Fluxo de configuração (3 steps)
│   ├── TelaQuiz.vue            # Tela de perguntas
│   └── TelaResultado.vue       # Resultado e gabarito
├── composables/
│   ├── useAnalytics.ts         # GA4 + Google Sheets
│   ├── useFormUrls.ts          # URLs dos Google Forms
│   ├── useQuizStore.ts         # Estado global do quiz
│   └── useStorage.ts           # Persistência no localStorage
├── data/
│   └── questoes/
│       ├── index.ts            # Consolida todos os arquivos
│       └── *.json              # Um arquivo por disciplina
├── router/
│   └── index.ts
├── types/
│   └── quiz.ts                 # Interfaces TypeScript
├── App.vue
└── main.ts                     # Inicialização + GA4
```

---

## Licença

MIT — use, modifique e distribua livremente.
