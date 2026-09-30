import { Language } from '../../lib/i18n';
import { getAvailableFunctions } from './engine';

export interface LocalizedFunctionInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredInputType: string[];
  outputType: string;
  parameters?: any;
  visualizationCompatibility?: string[];
}

const UZBEK_FUNCTION_DATA: Record<string, { name: string; description: string; category: string }> = {
  // 1. Basic
  SUM: {
    name: "Yigʻindi (Sum)",
    description: "Ustundagi barcha sonli qiymatlarning umumiy yigʻindisini hisoblaydi.",
    category: "Asosiy hisob-kitob",
  },
  AVERAGE: {
    name: "Oʻrtacha qiymat (Average)",
    description: "Ustundagi sonli qiymatlarning oʻrtacha arifmetik qiymatini hisoblaydi.",
    category: "Asosiy hisob-kitob",
  },
  MIN: {
    name: "Eng kichik qiymat (Minimum)",
    description: "Ustundagi eng kichik sonli yoki sana qiymatini aniqlaydi.",
    category: "Asosiy hisob-kitob",
  },
  MAX: {
    name: "Eng katta qiymat (Maximum)",
    description: "Ustundagi eng katta sonli yoki sana qiymatini aniqlaydi.",
    category: "Asosiy hisob-kitob",
  },
  COUNT: {
    name: "Yozuvlar soni (Count)",
    description: "Ustundagi toʻldirilgan barcha qatorlar va yozuvlar sonini hisoblaydi.",
    category: "Asosiy hisob-kitob",
  },
  COUNT_UNIQUE: {
    name: "Noyob qiymatlar soni (Count Unique)",
    description: "Ustundagi takrorlanmas noyob qiymatlar sonini aniqlaydi.",
    category: "Asosiy hisob-kitob",
  },

  // 2. Comparison
  COMPARE_CATEGORIES: {
    name: "Kategoriyalarni taqqoslash (Compare Categories)",
    description: "Turli toifalar/guruhlar boʻyicha koʻrsatkichlarni taqqoslaydi va tartiblaydi.",
    category: "Taqqoslash",
  },
  COMPARE_PERIODS: {
    name: "Davrlarni taqqoslash (Compare Periods)",
    description: "Ikki davr oʻrtasidagi oʻzgarish va farqni foizda taqqoslaydi.",
    category: "Taqqoslash",
  },

  // 3. Percentage
  PERCENTAGE: {
    name: "Foiz ulushi (Percentage)",
    description: "Shartga mos yozuvlarning yoki guruhlarning umumiy miqdorga nisbatan foiz ulushini hisoblaydi.",
    category: "Foizlar",
  },
  PERCENTAGE_CHANGE: {
    name: "Foiz oʻzgarishi (Percentage Change)",
    description: "Vaqt yoki qatorlar boʻyicha oʻzgarish surʼatini foizda hisoblaydi.",
    category: "Foizlar",
  },

  // 4. Time Analysis
  DAILY_TOTAL: {
    name: "Kunlik jami (Daily Total)",
    description: "Kunlar boʻyicha koʻrsatkichlar yigʻindisini xronologik tartibda chiqaradi.",
    category: "Vaqt tahlili",
  },
  MONTHLY_TOTAL: {
    name: "Oylik jami (Monthly Total)",
    description: "Oylar boʻyicha jamlangan koʻrsatkichlarni hisoblaydi.",
    category: "Vaqt tahlili",
  },
  YEARLY_TOTAL: {
    name: "Yillik jami (Yearly Total)",
    description: "Yillar boʻyicha jamlangan koʻrsatkichlarni hisoblaydi.",
    category: "Vaqt tahlili",
  },
  GROWTH: {
    name: "Oʻsish surʼati (Growth)",
    description: "Vaqt oʻtishi bilan umumiy oʻsish tendentsiyasini hisoblaydi.",
    category: "Vaqt tahlili",
  },

  // 5. Data Operations
  SORT: {
    name: "Tartiblash (Sort)",
    description: "Qatorlarni tanlangan ustun boʻyicha oʻsish yoki kamayish tartibida saralaydi.",
    category: "Amallar",
  },
  FILTER: {
    name: "Filtrlash (Filter)",
    description: "Belgilangan shartlarga mos keluvchi qatorlarni ajratib oladi.",
    category: "Amallar",
  },
};

export const CATEGORIES_EN = ['All', 'Basic', 'Comparison', 'Percentage', 'Time Analysis', 'Data Operations'];
export const CATEGORIES_UZ = ['Barchasi', 'Asosiy hisob-kitob', 'Taqqoslash', 'Foizlar', 'Vaqt tahlili', 'Amallar'];

export const CATEGORY_MAP_EN_TO_UZ: Record<string, string> = {
  All: 'Barchasi',
  Basic: 'Asosiy hisob-kitob',
  Comparison: 'Taqqoslash',
  Percentage: 'Foizlar',
  'Time Analysis': 'Vaqt tahlili',
  'Data Operations': 'Amallar',
};

export function getLocalizedCategories(lang: Language): { id: string; name: string }[] {
  return CATEGORIES_EN.map((catKey) => ({
    id: catKey,
    name: lang === 'uz' ? CATEGORY_MAP_EN_TO_UZ[catKey] || catKey : catKey,
  }));
}

export function getLocalizedFunctions(lang: Language): LocalizedFunctionInfo[] {
  const baseFunctions = getAvailableFunctions();

  if (lang === 'uz') {
    return baseFunctions.map((fn) => {
      const uzData = UZBEK_FUNCTION_DATA[fn.id];
      return {
        ...fn,
        name: uzData?.name || fn.name,
        description: uzData?.description || fn.description,
        category: uzData?.category || fn.category,
      };
    });
  }

  return baseFunctions;
}

export function getFunctionName(functionId: string, lang: Language): string {
  const fns = getLocalizedFunctions(lang);
  const found = fns.find((f) => f.id === functionId);
  return found?.name || functionId;
}

export function getLocalizedFunction(functionId: string, lang: Language): LocalizedFunctionInfo {
  const fns = getLocalizedFunctions(lang);
  const found = fns.find((f) => f.id === functionId);
  if (found) return found;
  return {
    id: functionId,
    name: functionId,
    description: '',
    category: 'Basic',
    requiredInputType: ['number'],
    outputType: 'number',
  };
}
