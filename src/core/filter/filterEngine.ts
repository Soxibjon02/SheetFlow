import { FilterRule, FilterGroup } from '../types/calculation';
import { isNullOrEmpty } from '../detector/typeDetector';

export function isFilterGroup(condition: FilterRule | FilterGroup): condition is FilterGroup {
  return 'logic' in condition && Array.isArray((condition as FilterGroup).conditions);
}

export function evaluateRule(row: Record<string, any>, rule: FilterRule): boolean {
  const rawValue = row[rule.column];

  switch (rule.operator) {
    case 'is_empty':
      return isNullOrEmpty(rawValue);

    case 'is_not_empty':
      return !isNullOrEmpty(rawValue);

    case 'equals': {
      if (isNullOrEmpty(rawValue) && isNullOrEmpty(rule.value)) return true;
      if (isNullOrEmpty(rawValue) || isNullOrEmpty(rule.value)) return false;
      return String(rawValue).toLowerCase().trim() === String(rule.value).toLowerCase().trim();
    }

    case 'not_equals': {
      if (isNullOrEmpty(rawValue) && isNullOrEmpty(rule.value)) return false;
      if (isNullOrEmpty(rawValue) || isNullOrEmpty(rule.value)) return true;
      return String(rawValue).toLowerCase().trim() !== String(rule.value).toLowerCase().trim();
    }

    case 'greater_than': {
      const numRow = Number(rawValue);
      const numTarget = Number(rule.value);
      if (!isNaN(numRow) && !isNaN(numTarget)) return numRow > numTarget;
      // Date comparison fallback
      const dateRow = Date.parse(rawValue);
      const dateTarget = Date.parse(rule.value);
      if (!isNaN(dateRow) && !isNaN(dateTarget)) return dateRow > dateTarget;
      return false;
    }

    case 'greater_than_or_equal': {
      const numRow = Number(rawValue);
      const numTarget = Number(rule.value);
      if (!isNaN(numRow) && !isNaN(numTarget)) return numRow >= numTarget;
      const dateRow = Date.parse(rawValue);
      const dateTarget = Date.parse(rule.value);
      if (!isNaN(dateRow) && !isNaN(dateTarget)) return dateRow >= dateTarget;
      return false;
    }

    case 'less_than': {
      const numRow = Number(rawValue);
      const numTarget = Number(rule.value);
      if (!isNaN(numRow) && !isNaN(numTarget)) return numRow < numTarget;
      const dateRow = Date.parse(rawValue);
      const dateTarget = Date.parse(rule.value);
      if (!isNaN(dateRow) && !isNaN(dateTarget)) return dateRow < dateTarget;
      return false;
    }

    case 'less_than_or_equal': {
      const numRow = Number(rawValue);
      const numTarget = Number(rule.value);
      if (!isNaN(numRow) && !isNaN(numTarget)) return numRow <= numTarget;
      const dateRow = Date.parse(rawValue);
      const dateTarget = Date.parse(rule.value);
      if (!isNaN(dateRow) && !isNaN(dateTarget)) return dateRow <= dateTarget;
      return false;
    }

    case 'contains': {
      if (isNullOrEmpty(rawValue)) return false;
      return String(rawValue).toLowerCase().includes(String(rule.value || '').toLowerCase().trim());
    }

    case 'not_contains': {
      if (isNullOrEmpty(rawValue)) return true;
      return !String(rawValue).toLowerCase().includes(String(rule.value || '').toLowerCase().trim());
    }

    case 'starts_with': {
      if (isNullOrEmpty(rawValue)) return false;
      return String(rawValue).toLowerCase().startsWith(String(rule.value || '').toLowerCase().trim());
    }

    case 'ends_with': {
      if (isNullOrEmpty(rawValue)) return false;
      return String(rawValue).toLowerCase().endsWith(String(rule.value || '').toLowerCase().trim());
    }

    case 'between': {
      const numRow = Number(rawValue);
      const min = Number(rule.value);
      const max = Number(rule.valueTo);
      if (!isNaN(numRow) && !isNaN(min) && !isNaN(max)) {
        return numRow >= min && numRow <= max;
      }
      const dateRow = Date.parse(rawValue);
      const dateMin = Date.parse(rule.value);
      const dateMax = Date.parse(rule.valueTo);
      if (!isNaN(dateRow) && !isNaN(dateMin) && !isNaN(dateMax)) {
        return dateRow >= dateMin && dateRow <= dateMax;
      }
      return false;
    }

    default:
      return true;
  }
}

export function evaluateFilterGroup(
  row: Record<string, any>,
  group: FilterGroup
): boolean {
  if (!group.conditions || group.conditions.length === 0) return true;

  if (group.logic === 'AND') {
    return group.conditions.every((c) =>
      isFilterGroup(c) ? evaluateFilterGroup(row, c) : evaluateRule(row, c)
    );
  }

  if (group.logic === 'OR') {
    return group.conditions.some((c) =>
      isFilterGroup(c) ? evaluateFilterGroup(row, c) : evaluateRule(row, c)
    );
  }

  if (group.logic === 'NOT') {
    return !group.conditions.some((c) =>
      isFilterGroup(c) ? evaluateFilterGroup(row, c) : evaluateRule(row, c)
    );
  }

  return true;
}

export function applyFilters(
  rows: Record<string, any>[],
  filters?: FilterGroup | FilterRule[]
): Record<string, any>[] {
  if (!filters) return rows;

  if (Array.isArray(filters)) {
    if (filters.length === 0) return rows;
    return rows.filter((row) => filters.every((rule) => evaluateRule(row, rule)));
  }

  return rows.filter((row) => evaluateFilterGroup(row, filters));
}
