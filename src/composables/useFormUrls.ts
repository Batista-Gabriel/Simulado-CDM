
const FORM_ERRO_BASE = import.meta.env.VITE_FORM_ERRO_URL ?? "";
const FORM_FEEDBACK_BASE = import.meta.env.VITE_FORM_FEEDBACK_URL ?? "";

export function useFormUrls() {

  function urlErro(sessaoId: string, questaoId: string): string {
    if (!FORM_ERRO_BASE) {
      console.warn("[Forms] VITE_FORM_ERRO_URL não configurada.");
      return "#";
    }
    const params = new URLSearchParams({
      usp: "pp_url",
      "entry.861380431": sessaoId,
      "entry.993592341": questaoId,
    });
    return `${FORM_ERRO_BASE}?${params.toString()}`;
  }


  function urlFeedback(): string {
    if (!FORM_FEEDBACK_BASE) {
      console.warn("[Forms] VITE_FORM_FEEDBACK_URL não configurada.");
      return "#";
    }
    return FORM_FEEDBACK_BASE;
  }

  return { urlErro, urlFeedback };
}
