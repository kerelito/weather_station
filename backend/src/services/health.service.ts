import { prisma } from "../lib/prisma";

export const healthService = {
  async getHealth() {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  },
};
