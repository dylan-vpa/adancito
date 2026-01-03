/**
 * MVP Kit Service
 * Handles parsing AI code output, writing files, and managing Docker containers
 */

import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Base directory for generated MVPs (relative to adan-app root)
// In dev: __dirname = src/services/ (via ts-node/nodemon)
// In prod: __dirname = dist/services/
// We detect which it is and adjust accordingly
const IS_DEV = __dirname.includes('/src/');
const SERVER_ROOT = IS_DEV
    ? path.resolve(__dirname, '..', '..')  // src/services -> server/
    : path.resolve(__dirname, '..', '..');  // dist/services -> server/

const PROJECT_ROOT = path.resolve(SERVER_ROOT, '..');  // server/ -> adan-app/
const GENERATED_MVPS_DIR = path.join(PROJECT_ROOT, 'generated-mvps');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates', 'mvp-kit');

// Debug: Log paths on startup
console.log('═══════════════════════════════════════════════════');
console.log('[MVP Service] Initializing...');
console.log('[MVP Service] IS_DEV:', IS_DEV);
console.log('[MVP Service] __dirname:', __dirname);
console.log('[MVP Service] PROJECT_ROOT:', PROJECT_ROOT);
console.log('[MVP Service] TEMPLATES_DIR:', TEMPLATES_DIR);
console.log('[MVP Service] GENERATED_MVPS_DIR:', GENERATED_MVPS_DIR);
console.log('[MVP Service] Templates exist:', fs.existsSync(TEMPLATES_DIR));
console.log('═══════════════════════════════════════════════════');

// Port management
let nextAvailablePort = 4001;
const activeContainers: Map<string, { containerId: string; port: number }> = new Map();

interface ParsedFile {
    path: string;
    content: string;
    language: string;
}

interface MVPProject {
    id: string;
    userId: string;
    name: string;
    status: 'pending' | 'building' | 'running' | 'stopped' | 'error';
    port?: number;
    containerId?: string;
    createdAt: Date;
    logs: string[];
    chatId?: string;  // Track which chat spawned this project
}

// In-memory storage (could be moved to DB later)
const projects: Map<string, MVPProject> = new Map();

// Chat-to-Project mapping for caching
const chatProjectMap: Map<string, string> = new Map();

/**
 * Parse code blocks from AI output
 */
