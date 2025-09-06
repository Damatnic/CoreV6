// Global type definitions to resolve build issues temporarily
// These will be replaced when proper dependencies are installed

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    ENCRYPTION_KEY: string;
    AUDIT_LOG_KEY: string;
    OPENAI_API_KEY?: string;
    GEMINI_API_KEY?: string;
    NEXTAUTH_URL?: string;
    NEXTAUTH_SECRET?: string;
    REDIS_URL?: string;
    SENDGRID_API_KEY?: string;
    FROM_EMAIL?: string;
    CRISIS_TEXT_LINE_API?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_S3_BUCKET?: string;
    AWS_REGION?: string;
    SOCKET_SECRET?: string;
    ENABLE_AI_THERAPY?: string;
    ENABLE_CRISIS_DETECTION?: string;
    ENABLE_PEER_SUPPORT?: string;
    ENABLE_PROFESSIONAL_SERVICES?: string;
    ENABLE_OFFLINE_MODE?: string;
    VERCEL_ENV?: string;
    VERCEL_REGION?: string;
    VERCEL_URL?: string;
  }

  interface Process {
    env: ProcessEnv;
    platform: string;
    version: string;
    uptime(): number;
    memoryUsage(): { rss: number; heapTotal: number; heapUsed: number; external: number; arrayBuffers: number };
  }
}

declare var process: NodeJS.Process;
declare var Buffer: any;
declare function require(id: string): any;

// Basic React types
declare namespace React {
  interface Component<P = {}, S = {}, SS = any> {}
  interface ComponentClass<P = {}, S = ComponentState> {}
  interface FunctionComponent<P = {}> {}
  type FC<P = {}> = FunctionComponent<P>;
  interface ComponentProps<T> {}
  interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {}
  interface ReactNode {}
  type JSXElementConstructor<P> = ((props: P) => ReactElement | null) | (new (props: P) => Component<P, ComponentState>);
  type ComponentState = any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element {}
}

declare module 'react' {
  export = React;
}

// Basic Next.js types
declare module 'next/server' {
  export interface NextRequest {
    json(): Promise<any>;
    nextUrl: URL;
  }
  export interface NextResponse {
    json(data: any, init?: ResponseInit): Response;
  }
  export const NextResponse: {
    new(body?: any, init?: ResponseInit): Response;
    json(data: any, init?: ResponseInit): Response;
  };
}

declare module 'next/link' {
  const Link: React.FunctionComponent<any>;
  export default Link;
}

declare module 'next/navigation' {
  export function useRouter(): any;
  export function useSearchParams(): any;
  export function usePathname(): string;
  export function redirect(url: string): never;
}

declare module 'next-auth' {
  export function getServerSession(config?: any): Promise<any>;
  export interface Session {}
  export interface User {}
}

declare module 'next-auth/react' {
  export function useSession(): { data: any; status: string };
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(): Promise<any>;
}

// Basic third-party library types
declare module 'zod' {
  export const z: any;
}

declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: React.FunctionComponent<any>;
}

declare module 'lucide-react' {
  export const Search: React.FunctionComponent<any>;
  export const Users: React.FunctionComponent<any>;
  export const MessageCircle: React.FunctionComponent<any>;
  export const Heart: React.FunctionComponent<any>;
  export const Shield: React.FunctionComponent<any>;
  export const Activity: React.FunctionComponent<any>;
  export const Calendar: React.FunctionComponent<any>;
  export const User: React.FunctionComponent<any>;
  export const Settings: React.FunctionComponent<any>;
  export const LogOut: React.FunctionComponent<any>;
  export const Bell: React.FunctionComponent<any>;
  export const Plus: React.FunctionComponent<any>;
  export const Edit: React.FunctionComponent<any>;
  export const Trash: React.FunctionComponent<any>;
  export const Send: React.FunctionComponent<any>;
  export const Phone: React.FunctionComponent<any>;
  export const Mail: React.FunctionComponent<any>;
  export const Lock: React.FunctionComponent<any>;
  export const Eye: React.FunctionComponent<any>;
  export const EyeOff: React.FunctionComponent<any>;
  export const CheckCircle: React.FunctionComponent<any>;
  export const AlertTriangle: React.FunctionComponent<any>;
  export const Loader2: React.FunctionComponent<any>;
  export const ChevronDown: React.FunctionComponent<any>;
  export const ChevronUp: React.FunctionComponent<any>;
  export const ChevronRight: React.FunctionComponent<any>;
  export const ChevronLeft: React.FunctionComponent<any>;
  export const Menu: React.FunctionComponent<any>;
  export const X: React.FunctionComponent<any>;
  export const Home: React.FunctionComponent<any>;
  export const BookOpen: React.FunctionComponent<any>;
  export const Headphones: React.FunctionComponent<any>;
  export const Users2: React.FunctionComponent<any>;
  export const Clock: React.FunctionComponent<any>;
  export const Star: React.FunctionComponent<any>;
  export const Download: React.FunctionComponent<any>;
  export const Share: React.FunctionComponent<any>;
  export const Copy: React.FunctionComponent<any>;
  export const ExternalLink: React.FunctionComponent<any>;
  export const Filter: React.FunctionComponent<any>;
  export const SortAsc: React.FunctionComponent<any>;
  export const SortDesc: React.FunctionComponent<any>;
  export const MoreVertical: React.FunctionComponent<any>;
  export const Bookmark: React.FunctionComponent<any>;
  export const Flag: React.FunctionComponent<any>;
}

declare module '@radix-ui/react-dialog' {
  export const Root: React.FunctionComponent<any>;
  export const Trigger: React.FunctionComponent<any>;
  export const Portal: React.FunctionComponent<any>;
  export const Overlay: React.FunctionComponent<any>;
  export const Content: React.FunctionComponent<any>;
  export const Title: React.FunctionComponent<any>;
  export const Description: React.FunctionComponent<any>;
  export const Close: React.FunctionComponent<any>;
}

declare module '@radix-ui/react-tabs' {
  export const Root: React.FunctionComponent<any>;
  export const List: React.FunctionComponent<any>;
  export const Trigger: React.FunctionComponent<any>;
  export const Content: React.FunctionComponent<any>;
}

declare module '@radix-ui/react-progress' {
  export const Root: React.FunctionComponent<any>;
  export const Indicator: React.FunctionComponent<any>;
}

declare module '@radix-ui/react-switch' {
  export const Root: React.FunctionComponent<any>;
  export const Thumb: React.FunctionComponent<any>;
}

declare module 'react-hot-toast' {
  const toast: any;
  export default toast;
  export const Toaster: React.FunctionComponent<any>;
}

declare module 'canvas-confetti' {
  const confetti: any;
  export default confetti;
}

declare module 'clsx' {
  function clsx(...args: any[]): string;
  export default clsx;
}

declare module 'tailwind-merge' {
  export function twMerge(...args: any[]): string;
}

declare module 'zustand' {
  export interface StateCreator<T> {
    (set: (state: Partial<T>) => void, get: () => T): T;
  }
  export function create<T>(stateCreator: StateCreator<T>): () => T;
}

declare module 'zustand/middleware' {
  export function persist<T>(config: any, options?: any): any;
  export function devtools<T>(config: any, options?: any): any;
}

declare module 'tailwindcss' {
  const tailwindcss: any;
  export default tailwindcss;
}

declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: any);
    user: any;
    session: any;
    crisisReport: any;
    safetyPlan: any;
    moodEntry: any;
    journalEntry: any;
    supportSession: any;
    communityPost: any;
    appointment: any;
    notification: any;
    $disconnect(): Promise<void>;
    $connect(): Promise<void>;
  }
}