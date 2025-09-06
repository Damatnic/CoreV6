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
    NEXT_PUBLIC_WEBSOCKET_URL?: string;
    NEXT_PUBLIC_API_URL?: string;
    POSTGRES_PRISMA_URL?: string;
    NEXT_PUBLIC_SOCKET_URL?: string;
    UPSTASH_REDIS_URL?: string;
    UPSTASH_REDIS_TOKEN?: string;
    NEXT_PUBLIC_APP_URL?: string;
  }

  interface Process {
    env: ProcessEnv;
    platform: string;
    version: string;
    uptime(): number;
    memoryUsage(): { rss: number; heapTotal: number; heapUsed: number; external: number; arrayBuffers: number };
  }

  type Timeout = number;
}

declare var process: NodeJS.Process;
declare var Buffer: any;
declare function require(id: string): any;

// ServiceWorkerRegistration with sync manager
interface ServiceWorkerRegistration {
  sync: {
    register(tag: string): Promise<void>;
  };
}

// Extended DOM interfaces
interface HTMLElement {
  disabled?: boolean;
}

interface Element {
  labels?: NodeList | null;
}

interface PerformanceResourceTiming extends PerformanceEntry {
  loadEventEnd?: number;
  loadEventStart?: number;
}

// Basic React types for compatibility
declare namespace React {
  interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {}
  interface ReactNode {}
  type JSXElementConstructor<P> = ((props: P) => ReactElement | null) | (new (props: P) => Component<any, any>);
  
  class Component<P = {}, S = {}> {
    props: P;
    state: S;
    context: any;
    refs: {
      [key: string]: ReactInstance;
    };
    constructor(props: P, context?: any);
    setState<K extends keyof S>(
      state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
      callback?: () => void
    ): void;
    forceUpdate(callBack?: () => void): void;
    render(): ReactNode;
    componentDidMount?(): void;
    shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean;
    componentWillUnmount?(): void;
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): void;
    getSnapshotBeforeUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>): any;
    componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot?: any): void;
    componentWillMount?(): void;
    componentWillReceiveProps?(nextProps: Readonly<P>, nextContext: any): void;
    componentWillUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): void;
  }
  
  type ReactInstance = Component<any> | Element;
  
  interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): ReactElement | null;
  }
  type FC<P = {}> = FunctionComponent<P>;
  type ComponentType<P = {}> = FunctionComponent<P> | ComponentClass<P>;
  interface ComponentClass<P = {}, S = any> {
    new (props: P): Component<P, S>;
  }
  
  interface ComponentLifecycle<P, S> {
    componentDidMount?(): void;
    shouldComponentUpdate?(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean;
    componentWillUnmount?(): void;
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): void;
    getSnapshotBeforeUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>): any;
    componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>, snapshot?: any): void;
  }
  
  function getDerivedStateFromError<P, S>(error: Error): Partial<S>;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element {}
}

declare module 'react' {
  export = React;
  export const Component: typeof React.Component;
  export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useContext<T>(context: any): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function createContext<T>(defaultValue: T): any;
  export function lazy<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>): T;
  export function Suspense(props: { children: React.ReactNode; fallback?: React.ReactNode }): JSX.Element;
  export interface ErrorInfo {
    componentStack: string;
  }
  export interface ChangeEvent<T = HTMLInputElement> {
    target: T;
    currentTarget: T;
  }
  export interface KeyboardEvent<T = HTMLElement> {
    key: string;
    code: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    preventDefault(): void;
    stopPropagation(): void;
  }
  export interface MouseEvent<T = HTMLElement> {
    button: number;
    buttons: number;
    clientX: number;
    clientY: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    preventDefault(): void;
    stopPropagation(): void;
  }
  export interface FormEvent<T = HTMLFormElement> {
    currentTarget: T;
    preventDefault(): void;
    stopPropagation(): void;
  }
  export type ElementType = string | React.ComponentType<any>;
}

// Basic Next.js types
declare module 'next/server' {
  export interface NextRequest {
    json(): Promise<any>;
    nextUrl: URL;
    headers: Headers;
    url: string;
    method: string;
    body: ReadableStream | null;
    ip?: string;
  }
  export interface NextResponse {
    json(data: any, init?: ResponseInit): Response;
    headers: Headers;
  }
  export const NextResponse: {
    new(body?: any, init?: ResponseInit): Response;
    json(data: any, init?: ResponseInit): Response;
    redirect(url: string | URL, status?: number): Response;
    next(): Response;
  };
}

declare module 'next/link' {
  const Link: React.ComponentType<any>;
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
  export function useSession(): { 
    data: { 
      user?: { 
        id?: string; 
        name?: string; 
        email?: string; 
        image?: string;
        role?: string;
        [key: string]: any; 
      }; 
      [key: string]: any; 
    } | null; 
    status: string 
  };
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(): Promise<any>;
}

