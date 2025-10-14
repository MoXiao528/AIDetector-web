<template>
  <header class="sticky top-0 z-40 backdrop-blur border-b border-slate-200/60 bg-white/70">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <a href="#" class="flex items-center space-x-2">
          <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white font-semibold">V</span>
          <span class="text-lg font-semibold tracking-tight text-slate-900">Veritascribe</span>
        </a>
        <nav class="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#capabilities" class="hover:text-slate-900">功能概览</a>
          <a href="#workflow" class="hover:text-slate-900">工作流</a>
          <a href="#showcase" class="hover:text-slate-900">应用场景</a>
          <a href="#pricing" class="hover:text-slate-900">定价</a>
          <a href="#faq" class="hover:text-slate-900">常见问题</a>
        </nav>
        <div class="hidden md:flex items-center space-x-3">
          <a href="#" class="text-sm font-medium text-slate-600 hover:text-slate-900">登录</a>
          <a
            href="#trial"
            class="inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500"
          >
            免费体验
          </a>
        </div>
        <button class="md:hidden inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600">
          <span class="sr-only">打开菜单</span>
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.75h16.5M3.75 12h16.5m-16.5 6.25h16.5" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>
