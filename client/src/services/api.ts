import axios, { AxiosInstance } from 'axios';
import type { LoginCredentials, RegisterData, AuthResponse, ChatSession, Message, ApiResponse, CoinTransaction, UserFeedback, Project, ProjectDeliverable } from '../types';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: '/api',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add auth token to requests
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
    }

    // ==========AUTH==========
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', data);
        if (response.data.success && response.data.data) {
            localStorage.setItem('token', response.data.data.token);
            return response.data.data;
        }
        throw new Error(response.data.error || 'Registration failed');
    }

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
        if (response.data.success && response.data.data) {
            localStorage.setItem('token', response.data.data.token);
            return response.data.data;
        }
        throw new Error(response.data.error || 'Login failed');
    }

    async logout(): Promise<void> {
        try {
            await this.client.post('/auth/logout');
        } finally {
            localStorage.removeItem('token');
        }
    }

    async getMe() {
        const response = await this.client.get<ApiResponse>('/auth/me');
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.error || 'Failed to get user');
    }

    async forgotPassword(email: string): Promise<void> {
        await this.client.post('/auth/forgot-password', { email });
    }

    // ========== CHATS ==========
    async getChatSessions(): Promise<ChatSession[]> {
        const response = await this.client.get<ApiResponse<ChatSession[]>>('/chats');
        return response.data.data || [];
    }

    async createChatSession(title?: string, projectId?: string): Promise<ChatSession> {
        const response = await this.client.post<ApiResponse<ChatSession>>('/chats', { title, project_id: projectId });
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to create chat session');
    }

    async getChatSession(id: string): Promise<ChatSession> {
        const response = await this.client.get<ApiResponse<ChatSession>>(`/chats/${id}`);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to get chat session');
    }

    async updateChatSession(id: string, updates: { title?: string; status?: 'active' | 'archived' }): Promise<ChatSession> {
        const response = await this.client.patch<ApiResponse<ChatSession>>(`/chats/${id}`, updates);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to update chat session');
    }

    async deleteChatSession(id: string): Promise<void> {
        await this.client.delete(`/chats/${id}`);
    }

    async getChatMessages(sessionId: string): Promise<Message[]> {
        const response = await this.client.get<ApiResponse<Message[]>>(`/chats/${sessionId}/messages`);
        return response.data.data || [];
    }

    async generateWelcomeMessage(sessionId: string): Promise<{ message: string; messageId: string }> {
        const response = await this.client.post<ApiResponse<{ message: string; messageId: string }>>(`/chats/${sessionId}/welcome`);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to generate welcome message');
    }

    // ========== USER ==========
    async getReferralCode(): Promise<string> {
        const response = await this.client.get<ApiResponse<{ referral_code: string }>>('/user/referral-code');
        return response.data.data?.referral_code || '';
    }

    async getReferralCount(): Promise<number> {
        const response = await this.client.get<ApiResponse<{ total_referrals: number }>>('/user/referral-count');
        return response.data.data?.total_referrals || 0;
    }

    async submitFeedback(feedback: Omit<UserFeedback, 'id' | 'user_id' | 'created_at'>): Promise<void> {
        await this.client.post('/user/feedback', feedback);
    }

    async getReferrals(): Promise<{ id: string; email: string; full_name: string | null; created_at: string }[]> {
        const response = await this.client.get<ApiResponse<{ referrals: { id: string; email: string; full_name: string | null; created_at: string }[] }>>('/auth/referrals');
        return response.data.data?.referrals || [];
    }

    // ========== PAYMENTS ==========
    async getUserCoins(): Promise<number> {
        const response = await this.client.get<ApiResponse<{ total_coins: number }>>('/payments/coins');
        return response.data.data?.total_coins || 0;
    }

    async purchaseCoins(amount: number, price: number, paypal_order_id: string): Promise<number> {
        const response = await this.client.post<ApiResponse<{ total_coins: number }>>('/payments/purchase', {
            amount,
            price,
            paypal_order_id,
        });
        return response.data.data?.total_coins || 0;
    }

    async getTransactions(): Promise<CoinTransaction[]> {
        const response = await this.client.get<ApiResponse<CoinTransaction[]>>('/payments/transactions');
        return response.data.data || [];
    }

    // ========== PROJECTS ==========
    async getProjects(): Promise<Project[]> {
        const response = await this.client.get<ApiResponse<Project[]>>('/projects');
        return response.data.data || [];
    }

    async createProject(name: string, description?: string): Promise<Project> {
        const response = await this.client.post<ApiResponse<Project>>('/projects', { name, description });
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to create project');
    }

    async getProject(id: string): Promise<Project> {
        const response = await this.client.get<ApiResponse<Project>>(`/projects/${id}`);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to get project');
    }

    async updateProject(id: string, updates: { name?: string; description?: string; status?: 'active' | 'completed' | 'archived' }): Promise<Project> {
        const response = await this.client.patch<ApiResponse<Project>>(`/projects/${id}`, updates);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to update project');
    }

    async deleteProject(id: string): Promise<void> {
        await this.client.delete(`/projects/${id}`);
    }

    async updateDeliverable(id: string, updates: { status?: 'pending' | 'in_progress' | 'completed'; chat_id?: string }): Promise<ProjectDeliverable> {
        const response = await this.client.patch<ApiResponse<ProjectDeliverable>>(`/deliverables/${id}`, updates);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error('Failed to update deliverable');
    }
}

export const apiClient = new ApiClient();
