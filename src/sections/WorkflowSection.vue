<template>
  <section id="workflow" class="bg-white py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <h2 class="section-title">可信内容从这里开始</h2>
        <p class="section-subtitle">
          面向教学、媒体与企业审核场景设计的协作流程，让团队在一套产品中完成检测、润色、翻译与输出备案。
        </p>
      </div>
      <div class="mt-16 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div class="grid gap-6">
          <article
            v-for="(step, index) in steps"
            :key="step.title"
            class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-md"
          >
            <div class="absolute -left-12 top-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary-100/80 text-3xl font-bold text-primary-500">
              {{ index + 1 }}
            </div>
            <div class="ml-14">
              <h3 class="text-xl font-semibold text-slate-900">{{ step.title }}</h3>
              <p class="mt-3 text-sm text-slate-600">{{ step.description }}</p>
              <ul class="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                <li
                  v-for="chip in step.chips"
                  :key="chip"
                  class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                >
                  {{ chip }}
                </li>
              </ul>
            </div>
          </article>
        </div>
        <aside class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">识别工作台快照</p>
            <h3 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900">团队合规健康度 92%</h3>
            <p class="mt-3 text-sm text-slate-600">实时监控团队写作合规性，自动推送异常段落与人工复核任务。</p>
          </div>
          <dl class="mt-8 space-y-5">
            <div class="flex items-center justify-between">
              <dt class="text-sm font-medium text-slate-500">本周检测文档</dt>
              <dd class="text-xl font-semibold text-slate-900">482 份</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm font-medium text-slate-500">高风险段落</dt>
              <dd class="text-xl font-semibold text-slate-900">12 处</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-sm font-medium text-slate-500">润色完成率</dt>
              <dd class="text-xl font-semibold text-slate-900">87%</dd>
            </div>
          </dl>
          <button
            type="button"
            class="mt-10 inline-flex items-center justify-center rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-primary-200/60 transition hover:-translate-y-0.5 hover:bg-primary-500"
            @click="openDashboard"
          >
            前往识别页面
          </button>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useScanStore } from '../store/scan';

const steps = [
  {
    title: '批量导入文本，获取段落级检测报告',
    description: '支持粘贴文本、上传文档或接入 API，系统自动生成 AI 概率热力图与可疑段落说明。',
    chips: ['API 接入', '多格式上传', '段落热力图']
  },
  {
    title: '一键润色并保留人类风格',
    description: '选择目标语气与行业词库，自动润色语句并保持人工写作习惯，导出对照稿。',
    chips: ['风格迁移', '词库管理', '对照稿导出']
  },
  {
    title: '多语言翻译与审校协作',
    description: '翻译文本时同步标注高风险句子，审校成员可直接批注、指派任务并追踪版本。',
    chips: ['翻译记忆', '协同批注', '版本追踪']
  }
];

const router = useRouter();
const scanStore = useScanStore();

const openDashboard = () => {
  scanStore.commitDraftToStorage();
  const target = router.resolve({ name: 'dashboard' });
  if (typeof window !== 'undefined') {
    window.open(target.href, '_blank', 'noopener');
  }
};
</script>
