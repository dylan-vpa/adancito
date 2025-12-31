import Anthropic from '@anthropic-ai/sdk';
import { getSystemPromptForLevel } from './edenPrompts';

/**
 * Stream chat response from Claude via Anthropic SDK
 * Returns an async generator that yields SSE formatted chunks
 */
export async function* streamClaudeResponse(
    model: string,
    messages: Array<{ role: string; content: string }>,
    edenLevel?: string
): AsyncGenerator<{ type: 'chunk' | 'signal' | 'thinking'; content?: string; data?: any }> {
    try {
        console.log(`[AnthropicService] Initializing stream for model: ${model}, Level: ${edenLevel}`);

        const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
        if (!apiKey) {
            console.error('[AnthropicService] ❌ Missing ANTHROPIC_API_KEY in environment variables');
            throw new Error('Configuration Error: Missing ANTHROPIC_API_KEY');
        }

        // Initialize Anthropic client per request to ensure env vars are loaded
        const anthropic = new Anthropic({
            apiKey: apiKey
        });

        // Get system prompt based on EDEN level
        const systemPrompt = getSystemPromptForLevel(edenLevel);

        // Anthropic SDK expects system prompt as a separate parameter, not in messages array
        // And roles must be 'user' or 'assistant' strictly.
        console.log(`[AnthropicService] Using System Prompt (Preview): ${systemPrompt.substring(0, 200)}...`);
        const validMessages = messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
        }));

        console.log(`[AnthropicService] Sending request to Claude...`);

        const stream = await anthropic.messages.create({
            model: model, // e.g., 'claude-3-5-sonnet-20240620'
            max_tokens: 16384,
            system: systemPrompt,
            messages: validMessages,
            stream: true,
        });

        let fullContent = '';
        let isInJsonBlock = false;

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const chunkContent = event.delta.text;
                fullContent += chunkContent;

                // JSON HIDING LOGIC (Copied from ollamaService)
                // Check if we're entering a JSON block
                if (!isInJsonBlock) {
                    const jsonStartMarkers = ['```json', '{"deliverable_ready"', '{ "deliverable_ready"'];
                    for (const marker of jsonStartMarkers) {
                        if (fullContent.includes(marker)) {
                            isInJsonBlock = true;
                            console.log('[AnthropicService] JSON block detected - hiding from stream');

                            // Send "generating" card
                            yield {
                                type: 'chunk',
                                content: `\`\`\`status-card\n${JSON.stringify({ status: 'generating', message: 'Construyendo documento oficial con Claude...' })}\n\`\`\``
                            };
                            break;
                        }
                    }
                }

                // If NOT in JSON block, yield content to user
                if (!isInJsonBlock) {
                    yield { type: 'chunk', content: chunkContent };
                }
            }
        }

        // Final Deliverable Check (Post-stream)
        console.log('[AnthropicService] Stream complete. Final content length:', fullContent.length);

        // Loose regex to find the deliverable JSON
        const jsonMatch = fullContent.match(/(\{[\s\S]*?"deliverable_ready"\s*:\s*true[\s\S]*?\})/);

        if (jsonMatch) {
            console.log('[AnthropicService] ✅ Deliverable JSON detected!');

            let deliverableData: any = {};
            try {
                // Try clean parse first
                deliverableData = JSON.parse(jsonMatch[1]);
            } catch (e) {
                console.warn('[AnthropicService] ❌ JSON Parse failed, using regex recovery...', e);
                const rawJson = jsonMatch[1];
                const titleMatch = rawJson.match(/"deliverable_title"\s*:\s*"([^"]+)"/);
                const contentMatch = rawJson.match(/"deliverable_content"\s*:\s*"((?:[^"\\]|\\.)*)"/);

                if (titleMatch) deliverableData.deliverable_title = titleMatch[1];
                if (contentMatch) {
                    deliverableData.deliverable_content = contentMatch[1]
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\');
                }
                deliverableData.deliverable_ready = true;
            }

            // PDF Generation
            if (deliverableData.deliverable_title) {
                try {
                    /* eslint-disable @typescript-eslint/no-var-requires */
                    const { generateDeliverablePDF } = require('./pdfService');
                    const fs = require('fs');
                    const path = require('path');
                    /* eslint-enable */

                    console.log(`[AnthropicService] 📄 Generating PDF with title: ${deliverableData.deliverable_title}`);

                    const pdfBuffer = await generateDeliverablePDF(
                        deliverableData.deliverable_title,
                        deliverableData.deliverable_content || 'ERROR: Sin contenido.'
                    );

                    const tempDir = path.join(process.cwd(), 'temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                    const safeFilename = deliverableData.deliverable_title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
                    const outputPath = path.join(tempDir, safeFilename);

                    fs.writeFileSync(outputPath, pdfBuffer);
                    console.log(`[AnthropicService] ✅ PDF saved: ${outputPath}`);

                    // Normalize title to filename for client to find it
                    deliverableData.deliverable_title = safeFilename;

                    yield { type: 'signal', data: deliverableData };

                } catch (pdfError) {
                    console.error('[AnthropicService] PDF Generation failed:', pdfError);
                }
            }
        }

    } catch (error) {
        console.error('[AnthropicService] Error in stream:', error);
        throw error;
    }
}
