'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import GooeySvgFilter from '@/components/fancy/filter/gooey-svg-filter';
import Stats10 from '@/components/stats-10';
import useDetectBrowser from '@/hooks/use-detect-browser';
import useScreenSize from '@/hooks/use-screen-size';

interface DepartmentAnalytics {
  date: string;
  [key: string]: string | number;
}

interface DepartmentSummary {
  name: string;
  tickerSymbol: string;
  value: string | number;
  change: string | number;
  percentageChange: string;
  changeType: 'positive' | 'negative';
}

interface DepartmentData {
  title: string;
  description: string;
  metrics: string[];
  analyticsData: DepartmentAnalytics[];
  summary: DepartmentSummary[];
}

const DEPARTMENTS: DepartmentData[] = [
  {
    title: 'Billing',
    description: 'Financial operations & revenue',
    metrics: ['Total Charges', 'Pending Bills', 'Collections'],
    analyticsData: [],
    summary: [],
  },
  {
    title: 'Emergency',
    description: 'Emergency department operations',
    metrics: ['Active Cases', 'Wait Time', 'Critical Alerts'],
    analyticsData: [],
    summary: [],
  },
  {
    title: 'Nursing',
    description: 'Nursing & patient care',
    metrics: ['Assigned Patients', 'Pending Tasks', 'MAR Compliance'],
    analyticsData: [],
    summary: [],
  },
  {
    title: 'Clinical',
    description: 'Clinical operations & EMR',
    metrics: ['Active Patients', 'Pending Orders', 'EMR Updates'],
    analyticsData: [],
    summary: [],
  },
  {
    title: 'Pharmacy',
    description: 'Pharmacy operations',
    metrics: ['Pending Prescriptions', 'Stock Alerts', 'Fulfillment Rate'],
    analyticsData: [],
    summary: [],
  },
  {
    title: 'Lab',
    description: 'Laboratory services',
    metrics: ['Pending Tests', 'Results Pending', 'TAT Compliance'],
    analyticsData: [],
    summary: [],
  },
  {
    title: 'Surgery',
    description: 'Operation theater management',
    metrics: ['Scheduled Surgeries', 'OT Availability', 'Implant Tracking'],
    analyticsData: [],
    summary: [],
  },
];

export default function GooeyDepartmentDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [departments, setDepartments] = useState<DepartmentData[]>(DEPARTMENTS);
  const [isLoading, setIsLoading] = useState(true);
  const screenSize = useScreenSize();
  const browserName = useDetectBrowser();
  const isSafari = browserName === 'Safari';

  // Fetch department-specific analytics
  useEffect(() => {
    const fetchDepartmentAnalytics = async () => {
      setIsLoading(true);
      try {
        const updatedDepts = await Promise.all(
          DEPARTMENTS.map(async (dept) => {
            try {
              const response = await fetch(`/api/admin/departments/${dept.title.toLowerCase()}`);
              if (!response.ok) throw new Error('Failed to fetch');
              
              const data = await response.json();
              return {
                ...dept,
                analyticsData: data.analyticsData || generateMockAnalytics(dept.title),
                summary: data.summary || generateMockSummary(dept.title),
              };
            } catch (error) {
              console.error(`Failed to fetch ${dept.title} analytics:`, error);
              return {
                ...dept,
                analyticsData: generateMockAnalytics(dept.title),
                summary: generateMockSummary(dept.title),
              };
            }
          })
        );
        setDepartments(updatedDepts);
      } catch (error) {
        console.error('Failed to fetch department analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentAnalytics();
  }, []);

  const generateMockAnalytics = (department: string): DepartmentAnalytics[] => {
    const days = ['Jan 18', 'Jan 19', 'Jan 20', 'Jan 21', 'Jan 22', 'Jan 23', 'Jan 24', 'Jan 25'];
    const metricName = DEPARTMENTS.find(d => d.title.toLowerCase() === department.toLowerCase())?.metrics[0] || 'Metric 1';
    
    return days.map((date, idx) => ({
      date,
      [metricName]: 100 + Math.floor(Math.random() * 50),
      [DEPARTMENTS.find(d => d.title.toLowerCase() === department.toLowerCase())?.metrics[1] || 'Metric 2']: 50 + Math.floor(Math.random() * 30),
      [DEPARTMENTS.find(d => d.title.toLowerCase() === department.toLowerCase())?.metrics[2] || 'Metric 3']: 75 + Math.floor(Math.random() * 25),
    }));
  };

  const generateMockSummary = (department: string): DepartmentSummary[] => {
    const dept = DEPARTMENTS.find(d => d.title.toLowerCase() === department.toLowerCase());
    if (!dept) return [];

    return dept.metrics.map((metric, idx) => ({
      name: metric,
      tickerSymbol: metric.split(' ').map(w => w[0]).join('').toUpperCase(),
      value: 100 + idx * 20,
      change: Math.random() > 0.5 ? `+${Math.floor(Math.random() * 10)}` : `-${Math.floor(Math.random() * 10)}`,
      percentageChange: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 20).toFixed(1)}%`,
      changeType: Math.random() > 0.5 ? 'positive' : 'negative',
    }));
  };

  return (
    <div className="relative w-full bg-white dark:bg-slate-950">
      <GooeySvgFilter
        id="gooey-filter-dept"
        strength={screenSize.lessThan('md') ? 8 : 15}
      />

      <div className="w-full relative">
        {/* Interactive Tab Buttons - TOP (No Filter) */}
        <div className="relative flex w-full h-8 md:h-12 z-20">
          {departments.map((dept, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className="flex-1 h-8 md:h-12 flex items-center justify-center transition-colors duration-200"
            >
              <span
                className={`text-xs md:text-sm font-semibold transition-colors ${
                  activeTab === index
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {dept.title}
              </span>
            </button>
          ))}
        </div>

        {/* Gooey Background Bar - Behind Buttons */}
        <div
          className="absolute top-0 left-0 right-0 flex w-full h-8 md:h-12 bg-gray-50 dark:bg-slate-950 z-10"
          style={{ filter: 'url(#gooey-filter-dept)' }}
        >
          {/* Gooey background elements */}
          {departments.map((_, index) => (
            <div key={index} className="relative flex-1">
              {activeTab === index && (
                <motion.div
                  layoutId="active-dept-tab"
                  className="absolute inset-0 bg-blue-100 dark:bg-blue-900/40"
                  transition={{
                    type: 'spring',
                    bounce: 0.0,
                    duration: isSafari ? 0 : 0.4,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content Panel */}
        <div className="w-full min-h-[150px] md:min-h-[180px] bg-blue-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-800 mt-0">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeTab}
              initial={{
                opacity: 0,
                y: 50,
                filter: 'blur(10px)',
              }}
              animate={{
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
              }}
              exit={{
                opacity: 0,
                y: -50,
                filter: 'blur(10px)',
              }}
              transition={{
                duration: 0.2,
                ease: 'easeOut',
              }}
              className="p-6 md:p-12"
            >
              <div className="space-y-4">
                <div className="pt-4">
                  <Stats10
                    data={departments[activeTab].analyticsData}
                    summary={departments[activeTab].summary}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

