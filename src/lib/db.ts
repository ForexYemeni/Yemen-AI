// Legacy DB export - redirects to MongoDB
// This file is kept for backward compatibility with generated code templates
// If MongoDB is not connected, operations return safe defaults instead of crashing
import dbConnect, { isMongoConfigured } from '@/lib/mongodb';
import { ProjectModel, AgentLogModel, AgentMessageModel, SettingsModel } from '@/lib/models';

// Create a Prisma-like interface backed by MongoDB with graceful fallback
const dbProxy = {
  project: {
    create: async (args: any) => {
      const conn = await dbConnect();
      if (!conn) return { id: 'demo-' + Date.now(), ...args.data, createdAt: new Date(), updatedAt: new Date() };
      return await ProjectModel.create(args.data);
    },
    findMany: async (args?: any) => {
      const conn = await dbConnect();
      if (!conn) return [];
      const query = ProjectModel.find({});
      if (args?.orderBy) {
        const [field, dir] = Object.entries(args.orderBy)[0] as [string, string];
        query.sort({ [field]: dir === 'desc' ? -1 : 1 });
      }
      return await query.lean();
    },
    findUnique: async (args: any) => {
      const conn = await dbConnect();
      if (!conn) return null;
      return await ProjectModel.findById(args.where.id).lean();
    },
    findByIdAndUpdate: async (id: string, data: any, opts?: any) => {
      const conn = await dbConnect();
      if (!conn) return null;
      return await ProjectModel.findByIdAndUpdate(id, data, { new: true, ...opts });
    },
    update: async (args: any) => {
      const conn = await dbConnect();
      if (!conn) return null;
      return await ProjectModel.findByIdAndUpdate(args.where.id, args.data, { new: true });
    },
    delete: async (args: any) => {
      const conn = await dbConnect();
      if (!conn) return null;
      return await ProjectModel.findByIdAndDelete(args.where.id);
    },
  },
  agentLog: {
    create: async (args: any) => {
      const conn = await dbConnect();
      if (!conn) return { id: 'demo-log-' + Date.now(), ...args.data };
      return await AgentLogModel.create(args.data);
    },
    findMany: async (args?: any) => {
      const conn = await dbConnect();
      if (!conn) return [];
      const query = AgentLogModel.find(args?.where || {});
      if (args?.orderBy) {
        const [field, dir] = Object.entries(args.orderBy)[0] as [string, string];
        query.sort({ [field]: dir === 'desc' ? -1 : 1 });
      }
      if (args?.take) query.limit(args.take);
      return await query.lean();
    },
  },
  agentMessage: {
    create: async (args: any) => {
      const conn = await dbConnect();
      if (!conn) return { id: 'demo-msg-' + Date.now(), ...args.data };
      return await AgentMessageModel.create(args.data);
    },
    findMany: async (args?: any) => {
      const conn = await dbConnect();
      if (!conn) return [];
      const query = AgentMessageModel.find(args?.where || {});
      if (args?.orderBy) {
        const [field, dir] = Object.entries(args.orderBy)[0] as [string, string];
        query.sort({ [field]: dir === 'desc' ? -1 : 1 });
      }
      if (args?.take) query.limit(args.take);
      return await query.lean();
    },
  },
  settings: {
    findFirst: async () => {
      const conn = await dbConnect();
      if (!conn) return null;
      return await SettingsModel.findOne().lean();
    },
    create: async (args?: any) => {
      const conn = await dbConnect();
      if (!conn) return { id: 'demo-settings', ...args?.data };
      return await SettingsModel.create(args?.data || {});
    },
    update: async (args: any) => {
      const conn = await dbConnect();
      if (!conn) return null;
      const settings = await SettingsModel.findOne();
      if (!settings) return await SettingsModel.create(args.data);
      return await SettingsModel.findByIdAndUpdate(settings._id, args.data, { new: true });
    },
  },
};

export const db = dbProxy;
export { isMongoConfigured };
