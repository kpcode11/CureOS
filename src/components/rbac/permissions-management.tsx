'use client';

import { useState } from 'react';
import { usePermissions } from '@/hooks/use-rbac';
import { Plus, X } from 'lucide-react';

export default function PermissionsManagement() {
  const { permissions, loading, error, createPermissions } = usePermissions();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPermissionNames, setNewPermissionNames] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = newPermissionNames
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n);

    if (names.length === 0) {
      setFormError('Enter at least one permission name');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPermissions(names);
      setNewPermissionNames('');
      setShowCreateModal(false);
      setFormError('');
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      const category = perm.name.split('.')[0];
      if (!acc[category]) acc[category] = [];
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, typeof permissions>
  );

  if (loading && permissions.length === 0) {
    return <div className="p-6 text-center text-gray-500">Loading permissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Permissions Management</h2>
        <button
          onClick={() => {
            setNewPermissionNames('');
            setFormError('');
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Permission
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      {/* Permissions by Category */}
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">{category} Permissions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {perms.map((perm) => (
                <div key={perm.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 text-sm">{perm.name}</h4>
                  {perm.description && <p className="text-xs text-gray-500 mt-1">{perm.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    Created: {new Date(perm.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {permissions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No permissions defined yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
          >
            Create Your First Permission
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create New Permissions</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Permission Names</label>
                <textarea
                  value={newPermissionNames}
                  onChange={(e) => setNewPermissionNames(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                  placeholder="Enter one permission per line&#10;e.g:&#10;audit.read&#10;inventory.manage"
                  rows={6}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-2">Enter one permission name per line. Format: category.action</p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
