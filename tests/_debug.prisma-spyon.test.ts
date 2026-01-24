import { describe, it, vi, expect } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('prisma spyOn behavior (debug)', () => {
  it('inspects descriptor for prisma.billing.create', () => {
    const desc = Object.getOwnPropertyDescriptor((prisma as any).billing, 'create');
    // eslint-disable-next-line no-console
    console.log('descriptor for prisma.billing.create ->', desc);
    // also log typeof and value
    // eslint-disable-next-line no-console
    console.log('typeof create:', typeof (prisma as any).billing.create);
  });
});