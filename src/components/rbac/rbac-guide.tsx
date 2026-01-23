'use client';

import { Shield, Users, Lock, Zap } from 'lucide-react';

export default function RBACGuide() {
  return (
    <div className="space-y-6">
      {/* How RBAC Works */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">How RBAC Works</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 text-blue-600">
                <span className="font-semibold">1</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Define Permissions</h4>
              <p className="text-sm text-gray-600 mt-1">
                Create granular permissions like "patients.read", "prescriptions.create", etc.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-100 text-purple-600">
                <span className="font-semibold">2</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Group into Roles</h4>
              <p className="text-sm text-gray-600 mt-1">
                Bundle related permissions into roles like "Doctor", "Nurse", "Pharmacist"
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-100 text-green-600">
                <span className="font-semibold">3</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Assign Roles to Users</h4>
              <p className="text-sm text-gray-600 mt-1">
                Assign roles to users to grant them specific permissions automatically
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600">
                <span className="font-semibold">4</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">System Enforces Access</h4>
              <p className="text-sm text-gray-600 mt-1">
                CureOS automatically checks permissions on every action and grants/denies access
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reference Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Default System Roles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Primary Permissions</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Use Case</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                    ADMIN
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">All permissions</td>
                <td className="px-6 py-3 text-gray-600">System administrator</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                    DOCTOR
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">
                  patients.read, patients.update, prescriptions.create, prescriptions.read
                </td>
                <td className="px-6 py-3 text-gray-600">Medical practitioners</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    NURSE
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">patients.read, patients.update, audit.read</td>
                <td className="px-6 py-3 text-gray-600">Nursing staff</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
                    PHARMACIST
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">
                  prescriptions.read, prescriptions.dispense, patients.read
                </td>
                <td className="px-6 py-3 text-gray-600">Pharmacy staff</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded">
                    LAB_TECH
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">lab.*, patients.read</td>
                <td className="px-6 py-3 text-gray-600">Lab technicians</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                    RECEPTIONIST
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">patients.create, appointments.*</td>
                <td className="px-6 py-3 text-gray-600">Front desk staff</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                    EMERGENCY
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600">emergency.request, emergency.override</td>
                <td className="px-6 py-3 text-gray-600">Emergency personnel</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h4 className="font-semibold text-gray-900">Session-Based Auth</h4>
          </div>
          <p className="text-sm text-gray-600">
            All users must be authenticated. Sessions are managed securely via NextAuth.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Lock className="w-6 h-6 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Password Security</h4>
          </div>
          <p className="text-sm text-gray-600">
            Passwords are hashed with bcrypt (10 rounds). Never stored in plain text.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-yellow-600" />
            <h4 className="font-semibold text-gray-900">Emergency Overrides</h4>
          </div>
          <p className="text-sm text-gray-600">
            Critical access can be granted via secure tokens. All overrides are audited.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-6 h-6 text-green-600" />
            <h4 className="font-semibold text-gray-900">Audit Logging</h4>
          </div>
          <p className="text-sm text-gray-600">
            Every permission check, role change, and user action is logged for compliance.
          </p>
        </div>
      </div>

      {/* Permission Matrix Example */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Permission Naming Convention</h3>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm space-y-2">
          <div className="flex gap-4">
            <code className="text-blue-600 font-semibold">resource.action</code>
            <span className="text-gray-600">Format for all permissions</span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
            <div className="flex gap-4">
              <code className="text-green-600">patients.create</code>
              <span className="text-gray-600">Create new patient records</span>
            </div>
            <div className="flex gap-4">
              <code className="text-green-600">patients.read</code>
              <span className="text-gray-600">View patient information</span>
            </div>
            <div className="flex gap-4">
              <code className="text-green-600">patients.update</code>
              <span className="text-gray-600">Modify patient data</span>
            </div>
            <div className="flex gap-4">
              <code className="text-green-600">patients.delete</code>
              <span className="text-gray-600">Remove patient records</span>
            </div>
            <div className="flex gap-4">
              <code className="text-blue-600">prescriptions.dispense</code>
              <span className="text-gray-600">Dispense medications to patients</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
