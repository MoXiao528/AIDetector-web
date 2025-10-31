<template>
  <div class="min-h-screen bg-white">
    <AppHeader mode="marketing" />
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
      <aside class="w-full max-w-xs flex-shrink-0 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Documentation</p>
        <nav class="mt-4 space-y-2 text-sm font-semibold text-slate-600">
          <span class="flex items-center justify-between rounded-2xl bg-white px-4 py-2 text-slate-900 shadow-sm">
            Home
            <svg class="h-4 w-4 text-primary-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <button type="button" class="w-full rounded-2xl px-4 py-2 text-left transition hover:bg-white hover:text-slate-900">
            GPTZero API
          </button>
          <button type="button" class="w-full rounded-2xl px-4 py-2 text-left transition hover:bg-white hover:text-slate-900">
            Relevant Sources
          </button>
        </nav>
      </aside>
      <main class="flex-1 space-y-8">
        <section class="space-y-3">
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900">Welcome to the Veritascribe Developer Docs!</h1>
          <p class="text-sm leading-relaxed text-slate-600">
            Connect to Veritascribe’s APIs to detect AI-generated content with precision across documents, paragraphs, and sentences.
          </p>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">What you can build</h2>
          <ul class="mt-4 list-disc space-y-2 pl-6 text-sm text-slate-600">
            <li>Detect AI-generated text at document, paragraph, and sentence level</li>
            <li>Get probabilities and detailed statistics</li>
            <li>Run batched inference over several files</li>
          </ul>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Getting Started</h2>
          <ol class="mt-4 space-y-3 text-sm text-slate-600">
            <li>No need to create an account to try out the API — you can try it directly here for limited uses.</li>
            <li>1. Create an account at <a class="text-primary-600 underline-offset-2 hover:underline" href="https://app.gptzero.me" target="_blank" rel="noopener">https://app.gptzero.me</a></li>
            <li>2. Sign up for an API subscription plan at <a class="text-primary-600 underline-offset-2 hover:underline" href="https://app.gptzero.me/app/api-subscription" target="_blank" rel="noopener">https://app.gptzero.me/app/api-subscription</a></li>
            <li>3. Get your API key at <a class="text-primary-600 underline-offset-2 hover:underline" href="https://app.gptzero.me/app/api" target="_blank" rel="noopener">https://app.gptzero.me/app/api</a></li>
            <li>4. Visit the API docs to get ready-to-use code in 17+ languages.</li>
          </ol>
          <div class="mt-6 rounded-2xl border border-primary-200 bg-primary-50/70 p-4 text-sm leading-relaxed text-primary-700">
            For example, you can find our API docs here and click “Request Sample” to see how to make requests using Javascript, Node, Python, C#, Java, PHP, and more.
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Explore APIs</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-800">POST /v1/detect</p>
              <p class="mt-2 text-xs text-slate-500">提交单篇文档获取文档/段落/句子的 AI 概率。</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-800">POST /v1/detect/batch</p>
              <p class="mt-2 text-xs text-slate-500">批量检测多个文件，返回逐文件的概率与标注。</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-800">GET /v1/usage</p>
              <p class="mt-2 text-xs text-slate-500">查询当前使用量与剩余额度，便于监控。</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-sm font-semibold text-slate-800">POST /v1/citations</p>
              <p class="mt-2 text-xs text-slate-500">上传文本并自动识别引用来源，辅助核查。</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import AppHeader from '../sections/AppHeader.vue';
</script>
