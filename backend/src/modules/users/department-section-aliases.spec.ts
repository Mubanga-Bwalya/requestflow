import { inferSectionFromTitle } from './department-section-aliases';

describe('inferSectionFromTitle', () => {
  it('maps IT innovation titles to Innovations', () => {
    expect(
      inferSectionFromTitle('Information Technology', 'IT Innovation Intern'),
    ).toBe('Innovations');
    expect(
      inferSectionFromTitle(
        'Information Technology',
        'Head – Digital Transformation and Innovation',
      ),
    ).toBe('Innovations');
  });

  it('maps IT integration titles to Integrations', () => {
    expect(
      inferSectionFromTitle(
        'Information Technology',
        'Acting Team Lead – Systems Integration',
      ),
    ).toBe('Integrations');
    expect(
      inferSectionFromTitle('Information Technology', 'Integration Expert'),
    ).toBe('Integrations');
  });

  it('maps IT development titles to Development', () => {
    expect(
      inferSectionFromTitle('Information Technology', 'Software Developer'),
    ).toBe('Development');
    expect(
      inferSectionFromTitle('Information Technology', 'Front End Developers'),
    ).toBe('Development');
  });

  it('returns null for unrelated parents or titles', () => {
    expect(inferSectionFromTitle('Finance', 'Software Developer')).toBeNull();
    expect(
      inferSectionFromTitle('Information Technology', 'Network Administrator'),
    ).toBeNull();
  });
});
