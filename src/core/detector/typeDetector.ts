import { DetectedType, ColumnDefinition } from '../types/sheet';

export function isNullOrEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || trimmed === '-' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'null';
  }
  return false;
}

export function cleanNumericString(str: string): string {
  return str.replace(/[\$,€,£,¥,\s]/g, '').replace(/,/g, '');
}

export function detectValueType(value: any): DetectedType {
  if (isNullOrEmpty(value)) return 'unknown';

  if (typeof value === 'boolean') return 'boolean';

  if (typeof value === 'number') {
    return 'number';
  }

  const str = String(value).trim();

  // Boolean check
  const lower = str.toLowerCase();
  if (['true', 'false', 'yes', 'no', 'y', 'n', 'ha', "yo'q", 'yoq'].includes(lower)) {
    return 'boolean';
  }

  // Percentage check (e.g. 87%, 12.5%)
  if (/^-?\d+(\.\d+)?\s*%$/.test(str)) {
    return 'percentage';
  }

  // Currency check (e.g. $1500, €45.50, £1,200, 50000 uzs, 50000 so'm)
  if (/^(\$|€|£|¥|UZS|so'm|som)\s?-?\d+([.,]\d+)?$/i.test(str) ||
      /^-?\d+([.,]\d+)?\s?(\$|€|£|¥|UZS|so'm|som)$/i.test(str) ||
      /^(\$|€|£|¥)\s?-?\d{1,3}(,\d{3})*(\.\d+)?$/.test(str)) {
    return 'currency';
  }

  // Standard Number check (integer, float, negative, comma thousand-separators)
  const cleanedNum = cleanNumericString(str);
  if (/^-?\d+(\.\d+)?$/.test(cleanedNum) && !isNaN(Number(cleanedNum))) {
    return 'number';
  }

  // ISO / Common Date & Datetime checks
  // e.g. 2026-09-27, 2026/09/27, 27/09/2026, 09/27/2026
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}(T|\s)\d{1,2}:\d{2}(:\d{2})?/.test(str)) {
    return 'datetime';
  }

  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(str) ||
      /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(str)) {
    const timestamp = Date.parse(str.replace(/\./g, '-'));
    if (!isNaN(timestamp)) {
      return 'date';
    }
  }

  return 'text';
}

export function detectColumnDefinition(
  name: string,
  index: number,
  values: any[]
): ColumnDefinition {
  const typeCounts: Record<DetectedType, number> = {
    text: 0,
    number: 0,
    boolean: 0,
    date: 0,
    datetime: 0,
    currency: 0,
    percentage: 0,
    category: 0,
    unknown: 0,
  };

  let nullCount = 0;
  const uniqueValues = new Set<string>();
  const sampleValues: (string | number | boolean | null)[] = [];

  for (const rawVal of values) {
    if (sampleValues.length < 5 && rawVal !== null && rawVal !== undefined) {
      sampleValues.push(rawVal);
    }

    if (isNullOrEmpty(rawVal)) {
      nullCount++;
      continue;
    }

    const strVal = String(rawVal).trim();
    uniqueValues.add(strVal);

    const type = detectValueType(rawVal);
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  const nonNullCount = values.length - nullCount;
  let dominantType: DetectedType = 'text';

  if (nonNullCount === 0) {
    dominantType = 'unknown';
  } else {
    // Find the type with highest frequency
    let highestCount = 0;
    (Object.keys(typeCounts) as DetectedType[]).forEach((type) => {
      if (type !== 'unknown' && typeCounts[type] > highestCount) {
        highestCount = typeCounts[type];
        dominantType = type;
      }
    });

    // Check if dominant is text, but cardinality is low / repeated values exist -> category!
    const uniqueRatio = nonNullCount > 0 ? uniqueValues.size / nonNullCount : 1;
    if (
      dominantType === 'text' &&
      uniqueValues.size > 0 &&
      uniqueValues.size <= 25 &&
      (uniqueRatio <= 0.75 || uniqueValues.size <= 5) &&
      nonNullCount > uniqueValues.size
    ) {
      dominantType = 'category';
    }

  }

  return {
    id: `col_${index}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name,
    index,
    detectedType: dominantType,
    nullable: nullCount > 0,
    sampleValues,
    uniqueCount: uniqueValues.size,
    nullCount,
  };
}

/**
 * Normalizes a raw cell value to its native JS representation according to detected/override type.
 */
export function parseCellValue(value: any, targetType: DetectedType): any {
  if (isNullOrEmpty(value)) return null;

  switch (targetType) {
    case 'number': {
      if (typeof value === 'number') return value;
      const cleaned = cleanNumericString(String(value));
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    case 'currency': {
      if (typeof value === 'number') return value;
      const cleaned = cleanNumericString(String(value));
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }
    case 'percentage': {
      if (typeof value === 'number') return value;
      const str = String(value).replace(/%/g, '').trim();
      const parsed = parseFloat(str);
      return isNaN(parsed) ? null : parsed;
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value;
      const str = String(value).toLowerCase().trim();
      return ['true', 'yes', '1', 'ha', 'y'].includes(str);
    }
    case 'date':
    case 'datetime': {
      if (value instanceof Date) return value.toISOString();
      const parsed = Date.parse(String(value).replace(/\./g, '-'));
      return isNaN(parsed) ? String(value) : new Date(parsed).toISOString();
    }
    case 'category':
    case 'text':
    default:
      return String(value).trim();
  }
}
