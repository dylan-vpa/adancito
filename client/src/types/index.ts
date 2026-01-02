// TypeScript type definitions for the Adan application

export interface User {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    referral_code?: string;
    total_referrals: number;
    created_at: string;
    updated_at: string;
}

export interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    status: 'active' | 'archived';
    last_active: string;
    created_at: string;
}

export interface Message {
    id: string;
    session_id: string;
    user_id: string;
    role: 'user' | 'assistant';
    content: string;
    code_language?: string; // Stores agent name when role is 'assistant'
    code_content?: string;  // Stores agent reasoning
    created_at: string;
    isStreaming?: boolean; // Frontend only
    moderationInfo?: ModerationInfo; // Frontend only
    deliverableReady?: boolean; // Triggered by AI
    deliverableFile?: string; // Specific file to show
}

export interface ModerationInfo {
    selected_agents: string[];
    reasoning: string;
    primary_agent: string;
    eden_level?: string;
    deliverables?: string[];
}

export interface Agent {
    id: string;
    title: string;
    modelName: string;
    category: AgentCategory;
}

export type AgentCategory = 'Leadership' | 'Engineering' | 'Design' | 'Mentors' | 'Investors' | 'Special';

export interface AgentGroups {
    [key: string]: Agent[];
}

export interface UserCoins {
    id: number;
    user_id: string;
    total_coins: number;
    updated_at: string;
}

export interface CoinTransaction {
    id: number;
    user_id: string;
    amount: number;
    price: number;
    paypal_order_id?: string;
    transaction_type: 'purchase' | 'refund' | 'usage';
    status: 'completed' | 'pending' | 'failed';
    created_at: string;
}

export interface Project {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    status: 'active' | 'completed' | 'archived';
    created_at: string;
    updated_at: string;
    deliverables?: ProjectDeliverable[];
    chats?: ChatSession[];
}

export interface ProjectDeliverable {
    id: string;
    project_id: string;
    step_number: number;
    title: string;
    description?: string;
    eden_level?: string;
    status: 'pending' | 'in_progress' | 'completed';
    chat_id?: string;
    completed_at?: string;
    created_at: string;
}

export interface UserFeedback {
    id: number;
    user_id: string;
    email?: string;
    rating: number; // 1-5
    feedback_type: string;
    message: string;
    created_at: string;
}

// Auth related types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name?: string;
    referral_code?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

// API response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// EDEN Framework levels - matching deliverable names
export type EdenLevel =
    | 'E - Exploración'           // Diagnóstico de Oportunidad
    | 'D - Definición'            // Modelo de Negocio
    | 'E - Estructuración'        // Plan de Operaciones  
    | 'N - Navegación'            // MVP / Landing Page
    | 'E - Escalamiento'          // Plan de Crecimiento
    | 'Consulta General'
    | 'Consulta Específica';
