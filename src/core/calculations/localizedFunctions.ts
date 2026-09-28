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
  SUM: {
    name: "Yig'indi (SUM)",
    description: "Ustundagi barcha sonli qiymatlarning umumiy yig'indisini hisoblaydi.",
    category: "Asosiy",
  },
  AVERAGE: {
    name: "O'rtacha qiymat (AVERAGE)",
    description: "Ustundagi sonli qiymatlarning o'rtacha arifmetik qiymatini hisoblaydi.",
    category: "Asosiy",
  },
  MIN: {
    name: "Eng kichik qiymat (MIN)",
    description: "Ustundagi eng kichik sonli yoki sana qiymatini aniqlaydi.",
    category: "Asosiy",
  },
  MAX: {
    name: "Eng katta qiymat (MAX)",
    description: "Ustundagi eng katta sonli yoki sana qiymatini aniqlaydi.",
    category: "Asosiy",
  },
  COUNT: {
    name: "Yozuvlar soni (COUNT)",
    description: "Ustundagi to'ldirilgan barcha qatorlar va yozuvlar sonini hisoblaydi.",
    category: "Asosiy",
  },
  MEDIAN: {
    name: "Mediana (MEDIAN)",
    description: "Tartiblangan ma'lumotlar ketma-ketligining markaziy (mediana) qiymatini topadi.",
    category: "Asosiy",
  },
  MODE: {
    name: "Moda (MODE)",
    description: "Ustunda eng ko'p takrorlangan qiymatni aniqlaydi.",
    category: "Asosiy",
  },
  RANGE: {
    name: "Oraliq farqi (RANGE)",
    description: "Maksimal va minimal qiymatlar o'rtasidagi farqni hisoblaydi.",
    category: "Asosiy",
  },
  VARIANCE: {
    name: "Dispersiya (VARIANCE)",
    description: "Sonlarning o'rtacha qiymatdan tarqoqligini (dispersiya) hisoblaydi.",
    category: "Asosiy",
  },
  STANDARD_DEVIATION: {
    name: "Standart og'ish (STDEV)",
    description: "Ma'lumotlar to'plamining standart kvadratik og'ishini hisoblaydi.",
    category: "Asosiy",
  },
  COUNTIF: {
    name: "Shartli hisoblash (COUNTIF)",
    description: "Berilgan shartga to'g'ri keluvchi qatorlar sonini hisoblaydi.",
    category: "Shartli",
  },
  SUMIF: {
    name: "Shartli yig'indi (SUMIF)",
    description: "Berilgan mezon yoki shartga mos keladigan qatorlar yig'indisini hisoblaydi.",
    category: "Shartli",
  },
  AVERAGEIF: {
    name: "Shartli o'rtacha (AVERAGEIF)",
    description: "Berilgan shartga javob beruvchi yozuvlarning o'rtacha qiymatini hisoblaydi.",
    category: "Shartli",
  },
  PERCENTAGE: {
    name: "Foiz ulushi (PERCENTAGE)",
    description: "Shartga mos yozuvlarning umumiy miqdorga nisbatan foiz ulushini hisoblaydi.",
    category: "Foizlar",
  },
  PERCENT_OF_TOTAL: {
    name: "Jami hisobdan foiz",
    description: "Har bir guruhning umumiy yig'indiga nisbatan foiz ulushini ko'rsatadi.",
    category: "Foizlar",
  },
  PERCENT_CHANGE: {
    name: "Foiz o'zgarishi",
    description: "Ketma-ket davrlar yoki qatorlar orasidagi foiz farqini hisoblaydi.",
    category: "Foizlar",
  },
  RUNNING_TOTAL: {
    name: "O'sib boruvchi yig'indi",
    description: "Qatorma-qator to'planib, o'sib boruvchi umumiy yig'indini hisoblaydi.",
    category: "Ma'lumotlar",
  },
  GROWTH_RATE: {
    name: "O'sish sur'ati",
    description: "Boshlang'ich va oxirgi qiymat o'rtasidagi o'sish sur'atini hisoblaydi.",
    category: "Foizlar",
  },
  UNIQUE_COUNT: {
    name: "Noyob qiymatlar soni",
    description: "Ustundagi takrorlanmas, unikal qiymatlar sonini hisoblaydi.",
    category: "Ma'lumotlar",
  },
  DUPLICATE_COUNT: {
    name: "Takroriy yozuvlar soni",
    description: "Ustundagi takrorlangan, dublikat qatorlar sonini hisoblaydi.",
    category: "Ma'lumotlar",
  },
  MISSING_VALUES: {
    name: "Bo'sh kataklar soni",
    description: "To'ldirilmagan yoki bo'sh qoldirilgan kataklar foizi va sonini aniqlaydi.",
    category: "Ma'lumotlar",
  },
  FIRST: {
    name: "Birinchi qiymat",
    description: "Ustundagi eng birinchi qator qiymatini qaytaradi.",
    category: "Ma'lumotlar",
  },
  LAST: {
    name: "Oxirgi qiymat",
    description: "Ustundagi eng oxirgi qator qiymatini qaytaradi.",
    category: "Ma'lumotlar",
  },
  DATE_DIFF_DAYS: {
    name: "Sanalar farqi (kunlarda)",
    description: "Ikki sana o'rtasidagi umumiy kunlar farqini hisoblaydi.",
    category: "Sana",
  },
  YEAR: {
    name: "Yilni ajratish",
    description: "Sana ustunidan to'rt xonali yil qiymatini ajratib oladi.",
    category: "Sana",
  },
  MONTH: {
    name: "Oyni ajratish",
    description: "Sana ustunidan oy tartib raqami yoki nomini ajratib oladi.",
    category: "Sana",
  },
  CONCATENATE: {
    name: "Matnlarni birlashtirish",
    description: "Bir nechta ustundagi matnlarni bir-biriga ulaydi.",
    category: "Matn",
  },
  UPPERCASE: {
    name: "Katta harflar",
    description: "Matndagi barcha harflarni bosh harflarga aylantiradi.",
    category: "Matn",
  },
  GROSS_PROFIT: {
    name: "Yalpi foyda (GROSS_PROFIT)",
    description: "Yalpi daromaddan sotilgan mahsulot tannarxini (COGS) ayirish orqali yalpi foydani hisoblaydi.",
    category: "Buxgalteriya",
  },
  NET_PROFIT: {
    name: "Sof foyda (NET_PROFIT)",
    description: "Barcha operatsion xarajatlar va soliqlarni ayirgandan keyingi qolgan sof foydani hisoblaydi.",
    category: "Buxgalteriya",
  },
  PROFIT_MARGIN: {
    name: "Foydalilik marjasi (PROFIT_MARGIN %)",
    description: "Sof foydaning umumiy tushumga nisbatan foiz ulushini hisoblaydi.",
    category: "Buxgalteriya",
  },
  CURRENT_RATIO: {
    name: "Joriy likvidlik koeffitsienti (CURRENT_RATIO)",
    description: "Joriy aktivlarning joriy majburiyatlarga nisbati orqali to'lov qobiliyatini baholaydi.",
    category: "Buxgalteriya",
  },
  BREAK_EVEN_UNITS: {
    name: "Zararsizlik nuqtasi (BREAK_EVEN_UNITS)",
    description: "Barcha doimiy va o'zgaruvchan xarajatlarni qoplash uchun zarur bo'lgan minimal sotuv hajmi.",
    category: "Buxgalteriya",
  },
  CAGR: {
    name: "Yillik o'rtacha o'sish sur'ati (CAGR %)",
    description: "Bir necha davr mobaynida yillik o'rtacha murakkab o'sish sur'atini hisoblaydi.",
    category: "Iqtisodiyot",
  },
  INFLATION_RATE: {
    name: "Inflyatsiya darajasi (INFLATION_RATE %)",
    description: "Narxlar umumiy darajasining davrlararo foiz o'zgarishini o'lchaydi.",
    category: "Iqtisodiyot",
  },
  REAL_VALUE: {
    name: "Real qiymat (REAL_VALUE)",
    description: "Nominal ko'rsatkichni inflyatsiya indeksiga tuzatish orqali xarid qobiliyatini ifodalaydi.",
    category: "Iqtisodiyot",
  },
  TRADE_BALANCE: {
    name: "Tashqi savdo balansi (TRADE_BALANCE)",
    description: "Eksport va import hajmlari o'rtasidagi sof farq (savdo profitsiti yoki defitsiti).",
    category: "Iqtisodiyot",
  },
  CORRELATION: {
    name: "Korrelyatsiya koeffitsienti (CORRELATION)",
    description: "Ikki iqtisodiy o'zgaruvchi o'rtasidagi chiziqli bog'liqlik darajasi (Pirson r).",
    category: "Iqtisodiyot",
  },
};

