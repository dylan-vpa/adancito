import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, ChevronDown } from 'lucide-react';
import type { Agent } from '../../types';

// Available agents organized by category
const AGENT_GROUPS: Record<string, Agent[]> = {
    'Leadership': [
        { id: 'Modelfile_Adan_CEO', title: 'CEO & Strategy', modelName: 'gpt-oss', category: 'Leadership' },
        { id: 'eva_vpmarketing', title: 'Marketing', modelName: 'gpt-oss', category: 'Leadership' },
    ],
    'Engineering': [
        { id: 'vito_fullstack', title: 'Full Stack', modelName: 'gpt-oss', category: 'Engineering' },
        { id: 'dany_tecnicocloud', title: 'Cloud & DevOps', modelName: 'gpt-oss', category: 'Engineering' },
        { id: 'ethan_soporte', title: 'Tech Support', modelName: 'gpt-oss', category: 'Engineering' },
    ],
    'Design': [
        { id: 'Modelfile_GER_DE_Elsy', title: 'UX/UI Designer', modelName: 'gpt-oss', category: 'Design' },
        { id: 'Modelfile_GER_DE_Bella', title: 'Graphic Designer', modelName: 'gpt-oss', category: 'Design' },
    ],
};

interface ChatInputProps {
    onSendMessage: (content: string, model?: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENT_GROUPS['Leadership'][0]);
    const [isListening, setIsListening] = useState(false);
    const [showAgentSelector, setShowAgentSelector] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
            textareaRef.current.style.height = newHeight + 'px';
        }
    }, [message]);

    // Voice recognition setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'es-ES';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('');
                setMessage(transcript);
            };

            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onerror = () => setIsListening(false);
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const handleSubmit = () => {
        if (!message.trim() || disabled) return;
        onSendMessage(message.trim(), selectedAgent.modelName);
        setMessage('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            {/* Agent selector dropdown */}
            {showAgentSelector && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 999,
                        }}
                        onClick={() => setShowAgentSelector(false)}
                    />
                    <div
                        className="card"
                        style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-sm)',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            minWidth: '280px',
                            zIndex: 1000,
                        }}
                    >
                        {Object.entries(AGENT_GROUPS).map(([category, agents]) => (
                            <div key={category} style={{ marginBottom: 'var(--spacing-md)' }}>
                                <div className="caption font-medium text-accent" style={{ marginBottom: 'var(--spacing-xs)', paddingLeft: 'var(--spacing-sm)' }}>
                                    {category}
                                </div>
                                {agents.map((agent) => (
                                    <button
                                        key={agent.id}
                                        className="btn btn-ghost w-full"
                                        style={{
                                            justifyContent: 'flex-start',
                                            fontSize: 'var(--font-size-caption)',
                                            backgroundColor: selectedAgent.id === agent.id ? 'var(--color-primary-elevated)' : 'transparent'
                                        }}
                                        onClick={() => {
                                            setSelectedAgent(agent);
                                            setShowAgentSelector(false);
                                        }}
                                    >
                                        {agent.title}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modern inline input */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 'var(--spacing-sm)',
                    backgroundColor: 'var(--color-primary-elevated)',
                    borderRadius: 'var(--radius-large)',
                    padding: 'var(--spacing-sm)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
            >
                {/* Agent selector button */}
                <button
                    onClick={() => setShowAgentSelector(!showAgentSelector)}
                    disabled={disabled}
                    className="btn btn-ghost"
                    style={{
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        fontSize: 'var(--font-size-caption)',
                        whiteSpace: 'nowrap',
                        minHeight: '36px',
                    }}
                    title={selectedAgent.title}
                >
                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedAgent.title}
                    </span>
                    <ChevronDown size={14} style={{ marginLeft: 'var(--spacing-xs)' }} />
                </button>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Pregunta a ${selectedAgent.title}...`}
                    disabled={disabled}
                    style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-neutral-white)',
                        fontSize: 'var(--font-size-body)',
                        fontFamily: 'var(--font-primary)',
                        resize: 'none',
                        outline: 'none',
                        minHeight: '36px',
                        maxHeight: '200px',
                        padding: 'var(--spacing-xs) 0',
                    }}
                    rows={1}
                />

                {/* Voice button */}
                {recognitionRef.current && (
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={disabled}
                        className="btn btn-ghost"
                        style={{
                            padding: 'var(--spacing-xs)',
                            minHeight: '36px',
                            minWidth: '36px',
                            backgroundColor: isListening ? 'var(--color-accent-green-main)' : 'transparent',
                            color: isListening ? 'var(--color-primary-main)' : 'inherit',
                        }}
                        title={isListening ? 'Detener grabación' : 'Grabar voz'}
                    >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                )}

                {/* Send button */}
                <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || disabled}
                    className="btn btn-primary"
                    style={{
                        padding: 'var(--spacing-xs)',
                        minHeight: '36px',
                        minWidth: '36px',
                        borderRadius: 'var(--radius-medium)',
                    }}
                    title="Enviar mensaje"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
