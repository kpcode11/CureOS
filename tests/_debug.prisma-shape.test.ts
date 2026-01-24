import { describe, it } from 'vitest';
import { prisma } from '@/lib/prisma';

describe('prisma shape (debug)', () => {
  it('prints prisma keys', () => {
    // eslint-disable-next-line no-console
    console.log('prisma keys ->', Object.keys(prisma).slice(0,40));
    // eslint-disable-next-line no-console
    console.log('prisma.billing ->', typeof (prisma as any).billing);
  });
});