import { SEED } from './seed-constants';

export function hrPolicyRequestPayload(overrides?: { title?: string }) {
  return {
    targetDepartmentName: 'HR',
    templateId: SEED.templates.hrPolicy,
    title: overrides?.title ?? 'E2E HR policy request',
    fieldAnswers: [
      { fieldKey: 'title', answerText: overrides?.title ?? 'E2E HR policy request' },
      { fieldKey: 'description', answerText: 'Security regression test body' },
      { fieldKey: 'policy_area', answerText: 'Leave' },
      { fieldKey: 'question_type', answerText: 'Clarification' },
      { fieldKey: 'urgency', answerText: 'Low' },
      { fieldKey: 'preferred_contact', answerText: 'jane@requestflow.local' },
    ],
  };
}