export const CATEGORIES_EN = ['All', 'Basic', 'Conditional', 'Data', 'Percentage', 'Date', 'Text', 'Accounting', 'Economy'];
export const CATEGORIES_UZ = ['Barchasi', 'Asosiy', 'Shartli', 'Maʼlumotlar', 'Foizlar', 'Sana', 'Matn', 'Buxgalteriya', 'Iqtisodiyot'];

export const CATEGORY_MAP_EN_TO_UZ: Record<string, string> = {
  All: 'Barchasi',
  Basic: 'Asosiy',
  Conditional: 'Shartli',
  Data: 'Maʼlumotlar',
  Percentage: 'Foizlar',
  Date: 'Sana',
  Text: 'Matn',
  Accounting: 'Buxgalteriya',
  Economy: 'Iqtisodiyot',
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
        name: uzData?.name || `${fn.name} (${fn.id})`,
        description: uzData?.description || fn.description,
        category: fn.category,
      };
    });
  }

  return baseFunctions.map((fn) => ({
    ...fn,
    name: `${fn.name} (${fn.id})`,
  }));
}

export function getFunctionName(fnId: string, lang: Language): string {
  if (lang === 'uz' && UZBEK_FUNCTION_DATA[fnId]) {
    return UZBEK_FUNCTION_DATA[fnId].name;
  }
  const base = getAvailableFunctions().find((f) => f.id === fnId);
  return base ? `${base.name} (${base.id})` : fnId;
}
