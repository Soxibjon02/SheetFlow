export type EconomicCategory =
  | 'Growth'
  | 'Inflation'
  | 'Employment'
  | 'Trade'
  | 'Monetary'
  | 'Fiscal'
  | 'Demographics';

export interface EconomicIndicator {
  id: string;
  code: string;
  name: string;
  category: EconomicCategory;
  country: string;
  currentValue: number;
  unit: string;
  changeYoy: number;
  changeMom: number;
  period: string;
  description: string;
  source: string;
  dataPoints: { date: string; value: number }[];
}

export interface EconomicDataset {
  id: string;
  title: string;
  countryOrRegion: string;
  frequency: 'Annual' | 'Quarterly' | 'Monthly' | 'Daily';
  baseYear?: number;
  indicators: string[];
  records: Record<string, any>[];
  lastUpdated: string;
}

export interface CountryComparisonData {
  countryA: string;
  countryB: string;
  metrics: {
    indicator: string;
    unit: string;
    valueA: number;
    valueB: number;
    difference: number;
    leader: string;
  }[];
}

export interface CorrelationResult {
  variableA: string;
  variableB: string;
  correlationCoefficient: number; // Pearson r [-1, 1]
  covariance: number;
  sampleSize: number;
  strength: 'Strong Positive' | 'Moderate Positive' | 'Weak / None' | 'Moderate Negative' | 'Strong Negative';
  rSquared: number;
  regressionEquation: string;
  slope: number;
  intercept: number;
  points: { x: number; y: number; label: string }[];
  disclaimer: string;
}

export interface BreakEvenAnalysisResult {
  fixedCosts: number;
  variableCostPerUnit: number;
  sellingPricePerUnit: number;
  contributionMargin: number;
  contributionMarginRatio: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  chartPoints: {
    units: number;
    totalRevenue: number;
    totalCost: number;
    fixedCost: number;
  }[];
}

export interface PriceElasticityResult {
  initialPrice: number;
  newPrice: number;
  initialQuantity: number;
  newQuantity: number;
  percentChangePrice: number;
  percentChangeQuantity: number;
  elasticityCoefficient: number;
  elasticityType: 'Elastic' | 'Inelastic' | 'Unitary Elastic';
  interpretation: string;
}

export interface SupplyDemandResult {
  demandIntercept: number;
  demandSlope: number; // e.g. Qd = a - bP
  supplyIntercept: number;
  supplySlope: number; // e.g. Qs = c + dP
  equilibriumPrice: number;
  equilibriumQuantity: number;
  consumerSurplus: number;
  producerSurplus: number;
  curvePoints: { price: number; quantityDemanded: number; quantitySupplied: number }[];
}

export interface ForecastDataPoint {
  period: string;
  historicalValue?: number;
  forecastValue: number;
  confidenceLower?: number;
  confidenceUpper?: number;
  type: 'Historical' | 'Forecast';
}

export interface EconomicForecastResult {
  indicator: string;
  method: 'Linear Trend' | 'Moving Average (3-Period)' | 'Exponential Smoothing';
  horizonPeriods: number;
  dataPoints: ForecastDataPoint[];
  growthProjectionPercent: number;
  disclaimer: string;
}
