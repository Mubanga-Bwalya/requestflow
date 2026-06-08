/** Fixed IDs from backend/database/002_seed_core_data.sql */
export const SEED = {
  dept: {
    hr: 'd1111111-1111-4111-8111-111111110001',
    marketing: 'd1111111-1111-4111-8111-111111110002',
  },
  role: {
    admin: 'b1111111-1111-4111-8111-111111110001',
    employee: 'b1111111-1111-4111-8111-111111110002',
  },
  users: {
    admin: 'c1111111-1111-4111-8111-111111110001',
    jane: 'c1111111-1111-4111-8111-111111110002',
    henryHr: 'c1111111-1111-4111-8111-111111110003',
    maryMkt: 'c1111111-1111-4111-8111-111111110004',
    helenHr: 'c1111111-1111-4111-8111-111111110005',
    markMkt: 'c1111111-1111-4111-8111-111111110006',
  },
  templates: {
    hrPolicy: 'e2222222-2222-4222-8222-222222220306',
    mktGraphic: 'e2222222-2222-4222-8222-222222220201',
  },
} as const;

export const PASSWORD = 'requestflow';

export const EMAILS = {
  admin: 'admin@requestflow.local',
  jane: 'jane@requestflow.local',
  henry: 'henry@requestflow.local',
  mary: 'mary@requestflow.local',
  helen: 'helen@requestflow.local',
  mark: 'mark@requestflow.local',
  musa: 'musa@requestflow.local',
} as const;
