import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATES } from '../../core/templates';
import { api } from '../../services/api/client';
import { useI18n } from '../../lib/i18n';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  DollarSign,
  PieChart,
  CheckSquare,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap,
  TrendingUp,
  DollarSign,
  PieChart,
  CheckSquare,
  UserCheck,
};

export const TemplatesPage: React.FC = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [notification, setNotification] = useState<string | null>(null);

  const categories = [
    { id: 'All', name: lang === 'uz' ? 'Barchasi' : 'All' },
    { id: 'Education', name: lang === 'uz' ? 'Taʼlim' : 'Education' },
    { id: 'Business', name: lang === 'uz' ? 'Biznes' : 'Business' },
    { id: 'Personal', name: lang === 'uz' ? 'Shaxsiy' : 'Personal' },
    { id: 'Project Management', name: lang === 'uz' ? 'Loyihalar Boshqaruvi' : 'Project Management' },
  ];

  const filteredTemplates = activeCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  const handleUseTemplate = async (template: typeof TEMPLATES[0]) => {
    if (template.sampleDataRows && template.sampleDataRows.length > 0) {
      const headers = Object.keys(template.sampleDataRows[0]);
      const newSheet = await api.connectSheet({
        name: template.name,
        url: 'https://docs.google.com/spreadsheets/d/template_' + template.id,
        selectedTab: 'TemplateData',
        rows: template.sampleDataRows,
        columns: template.expectedColumns.map((col, idx) => ({
          id: `col_${idx}`,
          name: col.name,
          index: idx,
          detectedType: col.type as any,
          nullable: false,
          sampleValues: template.sampleDataRows!.slice(0, 3).map((r) => r[col.name]),
        })),
      });

      setNotification(
        lang === 'uz'
          ? `"${template.name}" shabloni muvaffaqiyatli ishga tushirildi!`
          : `Template "${template.name}" instantiated successfully!`
      );
      setTimeout(() => {
        navigate(`/sheets/${newSheet.metadata.id}`);
      }, 800);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/30 flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'uz' ? 'Tayyor Yechimlar va Konstruksiyalar' : 'Turnkey Spreadsheet Solutions'}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {lang === 'uz' ? 'Tayyor Jadval Shablonlari' : `Pre-Configured Sheet ${t('templates')}`}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          {lang === 'uz'
            ? 'Taʼlim, korxona moliyasi, SaaS daromadlari va boshqaruv uchun tayyor boshqaruv panellari va hisoblashlarni bir zumda ishga tushiring.'
            : 'Instantly launch production-ready dashboards and calculations for education, enterprise finance, SaaS revenue, and operations.'}
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const Icon = ICON_MAP[template.iconName] || Sparkles;

          return (
            <div
              key={template.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-md p-6 flex flex-col justify-between space-y-5 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition shadow-sm group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {template.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
                    {template.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                    {lang === 'uz' ? 'Kutilayotgan ustunlar:' : 'Expected Columns:'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {template.expectedColumns.slice(0, 4).map((col, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                      >
                        {col.name}
                      </span>
                    ))}
                    {template.expectedColumns.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                        +{template.expectedColumns.length - 4} {lang === 'uz' ? 'ta yana' : 'more'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleUseTemplate(template)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-500 dark:bg-slate-800 dark:hover:bg-emerald-500 hover:text-slate-950 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm group-hover:shadow-emerald-500/20"
              >
                <span>{lang === 'uz' ? 'Shablondan foydalanish' : 'Instantiate Template'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
