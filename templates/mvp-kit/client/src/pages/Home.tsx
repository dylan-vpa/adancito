import React from 'react';

export function Home() {
    return (
        <div className="grid gap-6">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary-light to-primary border border-white/10">
                <h1 className="text-3xl font-bold mb-4">Welcome to your MVP</h1>
                <p className="text-gray-400 text-lg max-w-2xl">
                    This is your standardized application base. Adán has prepared this environment to be the foundation for your project.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl bg-primary-light border border-white/10">
                    <h3 className="font-semibold mb-2 text-accent">Authentication Ready</h3>
                    <p className="text-sm text-gray-400">Login, Register, and Session management are pre-configured.</p>
                </div>
                <div className="p-6 rounded-xl bg-primary-light border border-white/10">
                    <h3 className="font-semibold mb-2 text-purple-400">Database Connected</h3>
                    <p className="text-sm text-gray-400">SQLite/Prisma setup is ready for your data models.</p>
                </div>
                <div className="p-6 rounded-xl bg-primary-light border border-white/10">
                    <h3 className="font-semibold mb-2 text-green-400">Docker Optimized</h3>
                    <p className="text-sm text-gray-400">Ready to deploy instantly with standard container configuration.</p>
                </div>
            </div>
        </div>
    );
}
