import {
  isDepartmentManager,
  isDepartmentManagerByName,
} from './department-manager';

describe('department-manager', () => {
  const managedIds = ['dept-hr', 'dept-mkt'];

  describe('isDepartmentManager', () => {
    it('returns true when user is appointed manager of the department', () => {
      expect(isDepartmentManager('user-1', 'dept-hr', managedIds)).toBe(true);
    });

    it('returns false when department is not managed', () => {
      expect(isDepartmentManager('user-1', 'dept-finance', managedIds)).toBe(
        false,
      );
    });
  });

  describe('isDepartmentManagerByName', () => {
    it('matches department names case-insensitively', () => {
      expect(isDepartmentManagerByName('hr', ['HR', 'Marketing'])).toBe(true);
      expect(isDepartmentManagerByName('Finance', ['HR'])).toBe(false);
    });
  });
});