export function parseCodeBlocks(content: string): ParsedFile[] {
    const files: ParsedFile[] = [];
    console.log('[MVP] parseCodeBlocks: Starting parse...');

    // Pattern 1: Code blocks with file path in comment
    const codeBlockRegex = /```(\w+)?\s*\n(\/\/\s*([^\n]+)\n)?([\s\S]*?)```/g;

    let match;
    let matchCount = 0;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        matchCount++;
        const language = match[1] || 'text';
        const pathComment = match[3]?.trim();
        const codeContent = match[4]?.trim();

        if (pathComment && codeContent) {
            let filePath = pathComment.replace(/^[\.\/]+/, '');
            console.log(`[MVP]   Found file: ${filePath} (${language})`);
            files.push({ path: filePath, content: codeContent, language });
        }
    }
    console.log(`[MVP] parseCodeBlocks: Found ${matchCount} code blocks, ${files.length} with paths`);

    // Pattern 2: Explicit file headers
    const explicitFileRegex = /####\s*(?:\[(?:NEW|MODIFY)\])?\s*\[?([^\]\n]+)\]?(?:\([^)]+\))?\s*\n+```\w*\n([\s\S]*?)```/g;
    while ((match = explicitFileRegex.exec(content)) !== null) {
        const fileName = match[1].trim();
        const codeContent = match[2].trim();
        if (fileName && codeContent && !files.find(f => f.path.includes(fileName))) {
            let filePath = fileName;
            if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
                if (!filePath.startsWith('client/') && !filePath.startsWith('server/')) {
                    filePath = `client/src/${filePath}`;
                }
            }
            console.log(`[MVP]   Found explicit file: ${filePath}`);
            files.push({ path: filePath, content: codeContent, language: fileName.split('.').pop() || 'text' });
        }
    }

    // Pattern 3: Prisma schemas
    const prismaRegex = /```prisma\s*\n([\s\S]*?)```/g;
    while ((match = prismaRegex.exec(content)) !== null) {
        if (!files.find(f => f.path.includes('schema.prisma'))) {
            console.log(`[MVP]   Found prisma schema`);
            let schemaContent = match[1].trim();

            // Ensure schema has required generator and datasource blocks
            const PRISMA_HEADER = `// Auto-generated Prisma schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

`;
            // Only add header if missing generator/datasource
            if (!schemaContent.includes('generator client') || !schemaContent.includes('datasource db')) {
                schemaContent = PRISMA_HEADER + schemaContent;
            }

            files.push({ path: 'server/prisma/schema.prisma', content: schemaContent, language: 'prisma' });
        }
    }

    // Pattern 4: Adán's documentation format - path comment inside code block (with possible blank lines)
    // Matches: ```typescript\n// server/src/routes/products.ts\n\nimport...```
    const adanFormatRegex = /```(\w+)?\s*\n\/\/\s*([^\n]+\.(?:ts|tsx|js|jsx|prisma))\s*\n\n?([\s\S]*?)```/g;
    while ((match = adanFormatRegex.exec(content)) !== null) {
        const language = match[1] || 'typescript';
        const filePath = match[2].trim();
        const codeContent = match[3].trim();

        // Skip if already found
        if (files.find(f => f.path === filePath)) continue;

        if (filePath && codeContent) {
            console.log(`[MVP]   Found Adán format file: ${filePath}`);
            files.push({ path: filePath, content: codeContent, language });
        }
    }

    // Pattern 5: External path header before code block
    // Matches: // server/src/routes/products.ts\n```typescript\ncode...```
    const externalPathRegex = /\/\/\s*([^\n]+\.(?:ts|tsx|js|jsx))\s*\n\n?```(\w+)?\s*\n([\s\S]*?)```/g;
    while ((match = externalPathRegex.exec(content)) !== null) {
        const filePath = match[1].trim();
        const language = match[2] || 'typescript';
        const codeContent = match[3].trim();

        // Skip if already found
        if (files.find(f => f.path === filePath)) continue;

        if (filePath && codeContent) {
            console.log(`[MVP]   Found external path file: ${filePath}`);
            files.push({ path: filePath, content: codeContent, language });
        }
    }
    // Pattern 6: Smart inference - detect component/route names from code content
    // This catches code blocks where Adán doesn't use the // path format
    const allCodeBlocksRegex = /```(?:typescript|tsx|ts|javascript|jsx|js)?\s*\n([\s\S]*?)```/g;
    while ((match = allCodeBlocksRegex.exec(content)) !== null) {
        const codeContent = match[1].trim();

        // Skip if too short or already processed
        if (codeContent.length < 50) continue;

        // Try to infer the file path from the content
        let inferredPath: string | null = null;
        let inferredType = 'unknown';

        // Check for React components (export default function ComponentName)
        const componentMatch = codeContent.match(/export\s+default\s+function\s+(\w+)/);
        if (componentMatch && !files.find(f => f.path.includes(componentMatch[1]))) {
            const componentName = componentMatch[1];
            // Determine if it's a page or component
            if (['Dashboard', 'Products', 'Movements', 'Reports', 'Settings', 'Profile', 'Home', 'Inventory'].includes(componentName)) {
                inferredPath = `client/src/pages/${componentName}.tsx`;
                inferredType = 'page';
            }
        }

        // Check for Express routes (const router = Router())
        const routeMatch = codeContent.match(/router\.(?:get|post|put|delete|patch)\s*\(\s*['"]\/([^'"]*)['"]/);
        const routerDef = codeContent.match(/const\s+router\s*=\s*Router\s*\(\s*\)/);
        if (routerDef && routeMatch && !componentMatch) {
            // Try to identify route name from the first endpoint
            const firstEndpoint = routeMatch[1] || '';
            let routeName = '';

            if (codeContent.includes('dashboard') || codeContent.includes('Dashboard')) {
                routeName = 'dashboard';
            } else if (codeContent.includes('product') || codeContent.includes('Product')) {
                routeName = 'products';
            } else if (codeContent.includes('movement') || codeContent.includes('Movement')) {
                routeName = 'movements';
            } else if (codeContent.includes('report') || codeContent.includes('Report')) {
                routeName = 'reports';
            }

            if (routeName && !files.find(f => f.path.includes(`routes/${routeName}`))) {
                inferredPath = `server/src/routes/${routeName}.ts`;
                inferredType = 'route';
            }
        }

        if (inferredPath && !files.find(f => f.path === inferredPath)) {
            console.log(`[MVP]   Inferred ${inferredType}: ${inferredPath}`);
            files.push({ path: inferredPath, content: codeContent, language: 'typescript' });
        }
    }

    console.log(`[MVP] parseCodeBlocks: Total files extracted: ${files.length}`);
    return files;
}

