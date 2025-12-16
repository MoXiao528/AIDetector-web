<template>
  <transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      @click.self="$emit('close')"
    >
      <div class="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
        <div class="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary-600">使用示例</p>
            <h3 class="mt-2 text-xl font-semibold text-slate-900">看看实际文档与检测结果如何呈现</h3>
            <p class="mt-1 text-sm text-slate-500">示例涵盖学术、营销与技术文档，帮助你快速理解输出格式。</p>
          </div>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            @click="$emit('close')"
          >
            ×
          </button>
        </div>

        <div class="grid gap-4 p-6 md:grid-cols-2">
          <article
            v-for="example in examples"
            :key="example.key"
            class="group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-sm"
          >
            <div class="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-primary-100/60 blur-3xl transition group-hover:scale-125"></div>
            <div class="absolute -bottom-8 -right-6 h-24 w-24 rounded-full bg-emerald-100/60 blur-3xl transition group-hover:scale-125"></div>
            <div class="relative space-y-4 p-6">
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span class="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-white">{{ example.docType }}</span>
                <span class="rounded-full bg-primary-100 px-2 py-0.5 text-primary-700">{{ example.length }}</span>
              </div>
              <div class="space-y-2">
                <h4 class="text-lg font-semibold text-slate-900">{{ example.title }}</h4>
                <p class="text-sm leading-relaxed text-slate-600">{{ example.description }}</p>
              </div>
              <div class="rounded-2xl bg-white/80 p-4 shadow-inner">
                <p class="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">结果快照</p>
                <div class="mt-3 space-y-2 text-sm text-slate-700">
                  <div class="flex items-center gap-2 text-xs text-slate-500">
                    <span class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">AI {{ example.ai }}%</span>
                    <span class="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">Mixed {{ example.mixed }}%</span>
                    <span class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Human {{ example.human }}%</span>
                    <span class="ml-auto text-[11px] text-slate-400">快照：{{ example.snapshot }}</span>
                  </div>
                  <p class="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-600">
                    {{ example.snippet }}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-500">
          <div class="flex items-center gap-2">
            <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[11px] font-semibold text-white">i</span>
            <span>每个示例都可在编辑器中一键载入，方便练习。</span>
          </div>
          <button
            type="button"
            class="rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500"
            @click="$emit('close')"
          >
            明白了
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  examples: {
    type: Array,
    default: () => [],
  },
});
</script>
