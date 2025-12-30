import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getOne, getAll, runQuery, generateId, getCurrentTimestamp } from '../models/db';
import { selectAgents, streamOllamaResponse } from '../services/ollamaService';

interface ChatSession {
    id: string;
    user_id: string;
    title: string;
    status: 'active' | 'archived';
    last_active: string;
    created_at: string;
}

interface Message {
    id: string;
    session_id: string;
    user_id: string;
    role: 'user' | 'assistant';
    content: string;
    code_language?: string;
    code_content?: string;
    created_at: string;
}

/**
 * Get all chat sessions for user
 */
export function getChatSessions(req: AuthRequest, res: Response) {
    try {
        const sessions = getAll<ChatSession>(
            'SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY last_active DESC',
            [req.userId!]
        );

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Get chat sessions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get chat sessions'
        });
    }
}

/**
 * Create new chat session
 */
export function createChatSession(req: AuthRequest, res: Response) {
    try {
        const { title } = req.body;
        const sessionId = generateId();
        const now = getCurrentTimestamp();

        runQuery(
            `INSERT INTO chat_sessions (id, user_id, title, status, last_active, created_at)
       VALUES (?, ?, ?, 'active', ?, ?)`,
            [sessionId, req.userId!, title || `Chat ${new Date().toLocaleDateString()}`, now, now]
        );

        const session = getOne<ChatSession>(
            'SELECT * FROM chat_sessions WHERE id = ?',
            [sessionId]
        );

        res.status(201).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Create chat session error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create chat session'
        });
    }
}

/**
 * Get specific chat session
 */
export function getChatSession(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        const session = getOne<ChatSession>(
            'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
            [id, req.userId!]
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Chat session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Get chat session error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get chat session'
        });
    }
}

/**
 * Update chat session (rename, archive)
 */