/**
 * Check if content contains MVP-like code structure
 */
export function containsMVPCode(content: string): boolean {
    const indicators = [
        /```(typescript|tsx|javascript|jsx)/i,
        /import.*from\s+['"]react['"]/,
        /export\s+(default\s+)?function\s+\w+/,
    ];
    return indicators.some(regex => regex.test(content));
}

/**
 * Check if we already have a project for this chat
 */
export function getExistingProject(chatId: string): MVPProject | undefined {
    const projectId = chatProjectMap.get(chatId);
    if (projectId) {
        const project = projects.get(projectId);
        if (project) {
            console.log(`[MVP] Found existing project for chat ${chatId}: ${projectId}`);
            return project;
        }
    }
    return undefined;
}

/**
 * Create project directory and copy template
 */
export async function createProject(userId: string, projectName: string, files: ParsedFile[], chatId?: string): Promise<MVPProject> {
    console.log('[MVP] createProject: Starting...');
    console.log(`[MVP]   userId: ${userId}`);
    console.log(`[MVP]   projectName: ${projectName}`);
    console.log(`[MVP]   files count: ${files.length}`);
    console.log(`[MVP]   chatId: ${chatId}`);

    const projectId = `mvp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const projectDir = path.join(GENERATED_MVPS_DIR, userId, projectId);

    console.log(`[MVP]   projectDir: ${projectDir}`);

    // Create project directory
    console.log('[MVP]   Creating project directory...');
    await fs.promises.mkdir(projectDir, { recursive: true });
    console.log('[MVP]   Directory created');

    // Check if templates exist
    if (!fs.existsSync(TEMPLATES_DIR)) {
        console.error(`[MVP] ERROR: Templates directory not found: ${TEMPLATES_DIR}`);
        throw new Error(`Templates directory not found: ${TEMPLATES_DIR}`);
    }

    // Copy template files
    console.log('[MVP]   Copying template files...');
    await copyDir(TEMPLATES_DIR, projectDir);
    console.log('[MVP]   Template copied');

    // Write generated files
    console.log('[MVP]   Writing generated files...');

    // Prisma header to prepend if needed - includes base User model WITHOUT relations
    // Relations are dynamically added by Adán's generated models
    const PRISMA_HEADER = `// Auto-generated Prisma schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// Base User model - other models can reference this
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

`;

    for (const file of files) {
        const filePath = path.join(projectDir, file.path);
        const fileDir = path.dirname(filePath);
        await fs.promises.mkdir(fileDir, { recursive: true });

        let content = file.content;

        // Special handling for Prisma schema - ALWAYS use our hardcoded datasource
        if (file.path.includes('schema.prisma')) {
            console.log('[MVP]     Processing Prisma schema...');

            // Remove any existing generator and datasource blocks from Adán's schema
            // to avoid conflicts with env("DATABASE_URL")
            let cleanedContent = content
                .replace(/generator\s+client\s*\{[^}]*\}/gs, '')
                .replace(/datasource\s+\w+\s*\{[^}]*\}/gs, '')
                .trim();

            // Also remove any duplicate User model if we're adding one
            if (cleanedContent.includes('model User')) {
                // Keep Adán's User model, don't add ours
                const headerWithoutUser = `// Auto-generated Prisma schema
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

`;
                content = headerWithoutUser + cleanedContent;
            } else {
                content = PRISMA_HEADER + cleanedContent;
            }
            console.log('[MVP]     Prisma schema cleaned and header prepended');
        }

        await fs.promises.writeFile(filePath, content, 'utf-8');
        console.log(`[MVP]     Wrote: ${file.path}`);
    }
    console.log('[MVP]   All files written');

    // DYNAMIC APP.TSX: Detect generated pages and create routes
    const generatedPages = files
        .filter(f => f.path.includes('client/src/pages/') && f.path.endsWith('.tsx'))
        .map(f => {
            const filename = path.basename(f.path, '.tsx');
            return { name: filename, path: f.path };
        });

    if (generatedPages.length > 0) {
        console.log(`[MVP]   Generating TAB-BASED App.tsx with ${generatedPages.length} pages...`);

        // Build imports - use default import since Adán's components use export default
        const imports = generatedPages.map(p => `import ${p.name} from './pages/${p.name}';`).join('\n');

        // Build tab buttons
        const tabButtons = generatedPages.map((p, i) =>
            `          <button
            key="${p.name}"
            onClick={() => setActiveTab('${p.name}')}
            className={\`px-4 py-2 rounded-lg font-medium transition \${
              activeTab === '${p.name}' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }\`}
          >
            ${p.name}
          </button>`
        ).join('\n');

        // Build tab content
        const tabContent = generatedPages.map(p =>
            `        {activeTab === '${p.name}' && <${p.name} />}`
        ).join('\n');

        const dynamicAppTsx = `import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
${imports}

function MainApp() {
  const { user, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('${generatedPages[0]?.name || 'Dashboard'}');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">MVP Preview</h1>
          <p className="text-gray-500 text-center mb-6">Cargando demo automático...</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Reiniciar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with tabs */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">MVP Preview</h1>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto">
${tabButtons}
            </div>

            <button
              onClick={logout}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Active Tab Content */}
      <main className="max-w-7xl mx-auto">
${tabContent}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </BrowserRouter>
  );
}
`;

        const appTsxPath = path.join(projectDir, 'client/src/App.tsx');
        await fs.promises.writeFile(appTsxPath, dynamicAppTsx, 'utf-8');
        console.log('[MVP]     Generated TAB-BASED App.tsx');
    }

    // DYNAMIC SERVER INDEX.TS: Detect generated routes and connect them
    const generatedRoutes = files
        .filter(f => f.path.includes('server/src/routes/') && f.path.endsWith('.ts'))
        .map(f => {
            const filename = path.basename(f.path, '.ts');
            return { name: filename, path: f.path };
        });

    if (generatedRoutes.length > 0) {
        console.log(`[MVP]   Generating dynamic server index.ts with ${generatedRoutes.length} routes...`);

        // Build route imports
        const routeImports = generatedRoutes.map(r => `import ${r.name}Routes from './routes/${r.name}';`).join('\n');

        // Build route uses with auth middleware
        const routeUses = generatedRoutes.map(r => `app.use('/api/${r.name}', authMiddleware, ${r.name}Routes);`).join('\n');

        const dynamicServerIndex = `import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import { authMiddleware, AuthRequest } from './middleware/auth';
${routeImports}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: { id: string; email?: string };
        }
    }
}

// Middleware - Allow iframe embedding
app.use(cors());

// Custom middleware to allow iframe embedding
app.use((req, res, next) => {
    res.removeHeader('X-Frame-Options');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    next();
});

app.use(morgan('dev'));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generated API Routes (with auth)
${routeUses}

// Serve Static Frontend (Production)
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all: serve index.html for non-API routes (SPA support)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(\`🚀 Server running on port \${PORT}\`);
});
`;

        const serverIndexPath = path.join(projectDir, 'server/src/index.ts');
        await fs.promises.writeFile(serverIndexPath, dynamicServerIndex, 'utf-8');
        console.log('[MVP]     Generated dynamic server index.ts');
    }

    const project: MVPProject = {
        id: projectId,
        userId,
        name: projectName || `MVP-${projectId.slice(-6)}`,
        status: 'pending',
        createdAt: new Date(),
        logs: [`Project created at ${projectDir}`],
        chatId
    };

    projects.set(projectId, project);
    if (chatId) {
        chatProjectMap.set(chatId, projectId);
    }

    console.log(`[MVP] createProject: Done. ID: ${projectId}`);
    return project;
}

