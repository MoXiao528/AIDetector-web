<template>
  <section class="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 pb-24 pt-20">
    <div class="absolute inset-0 -z-10">
      <div class="absolute left-1/2 top-0 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-primary-200/40 blur-3xl"></div>
      <div class="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl"></div>
      <div class="absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"></div>
    </div>
    <div class="mx-auto flex max-w-6xl flex-col-reverse items-center gap-16 px-4 sm:px-6 lg:flex-row lg:items-start lg:gap-24 lg:px-8">
      <div class="w-full lg:w-1/2">
        <div class="inline-flex items-center space-x-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
          <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>企业级 AI 文本检测 · 实时守护内容可信度</span>
        </div>
        <h1 class="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          以 GPTZero 水准的准确率，
          <span class="text-primary-600">秒级辨别 AI 生成文本</span>
        </h1>
        <p class="mt-6 text-lg text-slate-600">
          Veritascribe 将深度检测、文本润色、风格改写与跨语言翻译融于一体，为高校、媒体与企业提供可信赖的智能写作工作台。一次分析即可生成检测报告、人工痕迹增强建议与多语言对照稿。
        </p>
        <ul class="mt-8 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <li class="flex items-center space-x-2">
            <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>混合大模型比对，检测准确率 97.4%</span>
          </li>
          <li class="flex items-center space-x-2">
            <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>支持中英双语润色与专业术语保留</span>
          </li>
          <li class="flex items-center space-x-2">
            <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>写作风格库覆盖学术、媒体、营销</span>
          </li>
          <li class="flex items-center space-x-2">
            <svg class="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>团队仪表盘与 API 接入一体化</span>
          </li>
        </ul>
        <div class="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#trial"
            class="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500"
          >
            立即免费检测 1200 字
          </a>
          <a href="#showcase" class="text-sm font-semibold text-slate-700">
            查看典型案例 →
          </a>
        </div>
        <dl class="mt-12 grid w-full gap-6 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur">
          <div class="flex items-center justify-between">
            <dt class="text-sm text-slate-500">高校与出版社信任</dt>
            <dd class="text-xl font-semibold text-slate-900">1300+ 机构</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-sm text-slate-500">每日处理文档</dt>
            <dd class="text-xl font-semibold text-slate-900">82,000+</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-sm text-slate-500">平均检测耗时</dt>
            <dd class="text-xl font-semibold text-slate-900">6.4 秒 / 千字</dd>
          </div>
        </dl>
      </div>
      <div class="w-full lg:w-1/2">
        <div class="relative rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-primary-200/40 backdrop-blur">
          <div class="absolute -top-10 right-8 hidden rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-slate-500 shadow-md sm:flex">
            实时校验
          </div>
          <div class="space-y-6">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-slate-700">AI 文本检测</h3>
                <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">高置信</span>
              </div>
              <textarea
                v-model="inputText"
                rows="10"
                class="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 shadow-inner focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                placeholder="粘贴需要检测或润色的文本，我们将自动识别 AI 生成概率并给出修改建议。"
              ></textarea>
              <div class="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div class="flex items-center space-x-3">
                  <span>字数：{{ charCount }}</span>
                  <span>句子：{{ sentenceCount }}</span>
                  <span>AI 概率：<span :class="aiProbabilityClass">{{ aiProbabilityLabel }}</span></span>
                </div>
                <div class="flex items-center space-x-2">
                  <button class="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:border-primary-300 hover:text-primary-600">
                    润色
                  </button>
                  <button class="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:border-primary-300 hover:text-primary-600">
                    翻译
                  </button>
                  <button class="rounded-full bg-primary-600 px-3 py-1 font-medium text-white shadow-sm hover:bg-primary-500">
                    开始检测
                  </button>
                </div>
              </div>
            </div>
            <div class="grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-widest text-slate-500">检测摘要</span>
                <span class="rounded-full bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-600">Beta</span>
              </div>
              <div class="space-y-4">
                <div class="flex items-center justify-between rounded-xl bg-slate-50/90 p-3">
                  <div>
                    <p class="text-xs text-slate-500">整体 AI 生成概率</p>
                    <p class="text-lg font-semibold text-slate-900">{{ (aiProbability * 100).toFixed(1) }}%</p>
                  </div>
                  <div class="h-14 w-14 rounded-full border-8 border-emerald-200/80 p-3 text-center text-xs font-semibold text-emerald-600">
                    可信
                  </div>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="rounded-xl border border-slate-200 p-3">
                    <p class="text-xs font-medium text-slate-500">原创度评分</p>
                    <p class="mt-1 text-lg font-semibold text-slate-900">92 / 100</p>
                    <p class="mt-1 text-xs text-slate-500">高原创度，建议保持关键信息</p>
                  </div>
                  <div class="rounded-xl border border-slate-200 p-3">
                    <p class="text-xs font-medium text-slate-500">语气匹配度</p>
                    <p class="mt-1 text-lg font-semibold text-slate-900">86%</p>
                    <p class="mt-1 text-xs text-slate-500">符合学术写作风格</p>
                  </div>
                </div>
                <div class="rounded-xl border border-slate-200 p-3">
                  <p class="text-xs font-medium text-slate-500">润色建议</p>
                  <ul class="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500">
                    <li>加强段落之间的衔接词，提升可读性。</li>
                    <li>保留原始数据引用，避免信息缺失。</li>
                    <li>如需翻译，请选择保留术语模式。</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';

const defaultText = `In today's rapidly evolving AI landscape, educators require transparent ways to validate the authenticity of student work while still encouraging responsible experimentation with generative tools.`;
const inputText = ref(defaultText);

const charCount = computed(() => inputText.value.length);
const sentenceCount = computed(() => (inputText.value.match(/[.!?。！？]/g) || []).length || 1);
const aiProbability = computed(() => {
  const threshold = 180;
  const variance = Math.max(0, threshold - inputText.value.length) / threshold;
  return Number((0.18 + variance * 0.22).toFixed(2));
});

const aiProbabilityLabel = computed(() => {
  if (aiProbability.value < 0.3) return '极低';
  if (aiProbability.value < 0.6) return '中等';
  return '偏高';
});

const aiProbabilityClass = computed(() => {
  if (aiProbability.value < 0.3) return 'text-emerald-600 font-semibold';
  if (aiProbability.value < 0.6) return 'text-amber-600 font-semibold';
  return 'text-rose-600 font-semibold';
});
</script>
