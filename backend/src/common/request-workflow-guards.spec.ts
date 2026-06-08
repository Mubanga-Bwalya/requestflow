import { BadRequestException } from '@nestjs/common';
import {
  assertCanProvideMissingInformation,
  assertCanRequestMissingInformation,
  assertRequestStatusAlignedWithAssignment,
} from './request-workflow-guards';

describe('request-workflow-guards', () => {
  describe('assertCanProvideMissingInformation', () => {
    it('allows NEEDS_INFORMATION', () => {
      expect(() =>
        assertCanProvideMissingInformation('NEEDS_INFORMATION'),
      ).not.toThrow();
    });

    it('rejects SUBMITTED', () => {
      expect(() => assertCanProvideMissingInformation('SUBMITTED')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('assertCanRequestMissingInformation', () => {
    it('allows SUBMITTED and IN_PROGRESS', () => {
      expect(() =>
        assertCanRequestMissingInformation('SUBMITTED'),
      ).not.toThrow();
      expect(() =>
        assertCanRequestMissingInformation('IN_PROGRESS'),
      ).not.toThrow();
    });

    it('rejects NEEDS_INFORMATION', () => {
      expect(() =>
        assertCanRequestMissingInformation('NEEDS_INFORMATION'),
      ).toThrow(BadRequestException);
    });

    it('rejects COMPLETED', () => {
      expect(() => assertCanRequestMissingInformation('COMPLETED')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('assertRequestStatusAlignedWithAssignment', () => {
    it('skips when no assignment', () => {
      expect(() =>
        assertRequestStatusAlignedWithAssignment('COMPLETED', null),
      ).not.toThrow();
    });

    it('blocks COMPLETED when assignment is ASSIGNED with low progress', () => {
      expect(() =>
        assertRequestStatusAlignedWithAssignment('COMPLETED', {
          status: 'ASSIGNED',
          progressPercentage: 0,
        }),
      ).toThrow(BadRequestException);
    });

    it('allows COMPLETED when assignment progress is 100%', () => {
      expect(() =>
        assertRequestStatusAlignedWithAssignment('COMPLETED', {
          status: 'IN_PROGRESS',
          progressPercentage: 100,
        }),
      ).not.toThrow();
    });

    it('blocks READY_FOR_REVIEW when assignment is ASSIGNED', () => {
      expect(() =>
        assertRequestStatusAlignedWithAssignment('READY_FOR_REVIEW', {
          status: 'ASSIGNED',
          progressPercentage: 0,
        }),
      ).toThrow(BadRequestException);
    });
  });
});