/**
 * Build Docker image for project
 */
export async function buildProject(projectId: string): Promise<MVPProject> {
    console.log(`[MVP] buildProject: Starting for ${projectId}`);
    const project = projects.get(projectId);
    if (!project) {
        throw new Error(`Project ${projectId} not found`);
    }

    const projectDir = path.join(GENERATED_MVPS_DIR, project.userId, projectId);
    console.log(`[MVP]   projectDir: ${projectDir}`);

    project.status = 'building';
    project.logs.push('Starting Docker build...');

    try {
        const imageName = `mvp-${projectId}`;
        console.log(`[MVP]   Building image: ${imageName}`);
        console.log('[MVP]   This may take several minutes...');

        const { stdout, stderr } = await execAsync(
            `docker build -t ${imageName} .`,
            { cwd: projectDir, timeout: 600000 } // 10 min timeout
        );

        project.logs.push(`Build output: ${stdout.slice(0, 500)}`);
        if (stderr) {
            project.logs.push(`Build stderr: ${stderr.slice(0, 500)}`);
        }

        console.log('[MVP]   Docker build completed');
        project.logs.push('Docker build completed successfully');
        return project;
    } catch (error: any) {
        console.error('[MVP]   Docker build FAILED:', error.message);
        project.status = 'error';
        project.logs.push(`Build failed: ${error.message}`);
        throw error;
    }
}

