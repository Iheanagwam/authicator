import {prismaClient} from '../src/config/db.js';

export const getAuditLogs = async (developerId, { page = 1, limit = 20, endUserId, action }) => {
  const skip = (page - 1) * limit;

  const where = {
    developerId,
    ...(endUserId && { endUserId }),
    ...(action && { action }),
  };

  const [logs, total] = await Promise.all([
    prismaClient.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        endUserId: true,
        ipAddress: true,
        userAgent: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prismaClient.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAuditLogSummary = async (developerId) => {
  // Last 30 days activity grouped by day — useful for dashboard graph
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [total, recentLogs, actionCounts] = await Promise.all([
    prismaClient.auditLog.count({ where: { developerId } }),

    prismaClient.auditLog.findMany({
      where: { developerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        action: true,
        endUserId: true,
        ipAddress: true,
        createdAt: true,
      },
    }),

    prismaClient.auditLog.groupBy({
      by: ['action'],
      where: {
        developerId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { action: true },
      orderBy: { _count: { action: 'desc' } },
    }),
  ]);

  return {
    total,
    recentActivity: recentLogs,
    actionBreakdown: actionCounts.map((a) => ({
      action: a.action,
      count: a._count.action,
    })),
  };
};