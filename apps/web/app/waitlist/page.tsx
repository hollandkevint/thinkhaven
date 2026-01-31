export default function WaitlistPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md text-center p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're on the waitlist!
        </h1>
        <p className="text-gray-600 mb-6">
          Thanks for signing up for ThinkHaven beta. We're letting people in
          gradually to ensure everyone gets a great experience.
        </p>
        <p className="text-gray-600 mb-6">
          We'll email you when your spot opens up. This usually takes 1-3 days.
        </p>
        <div className="border-t border-gray-200 pt-6 mt-6">
          <p className="text-sm text-gray-500">
            Questions? Email{' '}
            <a
              href="mailto:kevin@kevintholland.com"
              className="text-blue-600 hover:underline"
            >
              kevin@kevintholland.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
