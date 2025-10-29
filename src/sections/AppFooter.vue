<template>
  <footer class="border-t border-slate-200 bg-white py-12">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-10 md:grid-cols-4">
        <div class="space-y-4">
          <div class="flex items-center space-x-2">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-white font-semibold">V</span>
            <span class="text-lg font-semibold tracking-tight text-slate-900">Veritascribe</span>
          </div>
          <p class="text-sm text-slate-500">面向学术、媒体与企业的 AI 内容检测与智能写作平台。</p>
          <p class="text-xs text-slate-400">© {{ new Date().getFullYear() }} Veritascribe. 保留所有权利。</p>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-900">产品</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-500">
            <li><a href="#capabilities">功能矩阵</a></li>
            <li><a href="#workflow">工作流</a></li>
            <li><a href="#pricing">定价</a></li>
            <li><a href="#trial">申请试用</a></li>
          </ul>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-900">解决方案</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-500">
            <li><a href="#showcase">高校学术</a></li>
            <li><a href="#showcase">媒体编辑</a></li>
            <li><a href="#showcase">企业合规</a></li>
            <li><a href="#">API 平台</a></li>
          </ul>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-900">资源</h3>
          <ul class="mt-4 space-y-3 text-sm text-slate-500">
            <li><a href="#faq">常见问题</a></li>
            <li><a href="#">白皮书</a></li>
            <li><a href="#">安全合规</a></li>
            <li><a href="#">联系我们</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>
