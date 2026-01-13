<template>
  <footer class="border-t border-slate-800 bg-slate-900 py-14 text-slate-200">
    <div class="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
      <div class="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div class="space-y-4">
          <div class="flex items-center space-x-3">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white font-semibold shadow-sm">V</span>
            <span class="text-lg font-semibold tracking-tight text-white">Veritascribe</span>
          </div>
          <p class="text-sm text-slate-300">面向学术、媒体与企业的 AI 内容检测与智能写作平台。</p>
          <div class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-slate-400">订阅更新</p>
            <div class="flex items-center gap-3">
              <input
                type="email"
                placeholder="输入邮箱获取产品动态"
                class="h-11 w-full flex-1 rounded-full border border-white/10 bg-white/10 px-4 text-sm text-white placeholder:text-slate-400 focus:border-primary-400 focus:outline-none"
              />
              <button type="button" class="h-11 rounded-full bg-primary-600 px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500">
                订阅
              </button>
            </div>
          </div>
          <p class="text-xs text-slate-500">© {{ new Date().getFullYear() }} Veritascribe. 保留所有权利。</p>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-white">产品</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-300">
            <li><a class="transition hover:text-white" href="#capabilities">功能矩阵</a></li>
            <li><a class="transition hover:text-white" href="#workflow">工作流</a></li>
            <li><a class="transition hover:text-white" href="#pricing">定价</a></li>
            <li><a class="transition hover:text-white" href="#trial">申请试用</a></li>
          </ul>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-white">公司</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-300">
            <li><a class="transition hover:text-white" href="#showcase">高校学术</a></li>
            <li><a class="transition hover:text-white" href="#showcase">媒体编辑</a></li>
            <li><a class="transition hover:text-white" href="#showcase">企业合规</a></li>
            <li><a class="transition hover:text-white" href="#">API 平台</a></li>
          </ul>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-white">资源</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-300">
            <li><a class="transition hover:text-white" href="#faq">常见问题</a></li>
            <li><a class="transition hover:text-white" href="#">白皮书</a></li>
            <li><a class="transition hover:text-white" href="#">安全合规</a></li>
            <li><a class="transition hover:text-white" href="#">联系我们</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>
