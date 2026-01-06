export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Eva Noir</h1>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
            Welcome to Eva Noir
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
            A modern web application built with Next.js, React, and Tailwind CSS.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="#features"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
            >
              Explore Features
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-slate-900 text-slate-900 font-medium hover:bg-slate-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-slate-950 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Fast & Modern</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Built with Next.js for optimal performance and excellent user experience.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Type Safe</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Full TypeScript support for robust and maintainable code.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-950 rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Styled with Care</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Beautiful UI powered by Tailwind CSS with dark mode support.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-slate-600 dark:text-slate-400">
            © {new Date().getFullYear()} Eva Noir. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
