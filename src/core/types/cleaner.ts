export interface DataQualityIssue {
  type: 'empty_cell' | 'duplicate_row' | 'number_as_text' | 'invalid_date' | 'extra_spaces' | 'mixed_type' | 'empty_row';
  column?: string;
  count: number;
  description: string;
  sampleRows?: number[];
}

export interface DataQualityReport {
  totalIssuesCount: number;
  emptyCellsCount: number;
  emptyRowsCount: number;
  duplicateRowsCount: number;
  numbersAsTextCount: number;
  invalidDatesCount: number;
  extraSpacesCount: number;
  issues: DataQualityIssue[];
  isClean: boolean;
}

export interface ProposedCleaningActions {
  trimSpacesCount: number;
  duplicateRowsCount: number;
  convertNumbersCount: number;
  normalizeDatesCount: number;
  removeEmptyRowsCount: number;
  summary: string[];
}
