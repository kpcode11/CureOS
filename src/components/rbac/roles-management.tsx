"use client";

import { useState, useMemo } from "react";
import { Trash2, Plus, X, Users as UsersIcon, Edit2 } from "lucide-react";
import { useRoles, usePermissions, useUsers } from "@/hooks/use-rbac";

export default function RolesManagement() {
  const { roles, loading, error, createRole, updateRole, deleteRole } =
    useRoles();
  const { permissions } = usePermissions();
  const { users, updateUser } = useUsers();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedRoleForUsers, setSelectedRoleForUsers] = useState<
    string | null
  >(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClick = () => {
    setFormData({ name: "", permissions: [] });
    setFormError("");
    setShowCreateModal(true);
  };

  const handleEditClick = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      setFormData({
        name: role.name,
        permissions: role.rolePermissions.map((rp) => rp.permission.name),
      });
      setEditingRoleId(roleId);
      setFormError("");
      setShowCreateModal(true);
    }
  };

  const handlePermissionToggle = (permissionName: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter((p) => p !== permissionName)
        : [...prev.permissions, permissionName],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Role name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRoleId) {
        await updateRole(editingRoleId, formData.name, formData.permissions);
      } else {
        await createRole(formData.name, formData.permissions);
      }
      setShowCreateModal(false);
      setEditingRoleId(null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role?")) return;
    try {
      await deleteRole(roleId);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const systemRoles = useMemo(
    () => roles.filter((r) => r.isSystemRole),
    [roles],
  );

  const customRoles = useMemo(
    () => roles.filter((r) => !r.isSystemRole),
    [roles],
  );

  const handleViewUsers = (roleId: string) => {
    setSelectedRoleForUsers(roleId);
    setShowUsersModal(true);
    setEditingUserId(null);
    setSelectedNewRole("");
  };

  const handleEditUserRole = (userId: string, currentRoleId: string) => {
    setEditingUserId(userId);
    setSelectedNewRole(currentRoleId);
  };

  const handleUpdateUserRole = async (userId: string) => {
    if (!selectedNewRole) {
      setFormError("Please select a role");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUser(userId, { roleEntityId: selectedNewRole });
      setEditingUserId(null);
      setFormError("");
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUsersForRole = (roleId: string) => {
    return users.filter((u) => u.roleEntityId === roleId);
  };

  if (loading && roles.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">Loading roles...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Roles Management</h2>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Role
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* System Roles */}
      {systemRoles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            System Roles
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {systemRoles.map((role) => (
              <div key={role.id} className="border-b last:border-b-0 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900">
                        {role.name}
                      </h4>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {getUsersForRole(role.id).length}{" "}
                        {getUsersForRole(role.id).length === 1
                          ? "user"
                          : "users"}
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-sm text-gray-600">
                        {role.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewUsers(role.id)}
                      className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded transition flex items-center gap-1"
                      title="View users with this role"
                    >
                      <UsersIcon className="w-3 h-3" />
                      Users
                    </button>
                    <button
                      onClick={() => handleEditClick(role.id)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      disabled={
                        role.isSystemRole || role.name === "ADMINISTRATOR"
                      }
                      className="p-1 text-red-600 hover:bg-red-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded transition"
                      title={
                        role.name === "ADMINISTRATOR"
                          ? "Admin role cannot be deleted"
                          : role.isSystemRole
                            ? "System roles cannot be deleted"
                            : "Delete"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {role.rolePermissions.length > 0 ? (
                    role.rolePermissions.map((rp) => (
                      <span
                        key={rp.id}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {rp.permission.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">
                      No permissions assigned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Roles */}
      {customRoles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Custom Roles
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {customRoles.map((role) => (
              <div key={role.id} className="border-b last:border-b-0 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900">
                        {role.name}
                      </h4>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {getUsersForRole(role.id).length}{" "}
                        {getUsersForRole(role.id).length === 1
                          ? "user"
                          : "users"}
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-sm text-gray-600">
                        {role.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewUsers(role.id)}
                      className="px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded transition flex items-center gap-1"
                      title="View users with this role"
                    >
                      <UsersIcon className="w-3 h-3" />
                      Users
                    </button>
                    <button
                      onClick={() => handleEditClick(role.id)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {role.rolePermissions.length > 0 ? (
                    role.rolePermissions.map((rp) => (
                      <span
                        key={rp.id}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {rp.permission.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">
                      No permissions assigned
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingRoleId ? "Edit Role" : "Create New Role"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingRoleId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Senior Doctor"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Assign Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {permissions.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.name)}
                        onChange={() => handlePermissionToggle(perm.name)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-gray-700">{perm.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingRoleId(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingRoleId
                      ? "Update Role"
                      : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Modal */}
      {showUsersModal && selectedRoleForUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Users with{" "}
                  {roles.find((r) => r.id === selectedRoleForUsers)?.name} Role
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  View and update user role assignments
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUsersModal(false);
                  setSelectedRoleForUsers(null);
                  setEditingUserId(null);
                  setFormError("");
                }}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
                  {formError}
                </div>
              )}

              {getUsersForRole(selectedRoleForUsers).length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No users assigned to this role
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                          New Role
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getUsersForRole(selectedRoleForUsers).map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            {editingUserId === user.id ? (
                              <select
                                value={selectedNewRole}
                                onChange={(e) =>
                                  setSelectedNewRole(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                disabled={isSubmitting}
                              >
                                <option value="">Select a role...</option>
                                {roles.map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm text-gray-500">
                                Click edit to change role
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {editingUserId === user.id ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleUpdateUserRole(user.id)}
                                  disabled={isSubmitting || !selectedNewRole}
                                  className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isSubmitting ? "Saving..." : "Save"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingUserId(null);
                                    setSelectedNewRole("");
                                    setFormError("");
                                  }}
                                  disabled={isSubmitting}
                                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleEditUserRole(
                                    user.id,
                                    user.roleEntityId || "",
                                  )
                                }
                                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition flex items-center gap-1 ml-auto"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit Role
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
