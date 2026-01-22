'use client';

import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const benefits = [
  {
    title: 'Reduce Revenue Leakage',
    description: 'Tight tracking of services, medications, and claims with complete audit trails'
  },
  {
    title: 'Lower Clinical Risk',
    description: 'Real-time alerts, decision support, and standardized clinical protocols'
  },
  {
    title: 'Cut Operational Costs',
    description: 'Eliminate manual work, reduce patient wait times, optimize resource utilization'
  },
  {
    title: 'Improve Patient Care',
    description: 'Faster diagnosis, seamless care coordination, better patient outcomes'
  },
  {
    title: 'Ensure Compliance',
    description: 'HIPAA compliant, NABH aligned, complete regulatory documentation'
  },
  {
    title: 'Data-Driven Decisions',
    description: 'Real-time MIS dashboards with KPIs for management and department heads'
  }
];

export function BenefitsSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <section className="py-24 bg-white">
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
            Why Choose Cureos?
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Proven benefits that modern hospitals achieve with our platform
          </p>
        </motion.div>

        {/* Benefits grid */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '0px 0px -100px 0px' }}
        >
          {benefits.map((benefit, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              className="flex gap-6 group"
            >
              {/* Icon */}
              <motion.div 
                className="flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center group-hover:from-blue-200 transition-colors">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                </div>
              </motion.div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 pt-20 border-t border-slate-200">
          {[
            { value: '50%', label: 'Reduction in manual work' },
            { value: '30%', label: 'Cost savings in operations' },
            { value: '99.9%', label: 'System uptime guarantee' }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
              <p className="text-slate-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
