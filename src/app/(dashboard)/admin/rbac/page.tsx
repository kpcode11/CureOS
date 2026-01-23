'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import RolesManagement from '@/components/rbac/roles-management';
import UsersManagement from '@/components/rbac/users-management';
import PermissionsManagement from '@/components/rbac/permissions-management';

type TabType = 'roles' | 'users' | 'permissions';

export default function RBACPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('roles');

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['roles', 'users', 'permissions'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const getTitle = () => {
    switch (activeTab) {
      case 'roles':
        return 'Roles';
      case 'users':
        return 'Users';
      case 'permissions':
        return 'Permissions';
    }
  };

  const getDescription = () => {
    switch (activeTab) {
      case 'roles':
        return 'Manage system roles and assign permissions';
      case 'users':
        return 'Manage users and assign roles';
      case 'permissions':
        return 'Manage system permissions';
    }
  };

  return (
    <div className="flex-1 bg-white">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="text-gray-600 mt-1">{getDescription()}</p>
        </div>

        {/* Content */}
        {activeTab === 'roles' && <RolesManagement />}
        {activeTab === 'users' && <UsersManagement />}
        {activeTab === 'permissions' && <PermissionsManagement />}
      </div>
    </div>
  );
}