/**
 * Deploy (run) the Docker container
 */
export async function deployProject(projectId: string): Promise<MVPProject> {
    console.log(`[MVP] deployProject: Starting for ${projectId}`);
    const project = projects.get(projectId);
    if (!project) {
        throw new Error(`Project ${projectId} not found`);
    }

    const imageName = `mvp-${projectId}`;
    const containerName = `mvp-container-${projectId}`;

    // Try ports from 4001 to 4020 until we find an available one
    let port = 4001;
    let maxPort = 4020;
    let lastError = null;

    for (port = 4001; port <= maxPort; port++) {
        console.log(`[MVP]   Trying port: ${port}`);

        try {
            // First, try to stop any container that might be using this name
            await execAsync(`docker stop ${containerName} 2>/dev/null || true`);
            await execAsync(`docker rm ${containerName} 2>/dev/null || true`);

            const { stdout } = await execAsync(
                `docker run -d --name ${containerName} -p ${port}:3000 ${imageName}`
            );

            const containerId = stdout.trim();
            console.log(`[MVP]   Container ID: ${containerId}`);
            console.log(`[MVP]   Port: ${port}`);

            project.status = 'running';
            project.port = port;
            project.containerId = containerId;
            project.logs.push(`Container started: ${containerId}`);
            project.logs.push(`App available at: http://localhost:${port}`);

            activeContainers.set(projectId, { containerId, port });

            console.log(`[MVP] deployProject: Done. URL: http://localhost:${port}`);
            return project;
        } catch (error: any) {
            lastError = error;
            if (error.message.includes('port is already allocated')) {
                console.log(`[MVP]   Port ${port} in use, trying next...`);
                continue;
            }
            // If it's a different error, throw it
            throw error;
        }
    }

    // If we exhausted all ports
    console.error('[MVP]   Deploy FAILED: No available ports');
    project.status = 'error';
    project.logs.push(`Deploy failed: No available ports (tried ${4001}-${maxPort})`);
    throw lastError || new Error('No available ports');
}

