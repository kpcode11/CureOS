'use client';

import { useState } from 'react';
import { Shield, Users, Lock, BookOpen } from 'lucide-react';
import RolesManagement from '@/components/rbac/roles-management';
import UsersManagement from '@/components/rbac/users-management';
import PermissionsManagement from '@/components/rbac/permissions-management';

type TabType = 'overview' | 'roles' | 'users' | 'permissions';

export default function RBACPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Shield },
    { id: 'roles' as TabType, label: 'Roles', icon: Lock },
    { id: 'users' as TabType, label: 'Users', icon: Users },
    { id: 'permissions' as TabType, label: 'Permissions', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Role-Based Access Control</h1>
          </div>
          <p className="text-gray-600">Manage roles, users, and permissions for your hospital system</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">RBAC Overview</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-600 mb-4">
                  Role-Based Access Control (RBAC) is a method of restricting system access based on a person's role
                  within the organization. In CureOS, RBAC allows you to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 mb-4">
                  <li>Define custom roles with specific permissions</li>
                  <li>Assign roles to users to control their access</li>
                  <li>Create new permissions for specific system actions</li>
                  <li>View audit logs of all RBAC changes</li>
                  <li>Use emergency overrides for critical access needs</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <Lock className="w-8 h-8 text-purple-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Roles</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Define roles like Doctor, Nurse, Pharmacist, etc. and assign permissions to each role.
                </p>
                <button
                  onClick={() => setActiveTab('roles')}
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  Manage Roles →
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <Users className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Users</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Create users and assign roles to control their access to system features.
                </p>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  Manage Users →
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <BookOpen className="w-8 h-8 text-indigo-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Permissions</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Create and manage permissions that can be assigned to roles for fine-grained access control.
                </p>
                <button
                  onClick={() => setActiveTab('permissions')}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  Manage Permissions →
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <Shield className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Security</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Emergency overrides and audit logs ensure accountability and security compliance.
                </p>
                <p className="text-gray-500 text-sm">Coming soon</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Best Practices</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                <li>Follow the principle of least privilege - assign only necessary permissions</li>
                <li>Review role assignments regularly to ensure they're still appropriate</li>
                <li>Use emergency overrides sparingly and review them in audit logs</li>
                <li>Keep role definitions clear and maintainable</li>
              </ul>
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && <RolesManagement />}

        {/* Users Tab */}
        {activeTab === 'users' && <UsersManagement />}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && <PermissionsManagement />}
      </div>
    </div>
  );
}
