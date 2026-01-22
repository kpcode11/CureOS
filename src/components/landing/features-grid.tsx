'use client';

import { Stethoscope, Ambulance, Beaker, Pill, BarChart3, Users, Zap, Clock } from 'lucide-react';
import { motion } from 'motion/react';

const features = [
  {
    icon: Stethoscope,
    title: 'Clinical Management',
    description: 'EMR, OPD/IPD, electronic prescriptions, and clinical workflows in one place'
  },
  {
    icon: Ambulance,
    title: 'Emergency Care',
    description: 'Real-time emergency triage, bed management, and critical patient tracking'
  },
  {
    icon: Beaker,
    title: 'Lab & Diagnostics',
    description: 'Integrated lab orders, automated testing, and radiology imaging reports'
  },
  {
    icon: Pill,
    title: 'Pharmacy Operations',
    description: 'Inventory management, medication dispensing, and drug interaction alerts'
  },
  {
    icon: BarChart3,
    title: 'Financial & Billing',
    description: 'Automated billing, insurance claims, revenue tracking, and financial MIS'
  },
  {
    icon: Users,
    title: 'Resource Management',
    description: 'Staff scheduling, bed allocation, equipment tracking, and HR integration'
  },
  {
    icon: Zap,
    title: 'Real-time Dashboards',
    description: 'Live KPIs, occupancy rates, revenue metrics, and operational analytics'
  },
  {
    icon: Clock,
    title: 'Workflow Automation',
    description: 'Eliminate manual work with intelligent automation and approval chains'
  }
];

export function FeaturesGrid() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  return (
    <section id="features" className="py-24 bg-white">
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
            Comprehensive Capabilities
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Every module hospitals need, seamlessly integrated into one intelligent platform
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '0px 0px -100px 0px' }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 hover:shadow-lg"
              >
                {/* Icon container */}
                <div className="mb-4 p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors w-fit">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover indicator */}
                <motion.div 
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ originX: 0 }}
                  layoutId={`underline-${index}`}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
