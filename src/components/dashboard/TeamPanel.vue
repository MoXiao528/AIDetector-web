<template>
  <div class="space-y-8">
    <section class="relative overflow-hidden rounded-3xl bg-[#E8F1FB] p-8 text-slate-900 shadow-sm">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-2xl space-y-3">
          <p class="text-2xl font-semibold tracking-tight">Welcome to Veritascribe teams</p>
          <p class="text-sm leading-relaxed text-slate-600">
            Purchase shared words to cover your entire team. Invite your team members for free and start getting organized.
          </p>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              Get started
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Watch the Demo
            </button>
          </div>
        </div>
        <div class="flex items-center gap-4 self-start rounded-2xl bg-white/70 px-4 py-3 shadow-sm lg:self-center">
          <div class="relative h-12 w-12">
            <div class="absolute inset-0 rounded-full bg-[conic-gradient(#1a73e8_0deg,#1a73e8_12deg,rgba(26,115,232,0.15)_12deg_360deg)]"></div>
            <div class="absolute inset-[6px] rounded-full bg-white"></div>
            <div class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-500">
              0%
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Progress</p>
            <p class="text-sm font-semibold text-slate-700">0% complete</p>
          </div>
        </div>
      </div>
      <div class="pointer-events-none absolute -right-20 top-1/2 hidden h-48 w-48 -translate-y-1/2 rounded-full bg-white/40 blur-2xl lg:block"></div>
    </section>

    <section class="space-y-4">
      <div class="space-y-2">
        <h2 class="text-lg font-semibold text-slate-900">Team setup checklist</h2>
        <p class="text-sm text-slate-500">Follow these steps to bring your whole organization onto Veritascribe.</p>
      </div>
      <div class="space-y-4">
        <article
          v-for="item in checklist"
          :key="item.id"
          class="group flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-start gap-4">
            <span class="mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-slate-300"></span>
            <div class="space-y-1">
              <p class="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">{{ item.step }}</p>
              <p class="text-base font-semibold text-slate-900">{{ item.title }}</p>
              <p v-if="item.description" class="text-xs text-slate-500">{{ item.description }}</p>
            </div>
          </div>
          <button
            type="button"
            :class="[
              'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition',
              item.variant === 'primary'
                ? 'bg-primary-600 text-white shadow-sm hover:bg-primary-500'
                : 'bg-primary-50 text-primary-600 hover:bg-primary-100',
            ]"
          >
            {{ item.actionLabel }}
          </button>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
const checklist = [
  {
    id: 1,
    step: 'Step 1',
    title: 'Create team',
    description: '',
    actionLabel: 'Create a team',
    variant: 'primary',
  },
  {
    id: 2,
    step: 'Step 2',
    title: 'Upgrade your team to a paid plan',
    description: 'Purchase shared words for your team. Sharing lets you maximize monthly credits!',
    actionLabel: 'Upgrade',
    variant: 'secondary',
  },
  {
    id: 3,
    step: 'Step 3',
    title: 'Invite members to your team',
    description: '',
    actionLabel: 'Invite',
    variant: 'secondary',
  },
];
</script>
