'use client';

import { useState } from 'react';
import { Trash2, Plus, X, Eye, EyeOff } from 'lucide-react';
import { useUsers, useRoles } from '@/hooks/use-rbac';
import { useToast } from '@/hooks/use-toast';

export default function UsersManagement() {
  const { users, loading, error, createUser, updateUser, deleteUser } = useUsers();
  const { roles } = useRoles();
  const { toast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'user' | 'profile'>('user'); // Two-step flow
  const [newUserId, setNewUserId] = useState<string | null>(null); // Store created user ID
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    roleEntityId: '',
  });
  const [profileData, setProfileData] = useState({
    specialization: '',
    licenseNumber: '',
    department: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateClick = () => {
    setFormData({ email: '', password: '', name: '', roleEntityId: '' });
    setProfileData({ specialization: '', licenseNumber: '', department: '' });
    setFormError('');
    setStep('user');
    setNewUserId(null);
    setShowCreateModal(true);
  };

  const handleEditClick = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        name: user.name,
        roleEntityId: user.roleEntityId || '',
      });
      setEditingUserId(userId);
      setFormError('');
      setShowCreateModal(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Step 1: Create User
    if (step === 'user' && !editingUserId) {
      if (!formData.email.trim() || !formData.name.trim()) {
        setFormError('Email and name are required');
        return;
      }

      if (!formData.password) {
        setFormError('Password is required for new users');
        return;
      }

      if (!formData.roleEntityId) {
        setFormError('Role is required');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await createUser(formData.email, formData.password, formData.name, formData.roleEntityId);
        if (result && result.id) {
          setNewUserId(result.id);
          setStep('profile');
          setFormError('');
          setIsSubmitting(false);
          toast({
            title: 'User Created',
            description: `User ${formData.name} created successfully. Now create their profile.`,
            variant: 'default'
          });
        }
      } catch (err: any) {
        setFormError(err.message);
        setIsSubmitting(false);
      }
      return;
    }

    // Step 2: Create Profile (only for new users with role that requires profile)
    if (step === 'profile' && newUserId) {
      const role = roles.find((r) => r.id === formData.roleEntityId)?.name;

      // Validate role-specific required fields
      if (role === 'DOCTOR') {
        if (!profileData.specialization.trim()) {
          setFormError('Specialization is required for Doctor');
          return;
        }
        if (!profileData.licenseNumber.trim()) {
          setFormError('License Number is required for Doctor');
          return;
        }
      } else if (role === 'NURSE') {
        if (!profileData.licenseNumber.trim()) {
          setFormError('License Number is required for Nurse');
          return;
        }
        if (!profileData.department.trim()) {
          setFormError('Department is required for Nurse');
          return;
        }
      } else if (role === 'PHARMACIST') {
        if (!profileData.licenseNumber.trim()) {
          setFormError('License Number is required for Pharmacist');
          return;
        }
      } else if (role === 'LAB_TECH') {
        if (!profileData.department.trim()) {
          setFormError('Department is required for Lab Tech');
          return;
        }
      }

      setIsSubmitting(true);
      try {
        const profilePayload: any = {
          userId: newUserId,
          role: role
        };

        if (role === 'DOCTOR') {
          profilePayload.specialization = profileData.specialization.trim();
          profilePayload.licenseNumber = profileData.licenseNumber.trim();
        } else if (role === 'NURSE') {
          profilePayload.licenseNumber = profileData.licenseNumber.trim();
          profilePayload.department = profileData.department.trim();
        } else if (role === 'PHARMACIST') {
          profilePayload.licenseNumber = profileData.licenseNumber.trim();
        } else if (role === 'LAB_TECH') {
          profilePayload.department = profileData.department.trim();
        }

        const response = await fetch('/api/admin/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profilePayload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create profile');
        }

        toast({
          title: 'Success',
          description: `Profile created successfully for ${formData.name}!`,
          variant: 'default'
        });

        setShowCreateModal(false);
        setEditingUserId(null);
        setStep('user');
        setNewUserId(null);
        setFormData({ email: '', password: '', name: '', roleEntityId: '' });
        setProfileData({ specialization: '', licenseNumber: '', department: '' });
      } catch (err: any) {
        setFormError(err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Editing existing user (no profile creation)
    if (editingUserId) {
      if (!formData.email.trim() || !formData.name.trim()) {
        setFormError('Email and name are required');
        return;
      }

      setIsSubmitting(true);
      try {
        await updateUser(editingUserId, {
          email: formData.email,
          name: formData.name,
          roleEntityId: formData.roleEntityId || undefined,
          password: formData.password || undefined,
        });
        setShowCreateModal(false);
        setEditingUserId(null);
      } catch (err: any) {
        setFormError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDelete = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    
    // Prevent deleting admin user
    if (user?.roleEntityId) {
      const userRole = roles.find((r) => r.id === user.roleEntityId);
      if (userRole?.name === 'ADMINISTRATOR') {
        setFormError('Cannot delete admin user');
        return;
      }
    }
    
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const getRoleNameById = (roleEntityId: string | null) => {
    if (!roleEntityId) return 'No Role';
    return roles.find((r) => r.id === roleEntityId)?.name || 'Unknown';
  };

  if (loading && users.length === 0) {
    return <div className="p-6 text-center text-gray-500">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4" />
          New User
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded">
                        {getRoleNameById(user.roleEntityId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEditClick(user.id)}
                          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={!!(user.roleEntityId && roles.find((r) => r.id === user.roleEntityId)?.name === 'ADMINISTRATOR')}
                          className={`p-1 rounded transition ${
                            user.roleEntityId && roles.find((r) => r.id === user.roleEntityId)?.name === 'ADMINISTRATOR'
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-red-600 hover:bg-red-50'
                          }`}
                          title={
                            user.roleEntityId && roles.find((r) => r.id === user.roleEntityId)?.name === 'ADMINISTRATOR'
                              ? 'Cannot delete admin user'
                              : 'Delete'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingUserId ? 'Edit User' : (
                  step === 'user' ? 'Create New User' : `Create ${roles.find((r) => r.id === formData.roleEntityId)?.name || ''} Profile`
                )}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingUserId(null);
                  setStep('user');
                  setNewUserId(null);
                }}
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

              {/* Step 1: User Creation Form */}
              {(step === 'user' || editingUserId) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                      placeholder="John Doe"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                      placeholder="john@example.com"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      {editingUserId ? 'Password (leave empty to keep current)' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                        placeholder={editingUserId ? '••••••••' : 'Enter password'}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Role</label>
                    <select
                      value={formData.roleEntityId}
                      onChange={(e) => setFormData((prev) => ({ ...prev, roleEntityId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                      disabled={isSubmitting || editingUserId !== null}
                    >
                      <option value="">No Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Step 2: Profile Creation Form */}
              {step === 'profile' && newUserId && (
                <>
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded text-sm">
                    <p className="font-semibold mb-1">Complete {roles.find((r) => r.id === formData.roleEntityId)?.name} Profile</p>
                    <p className="text-xs">Fill in the required information below</p>
                  </div>

                  {/* DOCTOR: Specialization & License */}
                  {formData.roleEntityId && roles.find((r) => r.id === formData.roleEntityId)?.name === 'DOCTOR' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Specialization <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileData.specialization}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, specialization: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                          placeholder="e.g., Cardiology, Orthopedics"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          License Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileData.licenseNumber}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                          placeholder="e.g., MED-12345678"
                          disabled={isSubmitting}
                        />
                      </div>
                    </>
                  )}

                  {/* NURSE: License & Department */}
                  {formData.roleEntityId && roles.find((r) => r.id === formData.roleEntityId)?.name === 'NURSE' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          License Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileData.licenseNumber}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                          placeholder="e.g., RN-87654321"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileData.department}
                          onChange={(e) => setProfileData((prev) => ({ ...prev, department: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                          placeholder="e.g., ICU, Emergency, Surgery"
                          disabled={isSubmitting}
                        />
                      </div>
                    </>
                  )}

                  {/* PHARMACIST: License Only */}
                  {formData.roleEntityId && roles.find((r) => r.id === formData.roleEntityId)?.name === 'PHARMACIST' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        License Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileData.licenseNumber}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                        placeholder="e.g., PHARM-11111111"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  {/* LAB_TECH: Department Only */}
                  {formData.roleEntityId && roles.find((r) => r.id === formData.roleEntityId)?.name === 'LAB_TECH' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={profileData.department}
                        onChange={(e) => setProfileData((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                        placeholder="e.g., Hematology, Biochemistry"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  {/* RECEPTIONIST: No profile fields needed */}
                  {formData.roleEntityId && roles.find((r) => r.id === formData.roleEntityId)?.name === 'RECEPTIONIST' && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm">
                      <p>No additional profile information required for Receptionist role.</p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    if (step === 'profile') {
                      setStep('user');
                      setFormError('');
                    } else {
                      setShowCreateModal(false);
                      setEditingUserId(null);
                      setStep('user');
                      setNewUserId(null);
                    }
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm"
                  disabled={isSubmitting}
                >
                  {step === 'profile' ? 'Back' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (
                    editingUserId ? 'Update User' : (
                      step === 'user' ? 'Create User' : 'Create Profile'
                    )
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
