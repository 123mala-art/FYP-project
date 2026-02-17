import React from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 text-white">
      {/* HERO */}
      <header className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl">
            <span className="text-2xl">&lt;/&gt;</span>
          </div>

          <h1 className="text-6xl font-extrabold leading-tight mb-4">DevStudio</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8">
            Your Ultimate Coding Playground
          </p>

          <p className="text-gray-300 mb-8 max-w-3xl mx-auto">
            Write, execute, and share code in multiple programming languages. Powered by AI assistance and professional tools.
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/editor')}
              className="px-6 py-3 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:scale-105 transition"
            >
              ⚡ Start Coding Now
            </button>

            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 rounded-md border border-white/20 text-white/90 hover:bg-white/5 transition"
            >
              🔐 Login / Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* STATS */}
      <section className="max-w-5xl mx-auto px-6 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-8 rounded-xl bg-white/5 border border-white/5">
            <div className="text-3xl mb-2">&lt;/&gt;</div>
            <div className="text-4xl font-bold">5+</div>
            <div className="text-gray-300 mt-1">Programming Languages</div>
          </div>

          <div className="p-8 rounded-xl bg-white/5 border border-white/5">
            <div className="text-3xl mb-2">&gt;_</div>
            <div className="text-4xl font-bold">∞</div>
            <div className="text-gray-300 mt-1">Lines of Code</div>
          </div>

          <div className="p-8 rounded-xl bg-white/5 border border-white/5">
            <div className="text-3xl mb-2">⚙️</div>
            <div className="text-4xl font-bold">100+</div>
            <div className="text-gray-300 mt-1">Active Users</div>
          </div>

          <div className="p-8 rounded-xl bg-white/5 border border-white/5">
            <div className="text-3xl mb-2">🗂️</div>
            <div className="text-4xl font-bold">1000+</div>
            <div className="text-gray-300 mt-1">Code Snippets</div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <h2 className="text-3xl font-bold text-center mb-6">Powerful Features</h2>
        <p className="text-center text-gray-300 mb-8">Everything you need to code efficiently</p>

        <div className="space-y-6">
          <div className="p-6 rounded-xl bg-white/4 border border-white/6">
            <div className="flex gap-4 items-start">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xl">&lt;/&gt;</div>
              <div>
                <h3 className="font-semibold text-lg">Multi-Language Support</h3>
                <p className="text-gray-300">Write and execute code in Python, C++, JavaScript, HTML &amp; CSS</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white/4 border border-white/6">
            <div className="flex gap-4 items-start">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xl">⚡</div>
              <div>
                <h3 className="font-semibold text-lg">Instant Execution</h3>
                <p className="text-gray-300">Run your code instantly with our powerful execution engine</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white/4 border border-white/6">
            <div className="flex gap-4 items-start">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-white text-xl">✨</div>
              <div>
                <h3 className="font-semibold text-lg">AI-Powered Assistant</h3>
                <p className="text-gray-300">Get intelligent coding help and suggestions</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white/4 border border-white/6">
            <div className="flex gap-4 items-start">
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xl">▶</div>
              <div>
                <h3 className="font-semibold text-lg">Professional Editor</h3>
                <p className="text-gray-300">Monaco editor with syntax highlighting and IntelliSense</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Nav pill */}
      <div className="fixed right-6 bottom-6">
        <div className="flex items-center gap-3 bg-white/5 rounded-full px-3 py-2 backdrop-blur-sm border border-white/6">
          <button onClick={() => navigate('/')} className="px-3 py-1 rounded-full bg-purple-500 text-white">Home</button>
          <button onClick={() => navigate('/login')} className="px-3 py-1 text-white/90">Login</button>
          <button onClick={() => navigate('/editor')} className="px-3 py-1 text-white/90">Editor</button>
        </div>
      </div>

      <footer className="mt-24 pb-8 text-center text-gray-400">
        © 2025 DevStudio - Final Year Project
      </footer>
    </div>
  );
}
