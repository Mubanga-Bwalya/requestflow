import {
  assignmentStatusesForTab,
  parseListTab,
  requestStatusesForTab,
} from './list-tab-filters';

describe('parseListTab', () => {
  it('accepts valid tabs', () => {
    expect(parseListTab('NEEDS_ACTION')).toBe('NEEDS_ACTION');
    expect(parseListTab('ALL')).toBe('ALL');
  });

  it('rejects invalid tabs', () => {
    expect(parseListTab('bogus')).toBeUndefined();
  });
});

describe('requestStatusesForTab', () => {
  it('returns statuses for mine NEEDS_ACTION', () => {
    const statuses = requestStatusesForTab('NEEDS_ACTION', 'mine');
    expect(statuses).toContain('SUBMITTED');
    expect(statuses).toContain('NEEDS_INFORMATION');
  });

  it('returns undefined for ALL', () => {
    expect(requestStatusesForTab('ALL', 'mine')).toBeUndefined();
  });
});

describe('assignmentStatusesForTab', () => {
  it('returns ASSIGNED for NEEDS_ACTION', () => {
    expect(assignmentStatusesForTab('NEEDS_ACTION')).toEqual(['ASSIGNED']);
  });
});
