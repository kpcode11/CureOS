import { describe, it, expect, vi } from 'vitest';
import * as roleService from '@/services/role.service';
import { prisma } from '@/lib/prisma';

describe('role.service', () => {
  it('updateRole replaces permissions and name', async () => {
    const role = { id: 'r1', name: 'OLD' } as any;
    vi.spyOn(prisma.roleEntity, 'findUnique').mockResolvedValueOnce(role);
    vi.spyOn(prisma.permission, 'findMany').mockResolvedValueOnce([{ id: 'p1', name: 'patients.read' }] as any);
    vi.spyOn(prisma.rolePermission, 'deleteMany').mockResolvedValueOnce({ count: 0 } as any);
    vi.spyOn(prisma.rolePermission, 'upsert').mockResolvedValueOnce({} as any);
    vi.spyOn(prisma.roleEntity, 'update').mockResolvedValueOnce({ id: 'r1', name: 'NEW' } as any);

    const updated = await roleService.updateRole('r1', { name: 'NEW', permissionNames: ['patients.read'] });
    expect(updated).toBeDefined();
  });

  it('deleteRole prevents deleting ADMIN or roles with users', async () => {
    vi.spyOn(prisma.roleEntity, 'findUnique').mockResolvedValueOnce({ id: 'radmin', name: 'ADMIN', _count: { users: 0 } } as any);
    await expect(roleService.deleteRole('radmin')).rejects.toThrow(/Cannot delete ADMIN/);
  });
});
