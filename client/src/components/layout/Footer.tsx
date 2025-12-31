import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="w-full" style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            marginTop: 'auto',
            padding: 'var(--spacing-xl) 0',
            // background: transparent
        }}>
            <div className="container flex items-center justify-between">
                <p className="text-secondary caption">
                    © {new Date().getFullYear()} Adán. Hecho con ❤️ para constructores.
                </p>

                <div className="flex items-center gap-md">
                    <a href="#" className="text-muted hover:text-white transition-colors">
                        <Github size={18} />
                    </a>
                    <a href="#" className="text-muted hover:text-white transition-colors">
                        <Twitter size={18} />
                    </a>
                    <a href="#" className="text-muted hover:text-white transition-colors">
                        <Linkedin size={18} />
                    </a>
                </div>
            </div>
        </footer>
    );
}
