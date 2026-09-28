import {
  EconomicIndicator,
  EconomicDataset,
  CountryComparisonData,
  CorrelationResult,
  BreakEvenAnalysisResult,
  PriceElasticityResult,
  SupplyDemandResult,
  EconomicForecastResult,
} from '../types/economy';

export const DEFAULT_ECONOMIC_INDICATORS: EconomicIndicator[] = [
  {
    id: 'ind_gdp_uz',
    code: 'GDP_UZ',
    name: 'Gross Domestic Product (GDP)',
    category: 'Growth',
    country: 'Uzbekistan',
    currentValue: 107.5,
    unit: 'Billion USD',
    changeYoy: 6.2,
    changeMom: 0.5,
    period: '2025-Annual',
    description: 'Total monetary market value of all finished goods and services produced.',
    source: 'State Committee of the Republic of Uzbekistan on Statistics',
    dataPoints: [
      { date: '2021', value: 69.2 },
      { date: '2022', value: 80.4 },
      { date: '2023', value: 90.9 },
      { date: '2024', value: 101.2 },
      { date: '2025', value: 107.5 },
    ],
  },
  {
    id: 'ind_gdp_growth_uz',
    code: 'GDP_GROWTH_UZ',
    name: 'Real GDP Growth Rate',
    category: 'Growth',
    country: 'Uzbekistan',
    currentValue: 6.2,
    unit: '% Annual',
    changeYoy: 0.2,
    changeMom: 0.0,
    period: '2025-Annual',
    description: 'Annual percentage change in volume of real economic output.',
    source: 'World Bank / Central Bank of Uzbekistan',
    dataPoints: [
      { date: '2021', value: 7.4 },
      { date: '2022', value: 5.7 },
      { date: '2023', value: 6.0 },
      { date: '2024', value: 6.4 },
      { date: '2025', value: 6.2 },
    ],
  },
  {
    id: 'ind_cpi_uz',
    code: 'CPI_INFLATION_UZ',
    name: 'Consumer Price Index (Inflation)',
    category: 'Inflation',
    country: 'Uzbekistan',
    currentValue: 8.8,
    unit: '% YoY',
    changeYoy: -1.2,
    changeMom: 0.4,
    period: '2026-Jan',
    description: 'Headline Consumer Price Index measuring consumer basket inflation.',
    source: 'Central Bank of the Republic of Uzbekistan (CBU)',
    dataPoints: [
      { date: '2021', value: 10.0 },
      { date: '2022', value: 12.3 },
      { date: '2023', value: 8.8 },
      { date: '2024', value: 9.8 },
      { date: '2025', value: 8.8 },
    ],
  },
  {
    id: 'ind_unemp_uz',
    code: 'UNEMPLOYMENT_UZ',
    name: 'Unemployment Rate',
    category: 'Employment',
    country: 'Uzbekistan',
    currentValue: 6.8,
    unit: '% of Labor Force',
    changeYoy: -1.3,
    changeMom: -0.1,
    period: '2025-Q4',
    description: 'Share of the labor force that is without work and seeking employment.',
    source: 'Ministry of Poverty Reduction and Employment',
    dataPoints: [
      { date: '2021', value: 9.6 },
      { date: '2022', value: 8.9 },
      { date: '2023', value: 8.1 },
      { date: '2024', value: 7.5 },
      { date: '2025', value: 6.8 },
    ],
  },
  {
    id: 'ind_interest_uz',
    code: 'POLICY_RATE_UZ',
    name: 'Central Bank Policy Rate',
    category: 'Monetary',
    country: 'Uzbekistan',
    currentValue: 13.5,
    unit: '% Per Annum',
    changeYoy: -0.5,
    changeMom: 0.0,
    period: '2026-Feb',
    description: 'Benchmark refinancing rate set by the Central Bank of Uzbekistan.',
    source: 'Central Bank of Uzbekistan',
    dataPoints: [
      { date: '2021', value: 14.0 },
      { date: '2022', value: 15.0 },
      { date: '2023', value: 14.0 },
      { date: '2024', value: 13.5 },
      { date: '2025', value: 13.5 },
    ],
  },
  {
    id: 'ind_trade_exp_uz',
    code: 'EXPORTS_UZ',
    name: 'Exports of Goods & Services',
    category: 'Trade',
    country: 'Uzbekistan',
    currentValue: 25.4,
    unit: 'Billion USD',
    changeYoy: 14.2,
    changeMom: 1.1,
    period: '2025-Annual',
    description: 'Total value of outward trade including gold, textiles, energy, and copper.',
    source: 'State Customs Committee',
    dataPoints: [
      { date: '2021', value: 16.6 },
      { date: '2022', value: 19.3 },
      { date: '2023', value: 24.4 },
      { date: '2024', value: 26.2 },
      { date: '2025', value: 25.4 },
    ],
  },
  {
    id: 'ind_trade_imp_uz',
    code: 'IMPORTS_UZ',
    name: 'Imports of Goods & Services',
    category: 'Trade',
    country: 'Uzbekistan',
    currentValue: 38.1,
    unit: 'Billion USD',
    changeYoy: 11.8,
    changeMom: 0.8,
    period: '2025-Annual',
    description: 'Total incoming capital goods, machinery, vehicles, and raw materials.',
    source: 'State Customs Committee',
    dataPoints: [
      { date: '2021', value: 25.5 },
      { date: '2022', value: 30.7 },
      { date: '2023', value: 38.1 },
      { date: '2024', value: 41.2 },
      { date: '2025', value: 38.1 },
    ],
  },
  {
    id: 'ind_debt_uz',
    code: 'PUBLIC_DEBT_UZ',
    name: 'Public Debt-to-GDP Ratio',
    category: 'Fiscal',
    country: 'Uzbekistan',
    currentValue: 36.4,
    unit: '% of GDP',
    changeYoy: 1.1,
    changeMom: 0.1,
    period: '2025-Annual',
    description: 'Total government sovereign external and domestic debt as % of annual GDP.',
    source: 'Ministry of Economy and Finance',
    dataPoints: [
      { date: '2021', value: 37.9 },
      { date: '2022', value: 36.4 },
      { date: '2023', value: 35.1 },
      { date: '2024', value: 35.8 },
      { date: '2025', value: 36.4 },
    ],
  },
];