// Basic third-party library types
declare module 'zod' {
  export const z: any;
}

declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: React.ComponentType<any>;
  export function useAnimation(): any;
}

declare module 'lucide-react' {
  export const Search: React.ComponentType<any>;
  export const Users: React.ComponentType<any>;
  export const MessageCircle: React.ComponentType<any>;
  export const Heart: React.ComponentType<any>;
  export const Shield: React.ComponentType<any>;
  export const Activity: React.ComponentType<any>;
  export const Calendar: React.ComponentType<any>;
  export const User: React.ComponentType<any>;
  export const Settings: React.ComponentType<any>;
  export const LogOut: React.ComponentType<any>;
  export const Bell: React.ComponentType<any>;
  export const Plus: React.ComponentType<any>;
  export const Edit: React.ComponentType<any>;
  export const Trash: React.ComponentType<any>;
  export const Send: React.ComponentType<any>;
  export const Phone: React.ComponentType<any>;
  export const Mail: React.ComponentType<any>;
  export const Lock: React.ComponentType<any>;
  export const Eye: React.ComponentType<any>;
  export const EyeOff: React.ComponentType<any>;
  export const CheckCircle: React.ComponentType<any>;
  export const AlertTriangle: React.ComponentType<any>;
  export const Loader2: React.ComponentType<any>;
  export const ChevronDown: React.ComponentType<any>;
  export const ChevronUp: React.ComponentType<any>;
  export const ChevronRight: React.ComponentType<any>;
  export const ChevronLeft: React.ComponentType<any>;
  export const Menu: React.ComponentType<any>;
  export const X: React.ComponentType<any>;
  export const Home: React.ComponentType<any>;
  export const BookOpen: React.ComponentType<any>;
  export const Headphones: React.ComponentType<any>;
  export const Users2: React.ComponentType<any>;
  export const Clock: React.ComponentType<any>;
  export const Star: React.ComponentType<any>;
  export const Download: React.ComponentType<any>;
  export const Share: React.ComponentType<any>;
  export const Copy: React.ComponentType<any>;
  export const ExternalLink: React.ComponentType<any>;
  export const Filter: React.ComponentType<any>;
  export const SortAsc: React.ComponentType<any>;
  export const SortDesc: React.ComponentType<any>;
  export const MoreVertical: React.ComponentType<any>;
  export const Bookmark: React.ComponentType<any>;
  export const Flag: React.ComponentType<any>;
  export const AlertCircle: React.ComponentType<any>;
  export const ArrowDown: React.ComponentType<any>;
  export const ArrowLeft: React.ComponentType<any>;
  export const ArrowRight: React.ComponentType<any>;
  export const ArrowUp: React.ComponentType<any>;
  export const Award: React.ComponentType<any>;
  export const BarChart3: React.ComponentType<any>;
  export const Battery: React.ComponentType<any>;
  export const Book: React.ComponentType<any>;
  export const Bot: React.ComponentType<any>;
  export const Brain: React.ComponentType<any>;
  export const Check: React.ComponentType<any>;
  export const CheckCheck: React.ComponentType<any>;
  export const ClipboardCheck: React.ComponentType<any>;
  export const Cloud: React.ComponentType<any>;
  export const CloudRain: React.ComponentType<any>;
  export const Compass: React.ComponentType<any>;
  export const Cpu: React.ComponentType<any>;
  export const Crown: React.ComponentType<any>;
  export const Database: React.ComponentType<any>;
  export const Droplets: React.ComponentType<any>;
  export const FileText: React.ComponentType<any>;
  export const Flame: React.ComponentType<any>;
  export const Focus: React.ComponentType<any>;
  export const Frown: React.ComponentType<any>;
  export const Gauge: React.ComponentType<any>;
  export const Gift: React.ComponentType<any>;
  export const Globe: React.ComponentType<any>;
  export const Grid3x3: React.ComponentType<any>;
  export const HandHeart: React.ComponentType<any>;
  export const HardDrive: React.ComponentType<any>;
  export const HeartHandshake: React.ComponentType<any>;
  export const HelpCircle: React.ComponentType<any>;
  export const Info: React.ComponentType<any>;
  export const Layout: React.ComponentType<any>;
  export const Leaf: React.ComponentType<any>;
  export const Lightbulb: React.ComponentType<any>;
  export const LineChart: React.ComponentType<any>;
  export const MapPin: React.ComponentType<any>;
  export const Maximize2: React.ComponentType<any>;
  export const Medal: React.ComponentType<any>;
  export const Meh: React.ComponentType<any>;
  export const MessageSquare: React.ComponentType<any>;
  export const MessageSquareOff: React.ComponentType<any>;
  export const Mic: React.ComponentType<any>;
  export const MicOff: React.ComponentType<any>;
  export const Minimize2: React.ComponentType<any>;
  export const Minus: React.ComponentType<any>;
  export const Monitor: React.ComponentType<any>;
  export const Moon: React.ComponentType<any>;
  export const Paperclip: React.ComponentType<any>;
  export const Pause: React.ComponentType<any>;
  export const PenTool: React.ComponentType<any>;
  export const PhoneCall: React.ComponentType<any>;
  export const PhoneOff: React.ComponentType<any>;
  export const PieChart: React.ComponentType<any>;
  export const Pill: React.ComponentType<any>;
  export const Pin: React.ComponentType<any>;
  export const Play: React.ComponentType<any>;
  export const PlusCircle: React.ComponentType<any>;
  export const RefreshCw: React.ComponentType<any>;
  export const RotateCcw: React.ComponentType<any>;
  export const Save: React.ComponentType<any>;
  export const Server: React.ComponentType<any>;
  export const Smartphone: React.ComponentType<any>;
  export const Smile: React.ComponentType<any>;
  export const Sparkles: React.ComponentType<any>;
  export const Square: React.ComponentType<any>;
  export const Stethoscope: React.ComponentType<any>;
  export const Sun: React.ComponentType<any>;
  export const Tablet: React.ComponentType<any>;
  export const Target: React.ComponentType<any>;
  export const ThumbsUp: React.ComponentType<any>;
  export const Timer: React.ComponentType<any>;
  export const TrendingDown: React.ComponentType<any>;
  export const TrendingUp: React.ComponentType<any>;
  export const Trophy: React.ComponentType<any>;
  export const Upload: React.ComponentType<any>;
  export const UserCheck: React.ComponentType<any>;
  export const UserPlus: React.ComponentType<any>;
  export const Video: React.ComponentType<any>;
  export const VideoOff: React.ComponentType<any>;
  export const Volume2: React.ComponentType<any>;
  export const VolumeX: React.ComponentType<any>;
  export const Wind: React.ComponentType<any>;
  export const XCircle: React.ComponentType<any>;
  export const Zap: React.ComponentType<any>;
}