/**
 * Stop and remove container
 */
export async function stopProject(projectId: string): Promise<MVPProject> {
    const project = projects.get(projectId);
    if (!project) {
        throw new Error(`Project ${projectId} not found`);
    }

    const containerInfo = activeContainers.get(projectId);
    if (!containerInfo) {
        project.status = 'stopped';
        return project;
    }

    try {
        await execAsync(`docker stop ${containerInfo.containerId}`);
        await execAsync(`docker rm ${containerInfo.containerId}`);
        project.status = 'stopped';
        project.logs.push('Container stopped and removed');
        activeContainers.delete(projectId);
        return project;
    } catch (error: any) {
        project.logs.push(`Stop error: ${error.message}`);
        throw error;
    }
}

/**
 * Get project status
 */
export function getProject(projectId: string): MVPProject | undefined {
    return projects.get(projectId);
}

/**
 * Get all projects for a user
 */
export function getUserProjects(userId: string): MVPProject[] {
    return Array.from(projects.values()).filter(p => p.userId === userId);
}

/**
 * Full pipeline: Parse -> Create -> Build -> Deploy
 * With caching: if we already have a project for this chat, return it
 */
export async function generateAndDeployMVP(
    userId: string,
    projectName: string,
    aiContent: string,
    onProgress?: (status: string) => void,
    chatId?: string
): Promise<MVPProject> {
    const report = (msg: string) => {
        console.log(`[MVP] ${msg}`);
        onProgress?.(msg);
    };

    // Check cache first
    if (chatId) {
        const existing = getExistingProject(chatId);
        if (existing && existing.status === 'running') {
            report(`Reusing existing MVP at http://localhost:${existing.port}`);
            return existing;
        }
    }

    // Step 1: Parse code blocks
    report('Parsing code blocks...');
    const files = parseCodeBlocks(aiContent);

    if (files.length === 0) {
        throw new Error('No code blocks found in AI output');
    }

    report(`Found ${files.length} files to generate`);

    // Step 2: Create project
    report('Creating project directory...');
    const project = await createProject(userId, projectName, files, chatId);

    // Step 3: Build
    report('Building Docker image (this may take a few minutes)...');
    await buildProject(project.id);

    // Step 4: Deploy
    report('Deploying container...');
    await deployProject(project.id);

    report(`MVP ready at http://localhost:${project.port}`);

    return project;
}

// Helper: Recursively copy directory
async function copyDir(src: string, dest: string): Promise<void> {
    console.log(`[MVP] copyDir: ${src} -> ${dest}`);
    await fs.promises.mkdir(dest, { recursive: true });

    let entries;
    try {
        entries = await fs.promises.readdir(src, { withFileTypes: true });
    } catch (err: any) {
        console.error(`[MVP] copyDir ERROR reading ${src}:`, err.message);
        throw err;
    }

    console.log(`[MVP] copyDir: Found ${entries.length} entries in ${src}`);

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else {
            await fs.promises.copyFile(srcPath, destPath);
        }
    }
    console.log(`[MVP] copyDir: Done copying ${src}`);
}

// Ensure generated-mvps directory exists
(async () => {
    try {
        await fs.promises.mkdir(GENERATED_MVPS_DIR, { recursive: true });
        console.log('[MVP Service] Generated MVPs directory ready');
    } catch (e) {
        // Ignore if exists
    }
})();
