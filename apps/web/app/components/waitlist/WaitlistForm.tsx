'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    const { error } = await supabase
      .from('beta_access')
      .insert({ email: email.trim().toLowerCase(), source: 'landing_page' });

    if (error) {
      // Unique constraint violation = already on list
      if (error.code === '23505') {
        setStatus('success');
        setMessage("You're already on the list! We'll email you soon.");
      } else {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
        console.error('Waitlist signup error:', error);
      }
    } else {
      setStatus('success');
      setMessage("You're on the list! We'll email you when your spot opens up.");
      setEmail('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === 'loading'}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
        </button>
      </div>
      {message && (
        <p
          className={`text-sm mt-3 text-center ${
            status === 'error' ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
