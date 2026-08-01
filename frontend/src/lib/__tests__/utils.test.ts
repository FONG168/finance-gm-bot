import { cn, formatCurrency, formatPercentage, formatRelativeDate, truncate } from '../utils';
import i18n from '../i18n';

describe('formatCurrency', () => {
  it('formats USD amounts with two decimal places and a thousands separator', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-42)).toBe('-$42.00');
  });

  it('formats KHR by rounding to whole numbers and using the riel symbol', () => {
    expect(formatCurrency(4000.6, 'KHR')).toBe('៛4,001');
  });
});

describe('formatPercentage', () => {
  it('adds a + sign for positive values', () => {
    expect(formatPercentage(12.34)).toBe('+12.3%');
  });

  it('keeps the - sign for negative values', () => {
    expect(formatPercentage(-5)).toBe('-5.0%');
  });

  it('does not add a + sign for zero', () => {
    expect(formatPercentage(0)).toBe('0.0%');
  });
});

describe('truncate', () => {
  it('leaves strings at or under the limit untouched', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates long strings and appends an ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });
});

describe('cn', () => {
  it('resolves conflicting Tailwind classes, keeping the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});

describe('formatRelativeDate', () => {
  beforeAll(() => {
    // i18next resolves the dotted key 'common.today' as a nested path *within*
    // the 'common' namespace bundle — matching how public/locales/*/common.json
    // itself nests a top-level "common": { "today": ... } object.
    i18n.addResourceBundle(
      'en',
      'common',
      { common: { today: 'Today', yesterday: 'Yesterday', daysAgo: '{{n}} days ago' } },
      true,
      true,
    );
  });

  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "Today" for a timestamp earlier the same Phnom Penh calendar day', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-15T10:00:00Z')); // 17:00 ICT
    const earlierToday = new Date('2026-01-15T02:00:00Z'); // 09:00 ICT, same day
    expect(formatRelativeDate(earlierToday)).toBe('Today');
  });

  it('returns "Yesterday" for the previous Phnom Penh calendar day', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-15T10:00:00Z'));
    const yesterday = new Date('2026-01-14T10:00:00Z');
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });

  it('returns "N days ago" for older dates within the last week', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-15T10:00:00Z'));
    const threeDaysAgo = new Date('2026-01-12T10:00:00Z');
    expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
  });
});
