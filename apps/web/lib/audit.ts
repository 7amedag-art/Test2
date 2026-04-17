import { prisma, type AuditAction } from "@elp/db";

export async function writeAudit(opts: {
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId?: string | null;
  changes?: Record<string, unknown> | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType: opts.entityType,
        entityId: opts.entityId,
        action: opts.action,
        userId: opts.userId ?? null,
        changes: (opts.changes ?? null) as any,
      },
    });
  } catch (err) {
    // Never let audit failures break the request path.
    console.error("auditLog write failed:", err);
  }
}
