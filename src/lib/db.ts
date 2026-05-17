// Legacy DB export - redirects to MongoDB
// This file is kept for backward compatibility with generated code templates
import dbConnect from '@/lib/mongodb';
import { ProjectModel, AgentLogModel, AgentMessageModel, SettingsModel } from '@/lib/models';

// Create a Prisma-like interface backed by MongoDB
const dbProxy = {
  project: {
    create: async (args: any) => {
      await dbConnect();
      return await ProjectModel.create(args.data);
    },
    findMany: async (args?: any) => {
      await dbConnect();
      const query = ProjectModel.find({});
      if (args?.orderBy) {
        const [field, dir] = Object.entries(args.orderBy)[0] as [string, string];
        query.sort({ [field]: dir === 'desc' ? -1 : 1 });
      }
      if (args?.include?._count) {
        // Will handle counts separately if needed
      }
      return await query.lean();
    },
    findUnique: async (args: any) => {
      await dbConnect();
      return await ProjectModel.findById(args.where.id).lean();
    },
    findByIdAndUpdate: async (id: string, data: any, opts?: any) => {
      await dbConnect();
      return await ProjectModel.findByIdAndUpdate(id, data, { new: true, ...opts });
    },
    update: async (args: any) => {
      await dbConnect();
      return await ProjectModel.findByIdAndUpdate(args.where.id, args.data, { new: true });
    },
    delete: async (args: any) => {
      await dbConnect();
      return await ProjectModel.findByIdAndDelete(args.where.id);
    },
  },
  agentLog: {
    create: async (args: any) => {
      await dbConnect();
      return await AgentLogModel.create(args.data);
    },
    findMany: async (args?: any) => {
      await dbConnect();
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
      await dbConnect();
      return await AgentMessageModel.create(args.data);
    },
    findMany: async (args?: any) => {
      await dbConnect();
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
      await dbConnect();
      return await SettingsModel.findOne().lean();
    },
    create: async (args?: any) => {
      await dbConnect();
      return await SettingsModel.create(args?.data || {});
    },
    update: async (args: any) => {
      await dbConnect();
      const settings = await SettingsModel.findOne();
      if (!settings) return await SettingsModel.create(args.data);
      return await SettingsModel.findByIdAndUpdate(settings._id, args.data, { new: true });
    },
  },
};

export const db = dbProxy;
