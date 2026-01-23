'use client';

import { motion } from 'motion/react';

const modules = [
  {
    category: 'Clinical',
    items: ['EMR', 'OPD', 'IPD', 'OT Management', 'Anesthesia']
  },
  {
    category: 'Diagnostics',
    items: ['Lab', 'Radiology', 'Pathology', 'Imaging', 'Reports']
  },
  {
    category: 'Hospital Operations',
    items: ['Nursing', 'Bed Management', 'Pharmacy', 'Inventory', 'Biomedical']
  },
  {
    category: 'Finance & Compliance',
    items: ['Billing', 'Insurance Claims', 'Finance MIS', 'Audit Trail', 'NABH']
  },
  {
    category: 'Emergency',
    items: ['Triage', 'ICU Management', 'Ambulance Tracking', 'Critical Alerts']
  },
  {
    category: 'Administration',
    items: ['HR Management', 'Staff Scheduling', 'Attendance', 'Payroll', 'Reports']
  }
];

export function ModulesShowcase() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-white via-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          className="text-center space-y-4 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: '0px 0px -100px 0px' }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            Complete Module Suite
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            All departments connected through one unified system
          </p>
        </motion.div>

        {/* Modules grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '0px 0px -100px 0px' }}
        >
          {modules.map((module, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group p-8 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur hover:border-blue-300 hover:shadow-xl transition-all duration-300"
            >
              {/* Category title */}
              <h3 className="text-sm font-bold text-blue-600 mb-6 uppercase tracking-wide">
                {module.category}
              </h3>

              {/* Items */}
              <div className="space-y-3">
                {module.items.map((item, itemIndex) => (
                  <motion.div 
                    key={itemIndex} 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: itemIndex * 0.05, duration: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400 group-hover:bg-blue-600 transition-colors" />
                    <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
