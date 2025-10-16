<template>
  <section id="trial" class="relative overflow-hidden bg-gradient-to-r from-primary-500 via-primary-600 to-sky-500 py-24 text-white">
    <div class="absolute inset-0 opacity-20">
      <div class="absolute left-1/3 top-10 h-40 w-40 rounded-full bg-white blur-3xl"></div>
      <div class="absolute right-1/4 bottom-10 h-56 w-56 rounded-full bg-white blur-3xl"></div>
    </div>
    <div class="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
      <span class="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
        免费试用开启
      </span>
      <h2 class="mt-6 text-3xl font-semibold sm:text-4xl">30 天高级功能体验，含 10 万字检测额度</h2>
      <p class="mt-4 text-lg text-white/80">
        接入 Veritascribe，开启可信内容生产旅程。无需信用卡，可随时取消。
      </p>
      <form
        class="mx-auto mt-10 flex max-w-2xl flex-col gap-3 rounded-full bg-white/10 p-2 backdrop-blur md:flex-row"
        @submit.prevent="goToRegister"
      >
        <input
          type="email"
          placeholder="输入工作邮箱，立即获得试用链接"
          class="flex-1 rounded-full border border-white/10 bg-white/90 px-6 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button type="submit" class="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
          领取试用
        </button>
      </form>
      <p class="mt-6 text-xs text-white/70">支持企业邮箱单点登录 · 适用于高校/媒体/企业场景</p>
    </div>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToRegister = () => {
  router.push('/register');
};
</script>
