'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type PersonaKey = 'unknown' | 'developer' | 'student' | 'team' | 'general';

export default function SignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detectedPersona, setDetectedPersona] = useState<PersonaKey>('unknown');

    // Persona detection
    useEffect(() => {
        const email = formData.email.toLowerCase();
        const name = formData.name.toLowerCase();

        let persona: PersonaKey = 'unknown';
        if (
            email.includes('github') ||
            email.includes('dev') ||
            name.includes('dev') ||
            name.includes('engineer')
        ) {
            persona = 'developer';
        } else if (email.includes('.edu') || email.includes('student') || name.includes('student')) {
            persona = 'student';
        } else if (email.includes('team') || email.includes('admin') || email.includes('manager')) {
            persona = 'team';
        } else if (formData.email.includes('@') && formData.name.length > 2) {
            persona = 'general';
        }
        setDetectedPersona(persona);
    }, [formData.email, formData.name]);

    const personas = {
        unknown: { color: '#6366F1' },
        developer: { color: '#3B82F6' },
        student: { color: '#10B981' },
        team: { color: '#8B5CF6' },
        general: { color: '#6366F1' },
    };

    const currentPersona = personas[detectedPersona];

    const nameDone = formData.name.trim().length > 1;
    const emailDone = formData.email.includes('@');
    const passwordDone = formData.password.length >= 6;

    const stepsCompleted =
        (nameDone ? 1 : 0) + (emailDone ? 1 : 0) + (passwordDone ? 1 : 0);
    const progressPercent = (stepsCompleted / 3) * 100;

    const canSubmit = nameDone && emailDone && passwordDone && !loading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                // Success! Redirect to login
                router.push('/auth/login?registered=true');
            } else {
                setError(data.error || 'Signup failed');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-16 items-center">
                {/* Left: Clean messaging */}
                <div className="flex-1 text-slate-100 space-y-6 max-w-xl">
                    <div>
                        <h1 className="text-4xl font-bold mb-3">
                            Paste. Share. Done.
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Sign up to save your pastes, control privacy, and share instantly.
                        </p>
                    </div>

                    <div className="space-y-3 pt-4 text-sm text-slate-300">
                        <div className="flex items-start gap-3">
                            <span className="text-lg">📋</span>
                            <div>
                                <div className="font-medium mb-0.5">Paste & Share Instantly</div>
                                <div className="text-slate-500">Get a shareable link in seconds</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-lg">🔒</span>
                            <div>
                                <div className="font-medium mb-0.5">Private or Public</div>
                                <div className="text-slate-500">Control who sees your content</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-lg">☁️</span>
                            <div>
                                <div className="font-medium mb-0.5">Never Lose It</div>
                                <div className="text-slate-500">Saved securely in the cloud</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Form */}
                <div className="flex-1 max-w-md w-full">
                    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-slate-100 mb-1">Create Account</h2>
                            <p className="text-sm text-slate-500">Join thousands organizing their pastes</p>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Full name
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950/50 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-600 transition-colors"
                                    placeholder="Kunal More"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950/50 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-600 transition-colors"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950/50 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-600 transition-colors"
                                    placeholder="At least 6 characters"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                                    }
                                />
                                {formData.password && formData.password.length < 6 && (
                                    <div className="text-xs text-slate-500 mt-1.5">
                                        {6 - formData.password.length} more character{6 - formData.password.length > 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Simple progress */}
                        <div className="mt-6">
                            <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full transition-all duration-300"
                                    style={{
                                        width: `${progressPercent}%`,
                                        backgroundColor: currentPersona.color,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="mt-6 w-full py-3 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: canSubmit ? currentPersona.color : '#374151',
                            }}
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>

                        <div className="mt-5 text-center text-xs text-slate-500">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-slate-400 hover:text-slate-300">
                                Log in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}