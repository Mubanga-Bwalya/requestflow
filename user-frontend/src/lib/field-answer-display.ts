/** Display values for template field answers on request detail (matches create-request review). */

export function formatFieldAnswerDisplay(
  answerText: string | null,
  answerJson: unknown,
  fileUrl: string | null,
): string | null {
  if (fileUrl?.trim()) return fileUrl.trim();
  if (answerJson != null) {
    if (Array.isArray(answerJson)) {
      const items = answerJson.map(String).filter((s) => s.trim());
      return items.length ? items.join(", ") : null;
    }
    const jsonText = String(answerJson).trim();
    return jsonText || null;
  }
  const text = answerText?.trim();
  return text || null;
}

export type SubmittedFieldAnswer = {
  fieldKey: string;
  label: string;
  answerText: string | null;
  answerJson: unknown;
  fileUrl: string | null;
};

export function visibleSubmittedFieldAnswers(answers: SubmittedFieldAnswer[]) {
  return answers
    .map((a) => ({
      ...a,
      display: formatFieldAnswerDisplay(a.answerText, a.answerJson, a.fileUrl),
    }))
    .filter((a): a is SubmittedFieldAnswer & { display: string } => a.display != null);
}

/** True when the request has template form answers to show (all departments). */
export function hasVisibleSubmittedFields(answers: SubmittedFieldAnswer[]) {
  return visibleSubmittedFieldAnswers(answers).length > 0;
}
