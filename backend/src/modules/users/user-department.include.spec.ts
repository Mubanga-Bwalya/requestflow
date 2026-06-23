import { splitUserDepartment } from './user-department.include';

describe('splitUserDepartment', () => {
  it('returns top-level department only when user is not in a section', () => {
    expect(
      splitUserDepartment({
        id: 'dept-1',
        name: 'Information Technology',
        parentDepartmentId: null,
        parent: null,
      }),
    ).toEqual({
      departmentId: 'dept-1',
      departmentName: 'Information Technology',
      sectionId: null,
      sectionName: null,
    });
  });

  it('splits parent and section when user is assigned to a subsection', () => {
    expect(
      splitUserDepartment({
        id: 'sec-1',
        name: 'Development',
        parentDepartmentId: 'dept-1',
        parent: { id: 'dept-1', name: 'Information Technology' },
      }),
    ).toEqual({
      departmentId: 'sec-1',
      departmentName: 'Information Technology',
      sectionId: 'sec-1',
      sectionName: 'Development',
    });
  });
});
