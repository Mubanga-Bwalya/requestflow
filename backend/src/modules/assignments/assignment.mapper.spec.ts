import {
  recomputeAssignmentProgress,
  resolveAssignmentStatusFromProgress,
  syncRequestProgressFromAssignment,
} from './assignment.mapper';

describe('assignment.mapper', () => {
  describe('resolveAssignmentStatusFromProgress', () => {
    it('does not auto-complete at 100% progress', () => {
      expect(resolveAssignmentStatusFromProgress('IN_PROGRESS', 100)).toBe(
        'IN_PROGRESS',
      );
      expect(resolveAssignmentStatusFromProgress('REOPENED', 100)).toBe(
        'REOPENED',
      );
    });

    it('moves ASSIGNED to IN_PROGRESS when work has started', () => {
      expect(resolveAssignmentStatusFromProgress('ASSIGNED', 25)).toBe(
        'IN_PROGRESS',
      );
    });
  });

  describe('recomputeAssignmentProgress', () => {
    it('averages milestone progress', () => {
      expect(
        recomputeAssignmentProgress([
          { progressPercentage: 100 },
          { progressPercentage: 50 },
        ]),
      ).toBe(75);
    });
  });

  describe('syncRequestProgressFromAssignment', () => {
    it('updates request progress only without changing request status', async () => {
      const updates: { progressPercentage?: number; status?: string }[] = [];
      const tx = {
        request: {
          update: jest.fn(({ data }: { data: (typeof updates)[0] }) => {
            updates.push(data);
            return Promise.resolve();
          }),
        },
      };

      await syncRequestProgressFromAssignment(tx as never, 'req-1', 100);

      expect(updates).toEqual([{ progressPercentage: 100 }]);
    });
  });
});
