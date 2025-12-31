/**
 * Ollama Integration Service
 * Handles AI agent selection, EDEN framework, and streaming responses
 */

import { getSystemPromptForLevel } from './edenPrompts';

// OLLAMA_BASE_URL will be read dynamically from process.env on each request
// to ensure environment variables are loaded correctly
const getOllamaUrl = () => process.env.OLLAMA_BASE_URL || 'https://x1rspglhz3krhh-11434.proxy.runpod.net';
const getChatEndpoint = () => `${getOllamaUrl()}/api/chat`;

export interface AgentSelectionResult {
    agents: string[];
    reasoning: string;
    primary_agent: string;
    eden_level: string;
    deliverables: string[];
}

/**
 * Extract mentioned agents from message (@agent_name)
 */
export function extractMentionedAgents(message: string): string[] {
    const mentionedAgents: string[] = [];
    const agentMentions = message.match(/@(\w+)/g);

    if (agentMentions) {
        agentMentions.forEach(mention => {
            const agentName = mention.substring(1); // Remove '@'
            mentionedAgents.push(agentName);
        });
    }

    return mentionedAgents;
}

/**
 * Determine agents based on EDEN framework keywords
 */
export function determineAgentsByContent(message: string): AgentSelectionResult {
    const lowerMessage = message.toLowerCase();

    // Nivel 1 - El Dolor
    if (lowerMessage.includes('validar') || lowerMessage.includes('idea') ||
        lowerMessage.includes('problema') || lowerMessage.includes('dolor')) {
        return {
            agents: ['gpt-oss'],
            reasoning: 'Validación de idea de negocio - Nivel 1 EDEN',
            primary_agent: 'gpt-oss',
            eden_level: 'E - Exploración',
            deliverables: ['DIAGNOSTICO_DOLOR.pdf', 'SCORE_OPORTUNIDAD.pdf']
        };
    }

    // Nivel 2 - La Solución
    if (lowerMessage.includes('diseñar') || lowerMessage.includes('solución') ||
        lowerMessage.includes('producto') || lowerMessage.includes('ux')) {
        return {
            agents: ['gpt-oss'],
            reasoning: 'Diseño de solución - Nivel 2 EDEN',
            primary_agent: 'gpt-oss',
            eden_level: 'D - Definición',
            deliverables: ['PROPUESTA_SOLUCION.pdf', 'MATRIZ_DIFERENCIACION.pdf']
        };
    }

    // Nivel 3 - Plan de Negocio
    if (lowerMessage.includes('plan') || lowerMessage.includes('negocio') ||
        lowerMessage.includes('constituir') || lowerMessage.includes('legal')) {
        return {
            agents: ['gpt-oss'],
            reasoning: 'Plan de negocio y constitución - Nivel 3 EDEN',
            primary_agent: 'gpt-oss',
            eden_level: 'E - Estructuración',
            deliverables: ['PLAN_NEGOCIO.pdf', 'BUSINESS_MODEL_CANVAS.pdf']
        };
    }

    // Nivel 4 - MVP Funcional
    if (lowerMessage.includes('mvp') || lowerMessage.includes('desarrollar') ||
        lowerMessage.includes('código') || lowerMessage.includes('web') ||
        lowerMessage.includes('landing') || lowerMessage.includes('sitio') ||
        lowerMessage.includes('página') || lowerMessage.includes('html') ||
        lowerMessage.includes('css') || lowerMessage.includes('frontend')) {
        return {
            agents: ['claude-opus-4-5-20251101'],
            reasoning: 'Desarrollo de MVP - Nivel 4 EDEN (Claude Opus 4.5)',
            primary_agent: 'claude-opus-4-5-20251101',
            eden_level: 'N - Navegación',
            deliverables: ['MVP_WEB_FUNCIONAL.zip', 'DOCUMENTACION_TECNICA.pdf']
        };
    }

    // Nivel 5 - Validación de Mercado
    if (lowerMessage.includes('mercado') || lowerMessage.includes('validar') ||
        lowerMessage.includes('métricas') || lowerMessage.includes('feedback')) {
        return {
            agents: ['gpt-oss'],
            reasoning: 'Validación de mercado - Nivel 5 EDEN',
            primary_agent: 'gpt-oss',
            eden_level: 'E - Escalamiento', // Mapping "Validación" to generic Escalamiento/Growth for now as prompt only has 5 keys
            deliverables: ['INFORME_VALIDACION.pdf', 'METRICAS_SATISFACCION.pdf']
        };
    }

    // Nivel 6 - Proyección y Estrategia
    if (lowerMessage.includes('inversión') || lowerMessage.includes('crecer') ||
        lowerMessage.includes('escalar') || lowerMessage.includes('financiero')) {
        return {
            agents: ['gpt-oss'],
            reasoning: 'Estrategia de crecimiento e inversión - Nivel 6 EDEN',
            primary_agent: 'gpt-oss',
            eden_level: 'E - Escalamiento',
            deliverables: ['PROYECCION_FINANCIERA.pdf', 'PLAN_CAPTACION_INVERSION.pdf']
        };
    }

    // Nivel 7 - Lanzamiento Real
    if (lowerMessage.includes('lanzar') || lowerMessage.includes('lanzamiento') ||
        lowerMessage.includes('producción') || lowerMessage.includes('operativo')) {
        return {
            agents: ['gpt-oss'],
            reasoning: 'Lanzamiento al mercado - Nivel 7 EDEN',
            primary_agent: 'gpt-oss',
            eden_level: 'E - Escalamiento',
            deliverables: ['STARTUP_ACTIVA.pdf', 'PLAN_MARKETING.pdf']
        };
    }

    // Default - General query
    return {
        agents: ['gpt-oss'],
        reasoning: 'Consulta general - Agente principal ADÁN',
        primary_agent: 'gpt-oss',
        eden_level: 'E - Exploración', // Default to Level 1 if unsure
        deliverables: ['RESPUESTA_GENERAL.pdf']
    };
}