declare module '@radix-ui/react-dialog' {
  export const Root: React.ComponentType<any>;
  export const Trigger: React.ComponentType<any>;
  export const Portal: React.ComponentType<any>;
  export const Overlay: React.ComponentType<any>;
  export const Content: React.ComponentType<any>;
  export const Title: React.ComponentType<any>;
  export const Description: React.ComponentType<any>;
  export const Close: React.ComponentType<any>;
}

declare module '@radix-ui/react-tabs' {
  export const Root: React.ComponentType<any>;
  export const List: React.ComponentType<any>;
  export const Trigger: React.ComponentType<any>;
  export const Content: React.ComponentType<any>;
}

declare module '@radix-ui/react-progress' {
  export const Root: React.ComponentType<any>;
  export const Indicator: React.ComponentType<any>;
}

declare module '@radix-ui/react-switch' {
  export const Root: React.ComponentType<any>;
  export const Thumb: React.ComponentType<any>;
}

declare module 'react-hot-toast' {
  const toast: any;
  export default toast;
  export const toast: any;
  export const Toaster: React.ComponentType<any>;
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
  export interface StoreApi<T> {
    (): T;
    getState(): T;
    setState(partial: Partial<T>): void;
    subscribe(listener: (state: T, prevState: T) => void): () => void;
  }
  export function create<T>(stateCreator: StateCreator<T>): StoreApi<T>;
}

declare module 'zustand/middleware' {
  export function persist<T>(config: any, options?: any): any;
  export function devtools<T>(config: any, options?: any): any;
}

declare module 'react-chartjs-2' {
  export const Line: React.ComponentType<any>;
  export const Bar: React.ComponentType<any>;
  export const Pie: React.ComponentType<any>;
  export const Doughnut: React.ComponentType<any>;
  export const Radar: React.ComponentType<any>;
  export const PolarArea: React.ComponentType<any>;
  export const Bubble: React.ComponentType<any>;
  export const Scatter: React.ComponentType<any>;
}

declare module 'chart.js' {
  export interface ChartConfiguration {
    type: string;
    data: any;
    options?: any;
  }
  export const Chart: any;
  export const registerables: any[];
  export function register(...args: any[]): void;
  export const CategoryScale: any;
  export const LinearScale: any;
  export const PointElement: any;
  export const LineElement: any;
  export const BarElement: any;
  export const ArcElement: any;
  export const Title: any;
  export const Tooltip: any;
  export const Legend: any;
  export const Filler: any;
  export const RadarController: any;
  export const RadialLinearScale: any;
}

declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    keywords?: string[];
    viewport?: string;
  }
}

declare module 'next/font/google' {
  export function Inter(options?: any): any;
  export function Roboto(options?: any): any;
}

declare module 'date-fns' {
  export function format(date: Date, formatString: string): string;
  export function formatDistanceToNow(date: Date, options?: any): string;
  export function isToday(date: Date): boolean;
  export function isYesterday(date: Date): boolean;
  export function addDays(date: Date, amount: number): Date;
  export function subDays(date: Date, amount: number): Date;
}

declare module '@emoji-mart/react' {
  export const Picker: React.ComponentType<any>;
  export const EmojiPicker: React.ComponentType<any>;
  export const EmojiMart: React.ComponentType<any>;
  export default EmojiPicker;
}

declare module '@emoji-mart/data' {
  const data: any;
  export default data;
}

declare module 'socket.io-client' {
  export function io(url?: string, options?: any): Socket;
  export interface Socket {
    connected: boolean;
    emit(event: string, ...args: any[]): void;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback?: (...args: any[]) => void): void;
    disconnect(): void;
  }
}

declare module '@use-gesture/react' {
  export function useGesture(handlers: any, config?: any): any;
  export function useDrag(handler: any, config?: any): any;
  export function useSpring(config: any): any;
}

declare module '@neondatabase/serverless' {
  export const Pool: any;
  export const neonConfig: any;
  export function neon(connectionString: string): any;
}

declare module '@upstash/ratelimit' {
  export class Ratelimit {
    constructor(options: any);
    limit(identifier: string): Promise<any>;
    static slidingWindow(requests: number, window: string): any;
  }
}

declare module '@upstash/redis' {
  export class Redis {
    constructor(options: any);
    get(key: string): Promise<any>;
    set(key: string, value: any, options?: any): Promise<any>;
    del(key: string): Promise<any>;
  }
}

declare module 'bcryptjs' {
  export function hash(data: string, salt: number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
}

declare module 'cookie' {
  export function parse(str: string, options?: any): Record<string, string>;
  export function serialize(name: string, value: string, options?: any): string;
}

declare module 'crypto' {
  export function createHash(algorithm: string): any;
  export function createHmac(algorithm: string, key: string): any;
  export function randomBytes(size: number): Buffer;
  export function pbkdf2(password: string, salt: string, iterations: number, keylen: number, digest: string, callback: (err: Error | null, derivedKey?: Buffer) => void): void;
  export function createCipheriv(algorithm: string, key: string | Buffer, iv: string | Buffer): any;
  export function createDecipheriv(algorithm: string, key: string | Buffer, iv: string | Buffer): any;
}

declare module 'crypto-js' {
  export const AES: any;
  export const SHA256: any;
  export const enc: any;
  export function encrypt(message: string, key: string): any;
  export function decrypt(ciphertext: any, key: string): any;
}

declare module 'events' {
  export class EventEmitter {
    on(event: string, listener: (...args: any[]) => void): this;
    once(event: string, listener: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): boolean;
    removeListener(event: string, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string): this;
  }
}

declare module 'http' {
  export interface IncomingMessage {
    headers: Record<string, string | string[]>;
    url?: string;
    method?: string;
  }
  export interface ServerResponse {
    statusCode: number;
    setHeader(name: string, value: string | string[]): void;
    end(chunk?: any): void;
  }
  export class Server {
    constructor(requestListener?: (req: IncomingMessage, res: ServerResponse) => void);
    listen(port?: number, hostname?: string, callback?: () => void): this;
  }
}

declare module 'jsonwebtoken' {
  export function sign(payload: any, secretOrPrivateKey: string, options?: any): string;
  export function verify(token: string, secretOrPublicKey: string, options?: any): any;
  export function decode(token: string, options?: any): any;
}

declare module 'socket.io' {
  export class Server {
    constructor(options?: any);
    on(event: string, callback: (socket: any) => void): void;
    emit(event: string, ...args: any[]): void;
    use(middleware: (...args: any[]) => void): void;
    to(room: string): { emit(event: string, ...args: any[]): void };
  }
  export interface Socket {
    id: string;
    connected: boolean;
    rooms: Set<string>;
    handshake: {
      headers: Record<string, string | string[]>;
      [key: string]: any;
    };
    data: {
      [key: string]: any;
    };
    emit(event: string, ...args: any[]): void;
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback?: (...args: any[]) => void): void;
    join(room: string): void;
    leave(room: string): void;
    disconnect(): void;
    to(room: string): {
      emit(event: string, ...args: any[]): void;
    };
  }
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