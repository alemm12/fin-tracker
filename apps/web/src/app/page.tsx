export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-4">Financial Tracker</h1>
      </div>
      <div className="mt-8 max-w-2xl text-center">
        <p className="text-lg text-gray-600 mb-4">
          Track your expenses, manage budgets, and take control of your finances.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Login
          </a>
          <a
            href="/register"
            className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition"
          >
            Sign Up
          </a>
        </div>
      </div>
    </main>
  );
}
