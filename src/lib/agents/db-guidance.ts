// ============================================================
// DB Guidance Agent — مستشار البيانات (إرشادي فقط)
// يقترح MongoDB ويصمم Schema ويساعد في الربط والاستعلامات
// ============================================================

import { CodeFile } from '../runtime/types';
import { SharedContext } from '../runtime/shared-context';
import { addLog, generateLogId } from '../runtime/memory';

export async function runDbGuidanceAgent(ctx: SharedContext): Promise<void> {
  const projectId = ctx.projectId;

  addLog(projectId, {
    id: generateLogId(),
    projectId,
    agent: 'db_guidance',
    action: 'start_guidance',
    content: 'بدأ تصميم قاعدة البيانات وإنشاء النماذج...',
    status: 'running',
    timestamp: new Date().toISOString(),
  });

  try {
    const pmResult = ctx.getAgentResult('project_manager') as Record<string, unknown> | undefined;
    const features = (pmResult?.analysis as Record<string, unknown>)?.features as string[] ?? [];

    // Generate MongoDB connection
    ctx.addCodeFile({
      path: 'src/lib/mongodb.ts',
      content: generateMongoConnection(),
      language: 'typescript',
    });

    // Generate models based on features
    const models = determineModels(features, ctx.idea);
    for (const model of models) {
      ctx.addCodeFile({
        path: `src/models/${model.name}.ts`,
        content: generateModel(model),
        language: 'typescript',
      });
    }

    // Generate DB utility
    ctx.addCodeFile({
      path: 'src/lib/db-utils.ts',
      content: generateDbUtils(models),
      language: 'typescript',
    });

    // Generate .env.example
    ctx.addCodeFile({
      path: '.env.example',
      content: generateEnvExample(),
      language: 'text',
    });

    ctx.setAgentResult('db_guidance', {
      models: models.map(m => m.name),
      dbType: 'MongoDB',
      status: 'completed',
    });

    ctx.addMessage('db_guidance', 'backend', `تم تصميم ${models.length} نموذج — حدّث الـ APIs لربط MongoDB`, 'result');

    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'db_guidance',
      action: 'guidance_complete',
      content: `تم تصميم ${models.length} نموذج MongoDB`,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

    ctx.setProgress(65);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'خطأ في تصميم قاعدة البيانات';
    ctx.addMessage('db_guidance', 'all', `فشل تصميم DB: ${errMsg}`, 'error');
    addLog(projectId, {
      id: generateLogId(),
      projectId,
      agent: 'db_guidance',
      action: 'guidance_error',
      content: errMsg,
      status: 'error',
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

interface DbModel {
  name: string;
  fields: { name: string; type: string; required: boolean; unique?: boolean }[];
}

function determineModels(features: string[], idea: string): DbModel[] {
  const models: DbModel[] = [];
  const lowerIdea = idea.toLowerCase();

  // Always add User model if auth is needed
  if (features.some(f => /مصادقة|auth/i.test(f)) || /مستخدم|user|حساب|تسجيل/i.test(lowerIdea)) {
    models.push({
      name: 'User',
      fields: [
        { name: 'name', type: 'String', required: true },
        { name: 'email', type: 'String', required: true, unique: true },
        { name: 'password', type: 'String', required: true },
        { name: 'role', type: 'String', required: false },
        { name: 'avatar', type: 'String', required: false },
        { name: 'isActive', type: 'Boolean', required: false },
      ],
    });
  }

  // Product model for e-commerce
  if (/متجر|shop|product|منتج|بيع/i.test(lowerIdea)) {
    models.push({
      name: 'Product',
      fields: [
        { name: 'name', type: 'String', required: true },
        { name: 'description', type: 'String', required: true },
        { name: 'price', type: 'Number', required: true },
        { name: 'category', type: 'String', required: false },
        { name: 'image', type: 'String', required: false },
        { name: 'inStock', type: 'Boolean', required: false },
      ],
    });
  }

  // Post model for blog/social
  if (/مدون|blog|منشور|post|مقال|article/i.test(lowerIdea)) {
    models.push({
      name: 'Post',
      fields: [
        { name: 'title', type: 'String', required: true },
        { name: 'content', type: 'String', required: true },
        { name: 'author', type: 'ObjectId', required: true },
        { name: 'tags', type: '[String]', required: false },
        { name: 'published', type: 'Boolean', required: false },
      ],
    });
  }

  // Order model
  if (/طلب|order|سلة|cart|شراء/i.test(lowerIdea)) {
    models.push({
      name: 'Order',
      fields: [
        { name: 'user', type: 'ObjectId', required: true },
        { name: 'items', type: '[ObjectId]', required: true },
        { name: 'total', type: 'Number', required: true },
        { name: 'status', type: 'String', required: true },
        { name: 'address', type: 'String', required: false },
      ],
    });
  }

  // Default generic model if none matched
  if (models.length === 0) {
    models.push({
      name: 'Item',
      fields: [
        { name: 'name', type: 'String', required: true },
        { name: 'description', type: 'String', required: false },
        { name: 'data', type: 'Mixed', required: false },
      ],
    });
  }

  return models;
}

function generateMongoConnection(): string {
  return `// MongoDB Connection — Advisory Code Generated by DB Guidance Agent
// Install mongoose: npm install mongoose
// Add MONGODB_URI to your .env.local file

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myapp';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
`;
}

function generateModel(model: DbModel): string {
  const fieldsStr = model.fields
    .map(f => {
      let field: string;
      if (f.type.startsWith('[')) {
        field = `[{ type: ${f.type.replace('[', '').replace(']', '')}, default: [] }]`;
      } else if (f.type === 'Mixed') {
        field = '{ type: mongoose.Schema.Types.Mixed }';
      } else if (f.type === 'ObjectId') {
        field = `{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }`;
      } else {
        field = `{ type: ${f.type}${f.required ? ', required: true' : ''}${f.unique ? ', unique: true' : ''} }`;
      }
      return `    ${f.name}: ${field}`;
    })
    .join(',\n');

  return `// ${model.name} Model — Generated by DB Guidance Agent
import mongoose from 'mongoose';

const ${model.name.toLowerCase()}Schema = new mongoose.Schema({
${fieldsStr}
}, {
  timestamps: true,
});

export default mongoose.models.${model.name} || mongoose.model('${model.name}', ${model.name.toLowerCase()}Schema);
`;
}

function generateDbUtils(models: DbModel[]): string {
  return `// Database Utility Functions — Generated by DB Guidance Agent
import connectDB from './mongodb';

${models.map(m => `import ${m.name} from '../models/${m.name}';`).join('\n')}

export async function getAll${models.length > 0 ? models[0].name : 'Item'}s(page = 1, limit = 10) {
  await connectDB();
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    ${models.length > 0 ? models[0].name : 'Item'}.find().skip(skip).limit(limit).lean(),
    ${models.length > 0 ? models[0].name : 'Item'}.countDocuments(),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function create${models.length > 0 ? models[0].name : 'Item'}(data: Record<string, unknown>) {
  await connectDB();
  const item = new ${models.length > 0 ? models[0].name : 'Item'}(data);
  return item.save();
}

export async function get${models.length > 0 ? models[0].name : 'Item'}ById(id: string) {
  await connectDB();
  return ${models.length > 0 ? models[0].name : 'Item'}.findById(id).lean();
}
`;
}

function generateEnvExample(): string {
  return `# Environment Variables — Generated by DB Guidance Agent
# Copy this file to .env.local and fill in your values

# MongoDB Connection (advisory — install and configure MongoDB separately)
MONGODB_URI=mongodb://localhost:27017/myapp

# NextAuth (if using authentication)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Firebase (if using notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
`;
}
