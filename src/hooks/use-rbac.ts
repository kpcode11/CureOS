import { useCallback, useState, useEffect } from 'react';

export interface Permission {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export interface RoleEntity {
  id: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
  rolePermissions: RolePermission[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  roleEntityId: string | null;
  createdAt: string;
}

// Permissions Hook
export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/permissions');
      if (!res.ok) throw new Error('Failed to fetch permissions');
      const data = await res.json();
      setPermissions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const createPermissions = useCallback(async (names: string[]) => {
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names }),
      });
      if (!res.ok) throw new Error('Failed to create permissions');
      const data = await res.json();
      setPermissions((prev) => [...prev, ...data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return { permissions, loading, error, fetchPermissions, createPermissions };
};

// Roles Hook
export const useRoles = () => {
  const [roles, setRoles] = useState<RoleEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = useCallback(
    async (name: string, permissions: string[] = []) => {
      try {
        const res = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, permissions }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create role');
        }
        const role = await res.json();
        setRoles((prev) => [...prev, role]);
        return role;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const updateRole = useCallback(
    async (roleId: string, name?: string, permissions?: string[]) => {
      try {
        const res = await fetch(`/api/admin/roles/${roleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, permissions }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update role');
        }
        const updated = await res.json();
        setRoles((prev) => prev.map((r) => (r.id === roleId ? updated : r)));
        return updated;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const deleteRole = useCallback(async (roleId: string) => {
    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete role');
      }
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
};

// Users Hook
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = useCallback(
    async (email: string, password: string, name: string, roleEntityId?: string) => {
      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, roleEntityId }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create user');
        }
        const user = await res.json();
        setUsers((prev) => [...prev, user]);
        return user;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const updateUser = useCallback(
    async (
      userId: string,
      updates: { name?: string; email?: string; password?: string; roleEntityId?: string }
    ) => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update user');
        }
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        return updated;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    []
  );

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete user');
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};
