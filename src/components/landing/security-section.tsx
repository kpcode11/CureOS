'use client';

import { Lock, Database, Shield } from 'lucide-react';
import { motion } from 'motion/react';

const securityFeatures = [
  {
    icon: Lock,
    title: '256-bit End-to-End Encryption',
    description: 'Military-grade encryption for all patient data and communications'
  },
  {
    icon: Database,
    title: 'Automated Backups',
    description: 'Real-time redundancy and disaster recovery across multiple data centers'
  },
  {
    icon: Shield,
    title: 'Role-Based Access Control',
    description: 'Granular permission management with complete audit logs for every action'
  }
];

export function SecuritySection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div 
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: '0px 0px -100px 0px' }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Enterprise Security</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            Healthcare-Grade Security
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Built for HIPAA, GDPR, and the highest security standards
          </p>
        </motion.div>

        {/* Security features */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '0px 0px -100px 0px' }}
        >
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="mb-4 p-3 rounded-lg bg-blue-50 w-fit">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Compliance badges */}
        <motion.div 
          className="bg-blue-50 rounded-2xl border border-blue-200 p-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className="text-center text-lg font-semibold text-slate-900 mb-8">
            Industry Certifications & Compliance
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: 'HIPAA', description: 'Patient data privacy' },
              { label: 'ISO 27001', description: 'Information security' },
              { label: 'NABH', description: 'Healthcare standards' },
              { label: 'GDPR', description: 'Data protection' }
            ].map((cert, index) => (
              <motion.div 
                key={index} 
                className="text-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-xl font-bold text-blue-600 mb-2">
                  {cert.label}
                </div>
                <p className="text-sm text-slate-600">
                  {cert.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
