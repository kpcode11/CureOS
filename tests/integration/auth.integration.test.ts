import { describe, it, expect } from 'vitest';

if (!process.env.DATABASE_URL) {
  describe.skip('integration (neon) - database not configured', () => {
    it('skipped because DATABASE_URL is not set', () => {});
  });
} else {
  import('@/lib/prisma');
  const { prisma } = require('@/lib/prisma');
  const authService = require('@/services/auth.service');
  const auditService = require('@/services/audit.service');

  describe('integration: emergency override + audit (DB)', () => {
    it('creates override, consumes it and writes audit', async () => {
      const actor = await prisma.user.findFirst();
      expect(actor).toBeTruthy();

      const { token, id } = await authService.createEmergencyOverride({ actorId: actor.id, reason: 'integration-test', ttlMinutes: 2 });
      expect(token).toBeTruthy();

      const used = await authService.consumeEmergencyOverride(token);
      expect(used.used).toBe(true);

      const audit = await prisma.auditLog.findFirst({ where: { resource: 'EmergencyOverride', resourceId: id } });
      expect(audit).toBeTruthy();
      expect(audit.action).toContain('emergency.override');
    });
  });
}
