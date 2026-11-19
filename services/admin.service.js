import {prismaClient} from '../src/config/db.js';

// ─── PLATFORM STATS ───────────────────────────────────────────────
export const getPlatformStats = async () => {
  const [
    totalDevelopers,
    totalEndUsers,
    totalWebhooks,
    totalSessions,
    totalAuditLogs,
    newDevelopersToday,
    newUsersToday,
  ] = await Promise.all([
    prismaClient.developer.count(),
    prismaClient.endUser.count(),
    prismaClient.webhook.count({ where: { isActive: true } }),
    prismaClient.session.count({ where: { expiresAt: { gt: new Date() } } }),
    prismaClient.auditLog.count(),
    prismaClient.developer.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
    }),
    prismaClient.endUser.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
    }),
  ]);

  return {
    totalDevelopers,
    totalEndUsers,
    totalWebhooks,
    activeSessions: totalSessions,
    totalAuditLogs,
    newDevelopersToday,
    newUsersToday,
  };
};

// ─── ALL DEVELOPERS ───────────────────────────────────────────────
export const getAllDevelopers = async ({ page = 1, limit = 20, search }) => {
  const skip = (page - 1) * limit;

  const where = search
    ? { OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { appName: { contains: search, mode: 'insensitive' } },
      ]}
    : {};

  const [developers, total] = await Promise.all([
    prismaClient.developer.findMany({
      where,
      select: {
        id: true,
        email: true,
        appName: true,
        isVerified: true,
        isSuperAdmin: true,
        createdAt: true,
        _count: {
          select: {
            endUsers: true,
            webhooks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prismaClient.developer.count({ where }),
  ]);

  return {
    developers,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── SINGLE DEVELOPER ─────────────────────────────────────────────
export const getDeveloperById = async (developerId) => {
  const developer = await prismaClient.developer.findUnique({
    where: { id: developerId },
    select: {
      id: true,
      email: true,
      appName: true,
      apiKey: true,
      isVerified: true,
      isSuperAdmin: true,
      fieldConfig: true,
      emailConfig: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { endUsers: true, webhooks: true },
      },
    },
  });

  if (!developer) throw new Error('Developer not found');
  return developer;
};

// ─── DELETE DEVELOPER ─────────────────────────────────────────────
export const deleteDeveloper = async (developerId) => {
  const developer = await prismaClient.developer.findUnique({
    where: { id: developerId },
  });
  if (!developer) throw new Error('Developer not found');
  if (developer.isSuperAdmin) throw new Error('Cannot delete a super admin account');

  // Cascade deletes handle endUsers, webhooks, auditLogs automatically
  await prismaClient.developer.delete({ where: { id: developerId } });
  return true;
};

// ─── ALL END USERS PLATFORM WIDE ──────────────────────────────────
export const getAllEndUsers = async ({ page = 1, limit = 20, search, developerId }) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(developerId && { developerId }),
    ...(search && {
      email: { contains: search, mode: 'insensitive' },
    }),
  };

  const [users, total] = await Promise.all([
    prismaClient.endUser.findMany({
      where,
      select: {
        id: true,
        email: true,
        isVerified: true,
        metadata: true,
        developerId: true,
        createdAt: true,
        developer: {
          select: { appName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prismaClient.endUser.count({ where }),
  ]);

  return {
    users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── DELETE END USER (admin) ──────────────────────────────────────
export const deleteEndUserAdmin = async (userId) => {
  const user = await prismaClient.endUser.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  await prismaClient.endUser.delete({ where: { id: userId } });
  return true;
};

// ─── PLATFORM AUDIT LOGS ─────────────────────────────────────────
export const getPlatformAuditLogs = async ({ page = 1, limit = 20, developerId, action }) => {
  const skip = (page - 1) * limit;

  const where = {
    ...(developerId && { developerId }),
    ...(action && { action }),
  };

  const [logs, total] = await Promise.all([
    prismaClient.auditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        endUserId: true,
        ipAddress: true,
        createdAt: true,
        developer: { select: { email: true, appName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prismaClient.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};