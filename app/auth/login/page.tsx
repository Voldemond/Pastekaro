'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpForm, setHelpForm] = useState({
        name: '',
        email: '',
        issueType: '',
        message: ''
    });

    useEffect(() => {
        if (searchParams.get('registered') === 'true') {
            setSuccess('Account created! Welcome to PasteKaro');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const emailDone = formData.email.includes('@');
    const passwordDone = formData.password.length >= 6;
    const canSubmit = emailDone && passwordDone && !loading;

    const handleSendToWhatsApp = () => {
        const phone = '919284638487'; // Replace with your WhatsApp number
        const message = `*Issue Report from PasteKaro Login*\n\nName: ${helpForm.name}\nEmail: ${helpForm.email}\n\nIssue Type: ${helpForm.issueType}\n\nMessage: ${helpForm.message}`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        setShowHelpModal(false);
        setHelpForm({ name: '', email: '', issueType: '', message: '' });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
            {/* Help Button - Fixed position */}
            <button
                onClick={() => setShowHelpModal(true)}
                className="fixed bottom-6 right-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg border border-slate-700 transition-colors z-50"
            >
                Help
            </button>

            {/* Help Modal */}
            {showHelpModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-100">Need Help?</h3>
                            <button
                                onClick={() => setShowHelpModal(false)}
                                className="text-slate-500 hover:text-slate-400"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-sm text-slate-400 mb-4">
                            Having trouble logging in? Let us know and we'll help you out!
                        </p>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Your name
                                </label>
                                <input
                                    type="text"
                                    value={helpForm.name}
                                    onChange={(e) => setHelpForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950/50 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-600"
                                    placeholder="Your full name"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Your email
                                </label>
                                <input
                                    type="email"
                                    value={helpForm.email}
                                    onChange={(e) => setHelpForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950/50 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-600"
                                    placeholder="you@example.com"
                                />
                            </div>

                            {/* Issue Type */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    What's the issue?
                                </label>
                                <select
                                    value={helpForm.issueType}
                                    onChange={(e) => setHelpForm(prev => ({ ...prev, issueType: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950/50 text-slate-100 text-sm focus:outline-none focus:border-slate-600"
                                >
                                    <option value="">Select an issue</option>
                                    <option value="Forgot Password">Forgot Password</option>
                                    <option value="Can't Login">Can't Login</option>
                                    <option value="Account Not Found">Account Not Found</option>
                                    <option value="Technical Issue">Technical Issue</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Describe your issue
                                </label>
                                <textarea
                                    value={helpForm.message}
                                    onChange={(e) => setHelpForm(prev => ({ ...prev, message: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950/50 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-600 resize-none"
                                    rows={4}
                                    placeholder="Tell us what's happening..."
                                />
                            </div>

                            {/* Send Button */}
                            <button
                                onClick={handleSendToWhatsApp}
                                disabled={!helpForm.name || !helpForm.email || !helpForm.issueType || !helpForm.message}
                                className="w-full py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Send to WhatsApp
                            </button>

                            <div className="text-xs text-slate-500 text-center">
                                We'll respond as soon as possible
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-16 items-center">
                {/* Left: Welcome back message */}
                <div className="flex-1 text-slate-100 space-y-6 max-w-xl">
                    <div>
                        <h1 className="text-4xl font-bold mb-3">
                            Welcome back, creator ✨
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Your pastes are waiting for you. Step back into your organized space.
                        </p>
                    </div>

                    <div className="space-y-3 pt-4 text-sm text-slate-300">
                        <div className="flex items-start gap-3">
                            <span className="text-lg">🔐</span>
                            <div>
                                <div className="font-medium mb-0.5">Safe & Secure</div>
                                <div className="text-slate-500">Your pastes stay private and encrypted</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-lg">⚡</span>
                            <div>
                                <div className="font-medium mb-0.5">Pick Up Where You Left</div>
                                <div className="text-slate-500">All your collections, right where you left them</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-lg">🎯</span>
                            <div>
                                <div className="font-medium mb-0.5">Instant Access</div>
                                <div className="text-slate-500">One login, unlimited possibilities</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Login Form */}
                <div className="flex-1 max-w-md w-full">
                    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-slate-100 mb-1">
                                Back to brilliance
                            </h2>
                            <p className="text-sm text-slate-500">
                                Log in to access your dashboard
                            </p>
                        </div>

                        {/* Success message */}
                        {success && (
                            <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                                {success}
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    Remind us who you are
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
                                    Your secret key to unlock
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-950/50 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-slate-600 transition-colors"
                                    placeholder="Your password"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                                    }
                                />
                                <div className="text-xs text-slate-600 mt-1.5">
                                    Strong or simple, it's yours
                                </div>
                            </div>
                        </div>

                        {/* Forgot password */}
                        <div className="mt-4 text-right">
                            <button
                                type="button"
                                onClick={() => alert('Please use the Help button below to reset your password 👇')}
                                className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                            >
                                Forgot your key? Click Help for assistance
                            </button>
                        </div>

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="mt-6 w-full py-3 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: canSubmit ? '#6366F1' : '#374151',
                            }}
                        >
                            {loading ? 'Unlocking your space...' : 'Take me back in 🚀'}
                        </button>

                        <div className="mt-5 text-center text-xs text-slate-500">
                            Don't have an account?{' '}
                            <Link href="/auth/signup" className="text-slate-400 hover:text-slate-300">
                                Sign up
                            </Link>
                        </div>

                        {/* Security reassurance */}
                        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
                            <div className="text-xs text-slate-600 flex items-center justify-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Your pastes stay safe and private
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Loading...</div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}