/**
 * Select agents based on mentions or content   
 */
export function selectAgents(message: string): AgentSelectionResult {
    const availableModels = [
        'gpt-oss', 'eva_vpmarketing', 'tita_vp_administrativo',
        'dany_tecnicocloud', 'ethan_soporte', 'vito_fullstack', 'andu_mentora',
        'luna_inversionista', 'liam_inversionista', 'diego_inversionista',
        'milo_documentador', 'claude-opus-4-5-20251101'
    ];

    // Check for explicit mentions
    const mentionedAgents = extractMentionedAgents(message);

    if (mentionedAgents.length > 0) {
        const selectedAgents = mentionedAgents.filter(agent =>
            availableModels.includes(agent)
        );

        if (selectedAgents.length > 0) {
            return {
                agents: selectedAgents,
                reasoning: `Agentes seleccionados por menciones explícitas: ${selectedAgents.join(', ')}`,
                primary_agent: selectedAgents[0],
                eden_level: 'Consulta Específica',
                deliverables: ['RESPUESTA_ESPECIFICA.pdf']
            };
        }
    }

    // No explicit mentions, use EDEN framework
    return determineAgentsByContent(message);
}

/**
 * Remove <think>...</think> tags from model response
 */
export function filterThinkTags(content: string): string {
    // Remove everything between <think> and </think> including the tags
    return content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

/**
 * Stream chat response from Ollama
 * Returns an async generator that yields SSE formatted strings
 */
export async function* streamOllamaResponse(
    model: string,
    messages: Array<{ role: string; content: string }>,
    edenLevel?: string
): AsyncGenerator<{ type: 'chunk' | 'signal' | 'thinking'; content?: string; data?: any }> {
    try {
        // Get system prompt based on EDEN level
        const systemPrompt = getSystemPromptForLevel(edenLevel);

        // Prepend system message to conversation
        const fullMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const chatEndpoint = getChatEndpoint();

        // Debug: Log critical connection details
        console.log('--- OLLAMA REQUEST DEBUG ---');
        console.log(`Configured BASE_URL: ${getOllamaUrl()}`);
        console.log(`Target Endpoint: ${chatEndpoint}`);
        console.log(`Requested Model: ${model}`);
        console.log('----------------------------');

        const response = await fetch(chatEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages: fullMessages,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('No response body from Ollama');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = ''; // Buffer for partial lines
        let fullContent = '';
        let hasFoundThinkEnd = false;
        let contentAfterThink = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // Append new chunk to buffer
            buffer += decoder.decode(value, { stream: true });

            // Split by newline
            const lines = buffer.split('\n');

            // Keep the last line in the buffer as it might be incomplete
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                try {
                    const jsonResponse = JSON.parse(trimmedLine);
                    const chunkContent = jsonResponse?.message?.content || '';

                    fullContent += chunkContent;

                    // Initial state check: Do we have visible thought tags?
                    // We only block streaming if we detect the start of a thought
                    const hasStartedThinking = fullContent.trimStart().startsWith('<think>');

                    if (!hasFoundThinkEnd && hasStartedThinking) {
                        // We are potentially inside a thought block
                        const thinkEndMatch = fullContent.match(/<\/think>/);

                        if (thinkEndMatch) {
                            hasFoundThinkEnd = true;
                            const thinkEndIndex = fullContent.indexOf('</think>') + 8; // 8 is length of </think>
                            contentAfterThink = fullContent.substring(thinkEndIndex);

                            // Flush any content that appeared after the closing tag
                            if (contentAfterThink) {
                                yield { type: 'chunk', content: contentAfterThink };
                            }
                        } else {
                            // Still inside thought block and haven't found end
                            yield { type: 'thinking' };
                        }
                    } else {
                        // Not a thought block, or we already finished thinking
                        // We need to yield the content.
                        // If we decided this wasn't a thought block after some buffering, we might need to catch up?
                        // Actually, since we yield chunk-by-chunk in the 'else', we just yield current chunkContent
                        // UNLESS we just switched from 'thinking-check' to 'not-thinking'.
                        // But since we check startsWith('<think>') on the full message every time until decided...
                        // Wait, if chunk 1 is "Hel" (no <think>), we fall here and yield "Hel".
                        // Chunk 2 "lo", full="Hello", falls here, yields "lo".
                        // This works perfect for non-thinking models.

                        // What if chunk 1 is " <" (ambiguous)?
                        // fullContent=" <". startsWith('<think>') is false.
                        // We yield " <".
                        // Chunk 2 "think>". full=" <think>". startsWith is NOW true.
                        // But we already yielded " <".
                        // This acts as a leak.

                        // To be perfectly safe, we should buffer a tiny bit at the very start?
                        // Or just accept that if the tokens come awkwardly split exactly at "<think>", we might bleed a bracket.
                        // Given standard tokenzation, "<think>" often comes as one token or specifically.

                        // For now, simpler logic:
                        // If hasFoundThinkEnd is true -> We are past thoughts, just yield chunkContent (which filters invalidly? no, chunkContent is raw).
                        // Wait: contentAfterThink logic used `+= chunkContent`.

                        if (hasFoundThinkEnd) {
                            contentAfterThink += chunkContent;
                            yield { type: 'chunk', content: chunkContent };
                        } else {
                            // We are in the "start" phase but it doesn't look like thinking
                            // Just yield the chunk.
                            // NOTE: If we later realize it WAS thinking (delayed <think>), it's too late, we already leaked.
                            // That's acceptable for now to ensure we don't BLOCK valid text.
                            yield { type: 'chunk', content: chunkContent };
                        }
                    }

                    // Final content check (if done)
                    if (jsonResponse.done) {
                        // FAILSAFE: If we were "thinking" but never found the end, flush the raw content
                        // to prevent an empty message bubble.
                        if (!hasFoundThinkEnd && hasStartedThinking && fullContent.length > 0) {
                            // Clean up the tags so it looks slightly better
                            const recoveredContent = fullContent.replace('<think>', '').replace('</think>', '').trim();
                            if (recoveredContent) {
                                yield { type: 'chunk', content: recoveredContent };
                            }
                        }

                        // Deliverable check logic is already handled below, just ensure we strictly follow logic
                        // The deliverable check needs to operate on the *full* content received so far,
                        // or specifically the content that was meant to be displayed to the user.
                        // Given the new streaming, `contentAfterThink` holds the user-facing part.
                        const finalUserContent = hasFoundThinkEnd
                            ? contentAfterThink
                            : fullContent; // Use fullContent if we never found a thought block

                        console.log('[OllamaService] Final content length:', finalUserContent.length);

                        // Ultra-loose regex: Find { ... "deliverable_ready": true ... } ANYWHERE
                        const jsonMatch = finalUserContent.match(/(\{[\s\S]*?"deliverable_ready"\s*:\s*true[\s\S]*?\})/);

                        if (jsonMatch) {
                            console.log('[OllamaService] ✅ Deliverable JSON detected!');
                            console.log('[OllamaService] Raw JSON:', jsonMatch[1].substring(0, 300));

                            let deliverableData: any = {};
                            try {
                                deliverableData = JSON.parse(jsonMatch[1]);
                                console.log('[OllamaService] ✅ JSON parsed successfully.');
                                console.log('[OllamaService] Content length:', deliverableData.deliverable_content?.length || 0);
                            } catch (e) {
                                console.warn('[OllamaService] ❌ JSON Parse failed, using regex recovery...', e);
                                const rawJson = jsonMatch[1];

                                const titleMatch = rawJson.match(/"deliverable_title"\s*:\s*"([^"]+)"/);
                                // More aggressive content extraction - grab everything between quotes after deliverable_content
                                const contentMatch = rawJson.match(/"deliverable_content"\s*:\s*"((?:[^"\\]|\\.)*)"/);

                                if (titleMatch) {
                                    deliverableData.deliverable_title = titleMatch[1];
                                    console.log('[OllamaService] Recovered title:', titleMatch[1]);
                                }
                                if (contentMatch) {
                                    deliverableData.deliverable_content = contentMatch[1]
                                        .replace(/\\n/g, '\n')
                                        .replace(/\\"/g, '"')
                                        .replace(/\\\\/g, '\\');
                                    console.log('[OllamaService] Recovered content length:', deliverableData.deliverable_content.length);
                                }
                                deliverableData.deliverable_ready = true;
                            }

                            try {
                                if (deliverableData.deliverable_title) {
                                    /* eslint-disable @typescript-eslint/no-var-requires */
                                    const { generateDeliverablePDF } = require('./pdfService');
                                    const fs = require('fs');
                                    const path = require('path');
                                    /* eslint-enable @typescript-eslint/no-var-requires */

                                    const contentToRender = deliverableData.deliverable_content;
                                    console.log(`[OllamaService] 📄 Generating PDF. Content preview: ${contentToRender ? contentToRender.substring(0, 100) : 'EMPTY!'}`);

                                    const pdfBuffer = await generateDeliverablePDF(
                                        deliverableData.deliverable_title,
                                        contentToRender || 'ERROR: El contenido del entregable no se pudo extraer. Regenera la respuesta.'
                                    );

                                    const tempDir = path.join(process.cwd(), 'temp');
                                    if (!fs.existsSync(tempDir)) {
                                        fs.mkdirSync(tempDir, { recursive: true });
                                    }

                                    const safeFilename = deliverableData.deliverable_title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
                                    const outputPath = path.join(tempDir, safeFilename);

                                    fs.writeFileSync(outputPath, pdfBuffer);
                                    console.log(`[OllamaService] ✅ PDF saved: ${outputPath}`);

                                    deliverableData.deliverable_title = safeFilename;
                                }

                                yield { type: 'signal', data: deliverableData };
                            } catch (e) {
                                console.warn('[OllamaService] ❌ Failed to generate PDF', e);
                            }
                        } else {
                            console.log('[OllamaService] ⚠️ No deliverable JSON detected in message.');
                        }
                    }

                } catch (parseError) {
                    // It's possible a line is still malformed or we have a weird chunk, log but don't crash
                    console.warn('Error parsing JSON line in stream:', parseError);
                }
            }
        }
    } catch (error) {
        console.error('Ollama streaming error:', error);
        throw error;
    }
}
