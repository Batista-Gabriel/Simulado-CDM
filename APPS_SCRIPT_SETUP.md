# Configuração do Google Apps Script

## 1. Criar a planilha

1. Acesse [Google Sheets](https://sheets.google.com) e crie uma nova planilha
2. Renomeie a aba para `Respostas`
3. Na primeira linha, adicione os cabeçalhos (linha 1):

```
sessionId | nome | disciplinas | quantidadeQuestoes | totalAcertos | percentualAcertos | tempoTotalSegundos | timestampInicio | timestampFim | respostasJson
```

---

## 2. Criar o Apps Script

1. Na planilha, vá em **Extensões → Apps Script**
2. Apague o código existente e cole o seguinte:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Respostas');
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.sessionId,
      data.nome,
      data.disciplinas,
      data.quantidadeQuestoes,
      data.totalAcertos,
      data.percentualAcertos,
      data.tempoTotalSegundos,
      data.timestampInicio,
      data.timestampFim,
      data.respostasJson,
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Clique em **Salvar** (ícone de disquete)

---

## 3. Publicar como Web App

1. Clique em **Implantar → Nova implantação**
2. Tipo: **App da Web**
3. Configurações:
   - **Executar como:** Eu (sua conta)
   - **Quem tem acesso:** Qualquer pessoa
4. Clique em **Implantar**
5. **Copie a URL** gerada (parece com `https://script.google.com/macros/s/ABC.../exec`)

---

## 4. Configurar no projeto

1. Copie `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Abra `.env.local` e substitua pela URL copiada:
   ```
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/SUA_URL/exec
   ```

---

## Observação sobre `no-cors`

O Apps Script não retorna cabeçalhos CORS por padrão. O fetch usa `mode: 'no-cors'`, o que significa que não conseguimos confirmar se o envio foi bem-sucedido pelo lado do cliente — mas os dados chegam na planilha normalmente. Em caso de falha de rede, os dados ficam salvos no `localStorage` como fallback (chave `quiz_fallback`).