class EconomyService {
  private indicators: EconomicIndicator[] = [...DEFAULT_ECONOMIC_INDICATORS];

  getIndicators(): EconomicIndicator[] {
    return [...this.indicators];
  }

  getIndicatorById(id: string): EconomicIndicator | undefined {
    return this.indicators.find((ind) => ind.id === id);
  }

  // 1. Growth Calculations: CAGR & YoY (Section 75)
  calculateCAGR(startValue: number, endValue: number, periods: number): number {
    if (startValue <= 0 || endValue <= 0 || periods <= 0) return 0;
    const cagr = (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
    return Math.round(cagr * 100) / 100;
  }

  calculateInflationImpact(nominalValue: number, inflationRatePercent: number): {
    realValue: number;
    purchasingPowerLossPercent: number;
  } {
    const rate = inflationRatePercent / 100;
    const real = nominalValue / (1 + rate);
    const loss = (1 - 1 / (1 + rate)) * 100;
    return {
      realValue: Math.round(real * 100) / 100,
      purchasingPowerLossPercent: Math.round(loss * 100) / 100,
    };
  }

  // 2. Country Comparison (Section 79)
  compareCountries(countryA: string = 'Uzbekistan', countryB: string = 'Kazakhstan'): CountryComparisonData {
    return {
      countryA,
      countryB,
      metrics: [
        { indicator: 'GDP', unit: 'Billion USD', valueA: 107.5, valueB: 284.0, difference: -176.5, leader: countryB },
        { indicator: 'Real GDP Growth', unit: '% Annual', valueA: 6.2, valueB: 4.8, difference: 1.4, leader: countryA },
        { indicator: 'Inflation (CPI)', unit: '% YoY', valueA: 8.8, valueB: 9.3, difference: -0.5, leader: countryA },
        { indicator: 'Unemployment', unit: '%', valueA: 6.8, valueB: 4.7, difference: 2.1, leader: countryB },
        { indicator: 'Exports', unit: 'Billion USD', valueA: 25.4, valueB: 84.2, difference: -58.8, leader: countryB },
        { indicator: 'Public Debt to GDP', unit: '%', valueA: 36.4, valueB: 22.8, difference: 13.6, leader: countryB },
        { indicator: 'Population', unit: 'Million', valueA: 37.2, valueB: 20.1, difference: 17.1, leader: countryA },
      ],
    };
  }

  // 3. Correlation Analysis (Section 80)
  calculateCorrelation(
    seriesA: number[],
    seriesB: number[],
    nameA: string = 'Inflation (%)',
    nameB: string = 'Unemployment (%)'
  ): CorrelationResult {
    const n = Math.min(seriesA.length, seriesB.length);
    if (n < 2) {
      return {
        variableA: nameA,
        variableB: nameB,
        correlationCoefficient: 0,
        covariance: 0,
        sampleSize: n,
        strength: 'Weak / None',
        rSquared: 0,
        regressionEquation: 'y = 0x + 0',
        slope: 0,
        intercept: 0,
        points: [],
        disclaimer: 'Correlation indicates statistical association and does not by itself establish causation.',
      };
    }

    const meanA = seriesA.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const meanB = seriesB.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomA = 0;
    let denomB = 0;

    for (let i = 0; i < n; i++) {
      const diffA = seriesA[i] - meanA;
      const diffB = seriesB[i] - meanB;
      numerator += diffA * diffB;
      denomA += diffA * diffA;
      denomB += diffB * diffB;
    }

    const denom = Math.sqrt(denomA * denomB);
    const r = denom === 0 ? 0 : numerator / denom;
    const cov = numerator / (n - 1);
    const slope = denomA === 0 ? 0 : numerator / denomA;
    const intercept = meanB - slope * meanA;

    let strength: CorrelationResult['strength'] = 'Weak / None';
    if (r >= 0.7) strength = 'Strong Positive';
    else if (r >= 0.3) strength = 'Moderate Positive';
    else if (r <= -0.7) strength = 'Strong Negative';
    else if (r <= -0.3) strength = 'Moderate Negative';

    const points = [];
    for (let i = 0; i < n; i++) {
      points.push({
        x: seriesA[i],
        y: seriesB[i],
        label: `Period ${i + 1}`,
      });
    }

    return {
      variableA: nameA,
      variableB: nameB,
      correlationCoefficient: Math.round(r * 1000) / 1000,
      covariance: Math.round(cov * 1000) / 1000,
      sampleSize: n,
      strength,
      rSquared: Math.round(r * r * 1000) / 1000,
      regressionEquation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
      slope: Math.round(slope * 1000) / 1000,
      intercept: Math.round(intercept * 1000) / 1000,
      points,
      disclaimer: 'Correlation indicates statistical association and does not by itself establish causation.',
    };
  }

  // 4. Break-Even Analysis Model (Section 82)
  calculateBreakEven(fixedCosts: number, variableCostPerUnit: number, sellingPricePerUnit: number): BreakEvenAnalysisResult {
    const contributionMargin = sellingPricePerUnit - variableCostPerUnit;
    const contributionMarginRatio = sellingPricePerUnit > 0 ? (contributionMargin / sellingPricePerUnit) * 100 : 0;

    const breakEvenUnits = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;
    const breakEvenRevenue = breakEvenUnits * sellingPricePerUnit;

    const maxUnits = Math.max(breakEvenUnits * 2, 100);
    const steps = 10;
    const stepSize = Math.ceil(maxUnits / steps);
    const chartPoints = [];

    for (let u = 0; u <= maxUnits; u += stepSize) {
      chartPoints.push({
        units: u,
        totalRevenue: u * sellingPricePerUnit,
        totalCost: fixedCosts + u * variableCostPerUnit,
        fixedCost: fixedCosts,
      });
    }

    return {
      fixedCosts,
      variableCostPerUnit,
      sellingPricePerUnit,
      contributionMargin: Math.round(contributionMargin * 100) / 100,
      contributionMarginRatio: Math.round(contributionMarginRatio * 100) / 100,
      breakEvenUnits,
      breakEvenRevenue,
      chartPoints,
    };
  }

  // 5. Price Elasticity of Demand Model (Section 83)
  calculatePriceElasticity(p1: number, p2: number, q1: number, q2: number): PriceElasticityResult {
    const percentChangePrice = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;
    const percentChangeQuantity = q1 > 0 ? ((q2 - q1) / q1) * 100 : 0;

    const elasticity = percentChangePrice !== 0 ? Math.abs(percentChangeQuantity / percentChangePrice) : 0;

    let elasticityType: PriceElasticityResult['elasticityType'] = 'Inelastic';
    let interpretation = 'Consumers are relatively unresponsive to price changes (|E| < 1). Total revenue increases when price rises.';

    if (elasticity > 1.05) {
      elasticityType = 'Elastic';
      interpretation = 'Consumers are sensitive to price changes (|E| > 1). Price decreases will raise total revenue.';
    } else if (elasticity >= 0.95 && elasticity <= 1.05) {
      elasticityType = 'Unitary Elastic';
      interpretation = 'Percentage change in quantity demanded exactly offsets price changes (|E| = 1).';
    }

    return {
      initialPrice: p1,
      newPrice: p2,
      initialQuantity: q1,
      newQuantity: q2,
      percentChangePrice: Math.round(percentChangePrice * 100) / 100,
      percentChangeQuantity: Math.round(percentChangeQuantity * 100) / 100,
      elasticityCoefficient: Math.round(elasticity * 100) / 100,
      elasticityType,
      interpretation,
    };
  }

  // 6. Supply and Demand Model (Section 81)
  calculateSupplyDemand(demandIntercept: number = 100, demandSlope: number = 2, supplyIntercept: number = 20, supplySlope: number = 3): SupplyDemandResult {
    // Qd = a - bP
    // Qs = c + dP
    // At equilibrium: a - bP = c + dP => (b + d)P = a - c => P* = (a - c)/(b + d)
    const eqPrice = (demandIntercept - supplyIntercept) / (demandSlope + supplySlope);
    const eqQuantity = demandIntercept - demandSlope * eqPrice;

    // Consumer surplus: 0.5 * (a/b - P*) * Q*
    const maxPriceDemand = demandIntercept / demandSlope;
    const consumerSurplus = 0.5 * (maxPriceDemand - eqPrice) * eqQuantity;

    // Producer surplus: 0.5 * (P* - minPriceSupply) * Q*
    const minPriceSupply = supplyIntercept / supplySlope;
    const producerSurplus = 0.5 * (eqPrice - minPriceSupply) * eqQuantity;

    const curvePoints = [];
    const maxP = Math.ceil(eqPrice * 1.8);
    for (let p = 0; p <= maxP; p += Math.max(1, Math.round(maxP / 8))) {
      curvePoints.push({
        price: p,
        quantityDemanded: Math.max(0, Math.round(demandIntercept - demandSlope * p)),
        quantitySupplied: Math.max(0, Math.round(supplyIntercept + supplySlope * p)),
      });
    }

    return {
      demandIntercept,
      demandSlope,
      supplyIntercept,
      supplySlope,
      equilibriumPrice: Math.round(eqPrice * 100) / 100,
      equilibriumQuantity: Math.round(eqQuantity * 100) / 100,
      consumerSurplus: Math.round(consumerSurplus * 100) / 100,
      producerSurplus: Math.round(producerSurplus * 100) / 100,
      curvePoints,
    };
  }

  // 7. Time-Series Forecasting (Section 84)
  generateForecast(indicatorCode: string = 'GDP_UZ', method: 'Linear Trend' | 'Moving Average (3-Period)' = 'Linear Trend'): EconomicForecastResult {
    const ind = this.indicators.find((i) => i.code === indicatorCode) || this.indicators[0];
    const data = ind.dataPoints;

    const historyPoints = data.map((d) => ({
      period: d.date,
      historicalValue: d.value,
      forecastValue: d.value,
      type: 'Historical' as const,
    }));

    const n = data.length;
    let nextValues: number[] = [];

    if (method === 'Linear Trend') {
      const meanX = (n - 1) / 2;
      const meanY = data.reduce((sum, d) => sum + d.value, 0) / n;
      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        num += (i - meanX) * (data[i].value - meanY);
        den += (i - meanX) * (i - meanX);
      }
      const slope = den === 0 ? 0 : num / den;
      const intercept = meanY - slope * meanX;

      nextValues = [
        Math.round((intercept + slope * n) * 100) / 100,
        Math.round((intercept + slope * (n + 1)) * 100) / 100,
        Math.round((intercept + slope * (n + 2)) * 100) / 100,
      ];
    } else {
      // 3-period moving average
      const last3 = data.slice(-3).map((d) => d.value);
      const avg = last3.reduce((a, b) => a + b, 0) / 3;
      nextValues = [Math.round(avg * 100) / 100, Math.round(avg * 1.03 * 100) / 100, Math.round(avg * 1.06 * 100) / 100];
    }

    const forecastPoints = nextValues.map((val, idx) => ({
      period: `202${6 + idx} (F)`,
      forecastValue: val,
      confidenceLower: Math.round(val * 0.94 * 100) / 100,
      confidenceUpper: Math.round(val * 1.06 * 100) / 100,
      type: 'Forecast' as const,
    }));

    const lastHist = data[data.length - 1].value;
    const finalFore = nextValues[nextValues.length - 1];
    const growthProj = Math.round(((finalFore - lastHist) / lastHist) * 10000) / 100;

    return {
      indicator: ind.name,
      method,
      horizonPeriods: 3,
      dataPoints: [...historyPoints, ...forecastPoints],
      growthProjectionPercent: growthProj,
      disclaimer: 'Forecasts are statistical projections based on historical series and do not guarantee future economic outcomes.',
    };
  }
}

export const economyService = new EconomyService();
