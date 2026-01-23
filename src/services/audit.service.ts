import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type AuditMeta = { [k: string]: any } | null; 

export const createAudit = async (args: {
  actorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  before?: any;
  after?: any;
  meta?: AuditMeta;
  ip?: string | null;
}) => {
  const { actorId = null, action, resource, resourceId = null, before = null, after = null, meta = null, ip = null } = args;

  const data: {
    actorId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    before?: any;
    after?: any;
    meta?: Prisma.InputJsonValue;
    ip?: string | null;
  } = { actorId, action, resource, resourceId, before, after, ip };

  if (meta !== null && meta !== undefined) {
    // Cast to a Prisma-compatible JSON value only when meta is present
    (data as any).meta = meta as Prisma.InputJsonValue;
  }

  return prisma.auditLog.create({ data });
};