export function updateChatSession(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const { title, status } = req.body;

        // Build update query dynamically
        const updates: string[] = [];
        const params: any[] = [];

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }

        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No updates provided'
            });
        }

        params.push(id, req.userId!);

        runQuery(
            `UPDATE chat_sessions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            params
        );

        const session = getOne<ChatSession>(
            'SELECT * FROM chat_sessions WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Update chat session error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update chat session'
        });
    }
}

/**
 * Delete chat session
 */
export function deleteChatSession(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        runQuery(
            'DELETE FROM chat_sessions WHERE id = ? AND user_id = ?',
            [id, req.userId!]
        );

        res.json({
            success: true,
            message: 'Chat session deleted'
        });
    } catch (error) {
        console.error('Delete chat session error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete chat session'
        });
    }
}

/**
 * Get messages for a chat session
 */
export function getChatMessages(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        // Verify session belongs to user
        const session = getOne<ChatSession>(
            'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
            [id, req.userId!]
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Chat session not found'
            });
        }

        const messages = getAll<Message>(
            'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
            [id]
        );

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Get chat messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get messages'
        });
    }
}

/**
 * Send message and stream AI response via SSE
 */
export async function sendMessage(req: AuthRequest, res: Response) {
    try {
        const { session_id, content, model } = req.body;

        if (!session_id || !content) {
            return res.status(400).json({
                success: false,
                error: 'Session ID and content are required'
            });
        }

        // Verify session belongs to user
        const session = getOne<ChatSession>(
            'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?',
            [session_id, req.userId!]
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Chat session not found'
            });
        }

        // Save user message
        const userMessageId = generateId();
        const now = getCurrentTimestamp();

        runQuery(
            `INSERT INTO chat_messages (id, session_id, user_id, role, content, created_at)
       VALUES (?, ?, ?, 'user', ?, ?)`,
            [userMessageId, session_id, req.userId!, content, now]
        );

        // Update session last_active
        runQuery(
            'UPDATE chat_sessions SET last_active = ? WHERE id = ?',
            [now, session_id]
        );

        // Select agents based on content
        const agentSelection = selectAgents(content);
        const selectedModel = model || agentSelection.primary_agent;

        // Setup SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send moderation info
        res.write(`event: moderation_info\ndata: ${JSON.stringify(agentSelection)}\n\n`);

        // Send thinking indicator
        const assistantMessageId = generateId();
        res.write(`event: assistant_chunk\ndata: ${JSON.stringify({
            id: assistantMessageId,
            agent: selectedModel,
            content: '',
            isThinking: true
        })}\n\n`);

        // Get chat history for current session
        const previousMessages = getAll<Message>(
            'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
            [session_id]
        );

        const ollamaMessages = previousMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // Get EDEN level and project info if chat is associated with a deliverable
        const deliverable = getOne<{ eden_level?: string; project_id?: string; step_number?: number }>(
            'SELECT eden_level, project_id, step_number FROM project_deliverables WHERE chat_id = ?',
            [session_id]
        );
        const edenLevel = deliverable?.eden_level;

        console.log(`[Chat] Session ${session_id} - Deliverable info:`, deliverable);

        // CONTEXT CONTINUITY: If this is step 2+, fetch summary from previous levels
        if (deliverable?.project_id && deliverable?.step_number && deliverable.step_number > 1) {
            console.log(`[Chat] Step ${deliverable.step_number} detected, fetching context from previous levels...`);

            // Get previous level deliverables and their chat IDs
            const previousDeliverables = getAll<{ chat_id: string; eden_level: string; step_number: number }>(
                `SELECT chat_id, eden_level, step_number FROM project_deliverables 
                 WHERE project_id = ? AND step_number < ? AND chat_id IS NOT NULL AND status = 'completed'
                 ORDER BY step_number ASC`,
                [deliverable.project_id, deliverable.step_number]
            );

            console.log(`[Chat] Found ${previousDeliverables.length} completed previous deliverable(s)`);

            // For each completed previous level, get a summary (last assistant message with deliverable)
            const contextSummaries: string[] = [];
            for (const prevDel of previousDeliverables) {
                const lastAssistantMsg = getOne<{ content: string }>(
                    `SELECT content FROM chat_messages 
                     WHERE session_id = ? AND role = 'assistant' 
                     ORDER BY created_at DESC LIMIT 1`,
                    [prevDel.chat_id]
                );

                if (lastAssistantMsg?.content) {
                    // Extract key info (first 800 chars or until JSON block)
                    let summary = lastAssistantMsg.content;
                    const jsonIdx = summary.indexOf('```json');
                    if (jsonIdx > 0) summary = summary.substring(0, jsonIdx);
                    summary = summary.substring(0, 800).trim();

                    contextSummaries.push(`[${prevDel.eden_level}]: ${summary}`);
                    console.log(`[Chat] Extracted context from ${prevDel.eden_level} (${summary.length} chars)`);
                }
            }

            // Inject context at the start of conversation (always, not just first message)
            if (contextSummaries.length > 0) {
                const contextMessage = {
                    role: 'user' as const,
                    content: `📋 **CONTEXTO IMPORTANTE - Resumen de fases anteriores:**\n\n${contextSummaries.join('\n\n---\n\n')}\n\n---\n\nPor favor, usa este contexto para continuar con la fase actual sin repetir preguntas.`
                };
                // Insert as the first message so AI sees the context
                ollamaMessages.unshift(contextMessage);
                console.log(`[Chat] ✅ Injected context from ${contextSummaries.length} previous level(s) into conversation`);
            }
        } else {
            console.log(`[Chat] No context injection needed (step ${deliverable?.step_number || 1})`);
        }

        // Stream response from Ollama with EDEN context
        let fullContent = '';
        let displayContent = ''; // Content sent to client (filtered)
        let isInJsonBlock = false; // Track if we're inside a JSON deliverable block
        let firstChunk = true;

        try {
            for await (const part of streamOllamaResponse(selectedModel, ollamaMessages, edenLevel)) {

                // transform service events to SSE events
                if (part.type === 'thinking') {
                    res.write(`event: assistant_chunk\ndata: ${JSON.stringify({
                        id: assistantMessageId,
                        agent: selectedModel,
                        content: '',
                        isThinking: true
                    })}\n\n`);
                } else if (part.type === 'chunk' && part.content) {
                    fullContent += part.content;

                    // JSON HIDING: Check if we're entering a JSON block
                    if (!isInJsonBlock) {
                        // Check for JSON block markers
                        const jsonStartMarkers = ['```json', '{"deliverable_ready"', '{ "deliverable_ready"'];
                        for (const marker of jsonStartMarkers) {
                            if (fullContent.includes(marker)) {
                                isInJsonBlock = true;
                                console.log('[Chat] JSON block detected - hiding from stream');

                                // Send a "generating deliverable" indicator
                                res.write(`event: assistant_chunk\ndata: ${JSON.stringify({
                                    id: assistantMessageId,
                                    agent: selectedModel,
                                    content: '\n\n_Generando entregable..._',
                                    isThinking: false,
                                    isGeneratingDeliverable: true
                                })}\n\n`);
                                break;
                            }
                        }
                    }

                    // Only send content to client if we're NOT in a JSON block
                    if (!isInJsonBlock) {
                        displayContent += part.content;
                        res.write(`event: assistant_chunk\ndata: ${JSON.stringify({
                            id: assistantMessageId,
                            agent: selectedModel,
                            content: part.content,
                            isThinking: false
                        })}\n\n`);
                    }
                    // If in JSON block, we silently accumulate fullContent but don't send to client

                } else if (part.type === 'signal' && part.data) {
                    res.write(`event: deliverable_signal\ndata: ${JSON.stringify({
                        ...part.data
                    })}\n\n`);
                }
            }

            // Save assistant message
            runQuery(
                `INSERT INTO chat_messages (id, session_id, user_id, role, content, code_language, code_content, created_at)
         VALUES (?, ?, ?, 'assistant', ?, ?, ?, ?)`,
                [
                    assistantMessageId,
                    session_id,
                    req.userId!,
                    fullContent,
                    `AGENT:${selectedModel}`,
                    agentSelection.reasoning,
                    getCurrentTimestamp()
                ]
            );

            // Send final message
            res.write(`event: assistant_message\ndata: ${JSON.stringify({
                id: assistantMessageId,
                role: 'assistant',
                agent: selectedModel,
                content: fullContent,
                moderationInfo: agentSelection,
                created_at: getCurrentTimestamp()
            })}\n\n`);

            // Send done event
            res.write(`event: done\ndata: {}\n\n`);
        } catch (error) {
            console.error('Ollama streaming error:', error);
            res.write(`event: error\ndata: ${JSON.stringify({
                content: 'Error al procesar tu mensaje. Por favor, intenta nuevamente.',
                error: error instanceof Error ? error.message : String(error)
            })}\n\n`);
            res.write(`event: done\ndata: {}\n\n`);
        }

        res.end();
    } catch (error) {
        console.error('Send message error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: 'Failed to send message'
            });
        }
    }
}
