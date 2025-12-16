<template>
  <div class="min-h-screen bg-slate-100">
    <AppHeader mode="dashboard" :dashboard-context="headerVariant" />
    <div class="flex flex-col lg:flex-row">
      <aside class="hidden w-64 flex-shrink-0 flex-col border-b border-slate-200 bg-white/90 px-4 py-6 shadow-sm lg:flex lg:border-b-0 lg:border-r">
        <nav class="space-y-2">
          <button
            type="button"
            :class="['nav-item', isPanelActive('home') ? 'nav-item--active' : '']"
            @click="setActivePanel('home')"
          >
            <HomeIcon class="h-5 w-5" />
            <span>Home</span>
          </button>
          <button
            type="button"
            :class="['nav-item', isPanelActive('document') ? 'nav-item--active' : '']"
            @click="setActivePanel('document')"
          >
            <DocumentTextIcon class="h-5 w-5" />
            <span>Document</span>
          </button>
          <button
            type="button"
            :class="['nav-item', isPanelActive('history') ? 'nav-item--active' : '']"
            @click="setActivePanel('history')"
          >
            <ClockIcon class="h-5 w-5" />
            <span>History</span>
          </button>
          <div class="relative">
            <button
              ref="newMenuButtonRef"
              type="button"
              class="nav-item"
              @click="toggleNewMenu"
            >
              <PlusIcon class="h-5 w-5" />
              <span>New</span>
            </button>
            <transition name="fade">
              <div
                v-if="newMenuOpen"
                ref="newMenuRef"
                class="absolute left-0 top-full z-10 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
              >
                <button type="button" class="menu-item" @click="startNewScan">新建扫描</button>
                <button type="button" class="menu-item" @click="triggerMultiUpload">批量上传</button>
              </div>
            </transition>
          </div>
        </nav>
        <div class="mt-auto rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          <p>拖拽 TXT / DOCX / PDF 等文件到编辑区即可自动读取。</p>
        </div>
        <div v-if="authStore.isAuthenticated" class="mt-6 space-y-2 border-t border-slate-200 pt-4">
          <button
            type="button"
            :class="['nav-item', isPanelActive('profile') ? 'nav-item--active' : '']"
            @click="goToProfile"
          >
            <Cog6ToothIcon class="h-5 w-5" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            :class="['nav-item', isPanelActive('qa') ? 'nav-item--active' : '']"
            @click="goToQA"
          >
            <QuestionMarkCircleIcon class="h-5 w-5" />
            <span>问答</span>
          </button>
        </div>
      </aside>

      <main class="flex min-h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden">
        <div v-if="isPanelActive('home')" class="relative flex-1 overflow-y-auto px-4 py-6">
          <div
            :class="[
              'mx-auto flex w-full max-w-7xl flex-col gap-10',
              isFeatureModalOpen ? 'pointer-events-none select-none filter blur-sm' : '',
            ]"
          >
            <header class="flex flex-col gap-6">
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-3">
                  <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
                    Welcome, {{ userDisplayName }}
                  </h1>
                  <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                    {{ userPlanTag }}
                  </span>
                </div>
                <p class="max-w-2xl text-sm leading-relaxed text-slate-500">{{ activeQuote }}</p>
              </div>
              <div class="flex flex-wrap items-center gap-3 text-sm text-primary-700">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 font-semibold text-primary-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-100"
                  @click="showUsageExamples = true"
                >
                  <SparklesIcon class="h-4 w-4" />
                  使用示例
                </button>
                <span class="text-xs text-slate-500">查看示例文档与结果快照，加速熟悉流程。</span>
              </div>
              <OnboardingStepsBar
                v-if="showOnboarding"
                :steps="onboardingSteps"
                @skip="dismissOnboarding"
                @complete="completeOnboarding"
              />
            </header>

            <section class="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] xl:grid-cols-[minmax(0,0.65fr)_minmax(0,1.4fr)] 2xl:grid-cols-[minmax(0,0.6fr)_minmax(0,1.45fr)]">
              <button
                type="button"
                class="group relative flex h-full min-h-[240px] flex-col justify-between rounded-4xl bg-white px-8 py-8 text-left shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl"
                @click="startNewScan"
              >
                <div class="flex items-start justify-between">
                  <div class="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
                    <svg class="h-8 w-8" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 7a2 2 0 012-2h6l4 4v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                    </svg>
                  </div>
                  <span class="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Quick launch
                  </span>
                </div>
                <div class="mt-10 space-y-3">
                  <p class="text-3xl font-semibold tracking-tight text-slate-900">New scan</p>
                  <p class="max-w-sm text-sm text-slate-500">准备好一段文本或多个文件？点击即可回到文档编辑器开始 RepreGuard 检测。</p>
                </div>
                <span class="absolute -bottom-4 -right-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl font-semibold text-white shadow-xl shadow-emerald-500/40 transition group-hover:scale-110">
                  +
                </span>
              </button>

              <div class="flex flex-col gap-6">
                <div class="flex items-center justify-between">
                  <h2 class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Feature Capsules</h2>
                  <p class="text-xs text-slate-400">点击以了解更多功能</p>
                </div>
                <div class="-mx-1 overflow-x-auto pb-2 lg:mx-0 lg:overflow-visible">
                  <div class="flex min-w-full gap-4 px-1 lg:grid lg:min-w-0 lg:grid-cols-2 lg:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
                    <button
                      v-for="card in featureCards"
                      :key="card.key"
                      type="button"
                      :title="card.tooltip"
                      class="group relative flex min-w-[200px] flex-1 flex-col gap-4 rounded-3xl bg-white/90 p-5 text-left shadow-md shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-xl lg:min-w-0"
                      @click="openFeatureModal(card)"
                    >
                      <div class="flex items-center justify-between">
                        <div :class="['flex h-12 w-12 items-center justify-center rounded-2xl', card.iconClass]">
                          <component :is="card.icon" class="h-6 w-6" aria-hidden="true" />
                        </div>
                        <span v-if="card.tag" :class="['inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold', card.tagClass]">
                          {{ card.tag }}
                        </span>
                      </div>
                      <div>
                        <p class="text-base font-semibold text-slate-900">{{ card.title }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ card.subtitle }}</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section class="rounded-4xl border border-slate-200 bg-blue-50/90 px-8 py-8 shadow-sm">
              <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div class="max-w-2xl space-y-2">
                  <span class="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">New for Educators</span>
                  <h3 class="text-2xl font-semibold tracking-tight text-slate-900">New for Educators</h3>
                  <p class="text-sm leading-relaxed text-slate-600">
                    我们的 AI 评分助手可帮助教师根据课程快速提供一致反馈，节省时间并保持教学控制。
                  </p>
                </div>
                <div class="flex items-center gap-6">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500"
                  >
                    Get started
                  </button>
                  <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-inner">
                    <svg class="h-10 w-10 text-sky-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h10M7 12h6m-6 5h10M9 5l-2 2 2 2M17 5l2 2-2 2" />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">More ways to scan...</h3>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="integration in integrationButtons"
                  :key="integration.key"
                  type="button"
                  :class="[
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
                    integration.class,
                  ]"
                  @click="handleIntegrationAction(integration)"
                >
                  <component :is="integration.icon" class="h-5 w-5" aria-hidden="true" />
                  {{ integration.label }}
                </button>
              </div>
            </section>
          </div>

          <transition name="fade">
            <div
              v-if="isFeatureModalOpen"
              class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
              @click="closeFeatureModal"
            >
              <div
                class="w-full max-w-xl rounded-4xl bg-white p-8 shadow-2xl"
                @click.stop
              >
                <div class="space-y-6 text-center">
                  <div class="space-y-2">
                    <h3 class="text-2xl font-semibold tracking-tight text-slate-900">{{ activeFeatureCard?.modalTitle }}</h3>
                    <p class="text-sm text-slate-500">{{ activeFeatureCard?.modalSubtitle }}</p>
                  </div>
                  <div class="flex h-48 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                    <span class="text-sm font-semibold text-slate-400">演示动画占位</span>
                  </div>
                  <button
                    type="button"
                    :class="[
                      'mx-auto inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-semibold transition',
                      activeFeatureCard?.buttonVariant === 'free'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                        : 'bg-slate-900 text-white hover:bg-slate-800',
                    ]"
                    @click="handleFeatureModalAction(activeFeatureCard)"
                  >
                    {{ activeFeatureCard?.buttonLabel }}
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>
        <div v-else-if="isPanelActive('document')" class="flex h-full flex-col">
          <div class="border-b border-slate-200 bg-white/70 px-4 py-3 backdrop-blur">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex flex-wrap items-center gap-2">
                <div class="inline-flex items-center overflow-hidden rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-600">
                  <button
                    v-for="mode in editorModes"
                    :key="mode.key"
                    type="button"
                    :class="[
                      'rounded-full px-3 py-1 transition',
                      editorMode === mode.key ? 'bg-slate-900 text-white shadow' : 'hover:bg-slate-100',
                      mode.key === 'preview' && !hasResults ? 'pointer-events-none opacity-40' : '',
                    ]"
                    @click="editorMode = mode.key"
                  >
                    {{ mode.label }}
                  </button>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-600"
                  @click="resetEditor"
                >
                  一键重置
                </button>
              </div>
              <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{{ characterUsage }}</span>
                <span>已选功能：{{ selectedFunctionSummary }}</span>
                <span v-if="scanStore.lastUploadedFileName" class="inline-flex items-center rounded-full bg-slate-100 px-2 py-1">
                  <ArrowUpTrayIcon class="mr-1 h-3 w-3 text-primary-500" />
                  {{ scanStore.lastUploadedFileName }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <section class="flex-1 overflow-hidden px-4 py-6">
              <div class="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
                <div class="relative flex-1 overflow-hidden">
                  <div
                    v-show="editorMode === 'edit'"
                    ref="editorRef"
                    class="editor-surface"
                    contenteditable="true"
                    data-placeholder="拖拽文档或直接粘贴文本，开始智能检测。"
                    @input="onEditorInput"
                    @focus="editorMode = 'edit'"
                    @dragenter.prevent="onDragEnter"
                    @dragover.prevent="onDragOver"
                    @dragleave.prevent="onDragLeave"
                    @drop.prevent="onDrop"
                  ></div>
                  <div
                    v-show="editorMode === 'preview'"
                    class="preview-surface"
                  >
                    <div v-if="hasResults" v-html="highlightedPreviewHtml"></div>
                    <div v-else class="flex h-full items-center justify-center text-sm text-slate-400">
                      生成检测结果后可在此查看颜色标注。
                    </div>
                  </div>
                  <div
                    v-if="dragActive"
                    class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary-400 bg-primary-50/80 text-primary-600"
                  >
                    <ArrowUpTrayIcon class="mb-3 h-10 w-10" />
                    <p class="text-sm font-semibold">释放鼠标上传文档</p>
                    <p class="mt-1 text-xs">支持 TXT / DOCX / PDF / Markdown 等格式</p>
                  </div>
                </div>
                <div class="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
                  <span>自动保存草稿，刷新页面不会丢失内容。</span>
                </div>
              </div>
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept=".txt,.md,.doc,.docx,.pdf,.json,.csv,.yaml,.yml,.tex,.tax"
                @change="onFileChange"
              />
            </section>

            <aside class="relative w-full border-t border-slate-200 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:w-96 lg:border-t-0 lg:border-l lg:shadow-none">
              <div class="h-full overflow-y-auto px-5 py-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-sm font-semibold text-slate-900">Scan Menu</h2>
                    <p class="text-xs text-slate-500">选择功能并查看对应结果</p>
                  </div>
                </div>

                <div v-if="!hasResults" class="mt-6 space-y-6">
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="option in functionOptions"
                      :key="option.key"
                      type="button"
                      :class="[
                        'function-chip',
                        isFunctionSelected(option.key)
                          ? option.activeClass
                          : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-600',
                      ]"
                      @click="toggleFunction(option.key)"
                    >
                      <component :is="option.icon" class="mr-1.5 h-4 w-4" />
                      {{ option.label }}
                    </button>
                  </div>
                  <div class="space-y-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                    <p>已选功能：{{ selectedFunctionSummary }}</p>
                    <p>{{ characterUsage }}</p>
                    <p v-if="scanStore.lastUploadedFileName">已导入：{{ scanStore.lastUploadedFileName }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-slate-500">试试这些范例</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <button
                        v-for="example in scanStore.examples"
                        :key="example.key"
                        type="button"
                        :class="[
                          'rounded-full border px-3 py-1 text-xs font-medium transition',
                          scanStore.selectedExampleKey === example.key
                            ? 'border-primary-300 bg-primary-50 text-primary-600'
                            : 'border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-600',
                        ]"
                        @click="applyExample(example.key)"
                      >
                        {{ example.label }}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    @click="handleScan"
                  >
                    立即扫描
                  </button>
                  <p class="text-xs text-slate-400">登录后可保存扫描记录、导出报告与管理团队额度。</p>
                </div>

                <div v-else class="mt-6 space-y-6">
                  <div class="rounded-2xl bg-slate-900 p-5 text-white shadow-lg">
                    <p class="text-xs uppercase tracking-[0.3em] text-white/70">AI 检测摘要</p>
                    <div class="mt-4 flex items-end justify-between">
                      <div>
                        <p class="text-xl font-semibold">潜在相似句 {{ detectionResults.aiLikelyCount }} 句</p>
                        <p class="mt-1 text-xs text-white/70">含 AI 生成或人机混合特征的句子总数</p>
                      </div>
                    </div>
                    <div class="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div class="rounded-xl bg-amber-500/20 p-3">
                        <p class="text-[10px] uppercase tracking-widest text-amber-200">AI Generated</p>
                        <p class="mt-2 text-lg font-semibold">{{ detectionResults.summary.ai }}%</p>
                      </div>
                      <div class="rounded-xl bg-violet-500/20 p-3">
                        <p class="text-[10px] uppercase tracking-widest text-violet-200">Mixed</p>
                        <p class="mt-2 text-lg font-semibold">{{ detectionResults.summary.mixed }}%</p>
                      </div>
                      <div class="rounded-xl bg-emerald-500/20 p-3">
                        <p class="text-[10px] uppercase tracking-widest text-emerald-200">Human</p>
                        <p class="mt-2 text-lg font-semibold">{{ detectionResults.summary.human }}%</p>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="tab in availableResultTabs"
                      :key="tab.key"
                      type="button"
                      :class="[
                        'rounded-full border px-3 py-1 text-xs font-semibold transition',
                        activeResultTab === tab.key
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600',
                      ]"
                      @click="activeResultTab = tab.key"
                    >
                      {{ tab.label }}
                    </button>
                  </div>

                  <div class="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
                      @click="exportReport"
                    >
                      <DocumentArrowDownIcon class="h-4 w-4" />
                      导出报告
                    </button>
                    <span>下载 JSON 快照，便于与团队分享或归档。</span>
                  </div>

                  <div v-if="activeResultTab === 'scan'" class="space-y-4">
                    <div
                      v-for="sentence in detectionResults.sentences"
                      :key="sentence.id"
                      :class="['rounded-2xl border p-4 text-sm', highlightBorderClass(sentence.type)]"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <p class="flex-1 leading-relaxed" v-html="formatHighlightedSentence(sentence)"></p>
                        <span class="text-xs font-semibold text-slate-500">概率 {{ Math.round(sentence.probability * 100) }}%</span>
                      </div>
                      <p class="mt-2 text-xs text-slate-500">{{ sentence.reason }}</p>
                    </div>
                  </div>

                  <div v-else-if="activeResultTab === 'translate'" class="space-y-3">
                    <p class="text-xs font-semibold text-slate-500">自动翻译结果</p>
                    <div class="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                      {{ detectionResults.translation }}
                    </div>
                  </div>

                  <div v-else-if="activeResultTab === 'polish'" class="space-y-4">
                    <p class="text-xs font-semibold text-slate-500">润色建议</p>
                    <div
                      v-for="suggestion in detectionResults.polish"
                      :key="suggestion.id"
                      class="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                    >
                      <p class="font-semibold text-slate-700">{{ suggestion.suggestion }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ suggestion.reason }}</p>
                      <button
                        type="button"
                        class="mt-3 inline-flex items-center rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-500"
                        @click="applyPolishSuggestion(suggestion)"
                      >
                        一键应用
                      </button>
                    </div>
                    <p class="text-[11px] text-slate-400">应用后请再次扫描以刷新检测结果。</p>
                  </div>

                  <div v-else-if="activeResultTab === 'citation'" class="space-y-4">
                    <p class="text-xs font-semibold text-slate-500">引用核查</p>
                    <div
                      v-for="item in detectionResults.citations"
                      :key="item.id"
                      class="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                    >
                      <div class="flex items-start justify-between">
                        <p class="flex-1 text-slate-700">{{ item.excerpt }}</p>
                        <span class="ml-3 rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="citationStatusClass(item.status)">
                          {{ item.status }}
                        </span>
                      </div>
                      <p class="mt-2 text-xs text-slate-500">{{ item.note }}</p>
                    </div>
                    <p class="text-[11px] text-slate-400">引用核查为占位逻辑，后续可接入真实数据库。</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
          <div class="pointer-events-none fixed bottom-4 left-1/2 z-30 flex w-full max-w-4xl -translate-x-1/2 px-4 sm:bottom-6">
            <div class="pointer-events-auto flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl shadow-slate-200/80 backdrop-blur">
              <div class="flex flex-wrap items-center gap-2">
                <button type="button" class="toolbar-button" @click="applyCommand('bold')">B</button>
                <button type="button" class="toolbar-button italic" @click="applyCommand('italic')">I</button>
                <button type="button" class="toolbar-button underline" @click="applyCommand('underline')">U</button>
                <button type="button" class="toolbar-button" @click="applyCommand('insertUnorderedList')">• 列表</button>
                <button type="button" class="toolbar-button" @click="applyCommand('insertOrderedList')">1. 列表</button>
                <button type="button" class="toolbar-button" @click="applyCommand('justifyLeft')">左对齐</button>
                <button type="button" class="toolbar-button" @click="applyCommand('justifyCenter')">居中</button>
                <button type="button" class="toolbar-button" @click="applyCommand('justifyRight')">右对齐</button>
                <div class="toolbar-select">
                  <label class="sr-only" for="font-size">字体大小</label>
                  <select id="font-size" class="text-xs" @change="onFontSizeChange">
                    <option value="" selected>字体大小</option>
                    <option value="small">12px</option>
                    <option value="base">14px</option>
                    <option value="lg">16px</option>
                    <option value="xl">18px</option>
                    <option value="2xl">24px</option>
                  </select>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" class="toolbar-button" @click="triggerUpload">
                  <ArrowUpTrayIcon class="mr-1 h-4 w-4" />
                  上传文件
                </button>
                <button
                  type="button"
                  class="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500"
                  @click="handleScan"
                >
                  <svg
                    v-if="isScanning"
                    class="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  {{ isScanning ? '扫描中...' : '开始扫描' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="isPanelActive('history')" class="flex h-full flex-col">
          <div class="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-slate-900">历史记录</h2>
                <p class="text-xs text-slate-500">查看最近的检测、润色与翻译任务</p>
              </div>
              <button
                type="button"
                class="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-600"
                @click="setActivePanel('document')"
              >
                返回编辑
              </button>
            </div>
          </div>
          <div class="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <section class="w-full border-b border-slate-200 bg-white/70 px-4 py-6 lg:w-80 lg:border-b-0 lg:border-r">
              <div class="space-y-4">
                <div>
                  <h3 class="text-sm font-semibold text-slate-900">最近记录</h3>
                  <p class="mt-1 text-xs text-slate-500">点击左侧记录以查看详细分析</p>
                </div>
                <div class="space-y-2">
                  <button
                    v-for="record in historyRecords"
                    :key="record.id"
                    type="button"
                    :class="[
                      'w-full rounded-2xl border px-3 py-3 text-left text-sm transition',
                      record.id === activeHistoryId
                        ? 'border-slate-900 bg-slate-900 text-white shadow'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-600',
                    ]"
                    @click="selectHistoryRecord(record.id)"
                  >
                    <p class="font-semibold">{{ record.title || '扫描记录' }}</p>
                    <p class="mt-1 text-xs" :class="record.id === activeHistoryId ? 'text-white/80' : 'text-slate-400'">
                      {{ formatHistorySummary(record) }}
                    </p>
                    <p class="mt-1 text-[11px]" :class="record.id === activeHistoryId ? 'text-white/70' : 'text-slate-400'">
                      {{ formatHistoryTimestamp(record.createdAt) }}
                    </p>
                  </button>
                </div>
              </div>
            </section>
            <section class="flex-1 overflow-y-auto px-4 py-6">
              <div v-if="activeHistoryRecord" class="space-y-6">
                <header class="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p class="text-xs uppercase tracking-[0.3em] text-primary-500">Saved Result</p>
                      <h2 class="text-xl font-semibold text-slate-900">{{ activeHistoryRecord.title || '扫描记录' }}</h2>
                      <div class="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{{ formatHistoryTimestamp(activeHistoryRecord.createdAt) }}</span>
                        <span>{{ historyCharacterUsage }}</span>
                        <span>功能：{{ historyFunctionSummary }}</span>
                      </div>
                    </div>
                    <span class="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                      已保存
                    </span>
                  </div>
                  <div class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p class="font-semibold text-slate-700">原文标色预览</p>
                    <div class="mt-3 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white/90 p-4 text-sm leading-relaxed text-slate-700" v-html="historyPreviewHtml"></div>
                  </div>
                </header>

                <div v-if="activeHistoryRecord.analysis" class="space-y-6">
                  <div class="rounded-2xl bg-slate-900 p-5 text-white shadow-lg">
                    <p class="text-xs uppercase tracking-[0.3em] text-white/70">AI 检测摘要</p>
                    <div class="mt-4 flex items-end justify-between">
                      <div>
                        <p class="text-xl font-semibold">潜在相似句 {{ activeHistoryRecord.analysis.aiLikelyCount }} 句</p>
                        <p class="mt-1 text-xs text-white/70">含 AI 生成或人机混合特征的句子总数</p>
                      </div>
                    </div>
                    <div class="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div class="rounded-xl bg-amber-500/20 p-3">
                        <p class="text-[10px] uppercase tracking-widest text-amber-200">AI Generated</p>
                        <p class="mt-2 text-lg font-semibold">{{ activeHistoryRecord.analysis.summary.ai }}%</p>
                      </div>
                      <div class="rounded-xl bg-violet-500/20 p-3">
                        <p class="text-[10px] uppercase tracking-widest text-violet-200">Mixed</p>
                        <p class="mt-2 text-lg font-semibold">{{ activeHistoryRecord.analysis.summary.mixed }}%</p>
                      </div>
                      <div class="rounded-xl bg-emerald-500/20 p-3">
                        <p class="text-[10px] uppercase tracking-widest text-emerald-200">Human</p>
                        <p class="mt-2 text-lg font-semibold">{{ activeHistoryRecord.analysis.summary.human }}%</p>
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="tab in availableHistoryTabs"
                      :key="tab.key"
                      type="button"
                      :class="[
                        'rounded-full border px-3 py-1 text-xs font-semibold transition',
                        activeHistoryTab === tab.key
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600',
                      ]"
                      @click="activeHistoryTab = tab.key"
                    >
                      {{ tab.label }}
                    </button>
                  </div>

                  <div v-if="activeHistoryTab === 'scan'" class="space-y-4">
                    <div
                      v-for="sentence in activeHistoryRecord.analysis.sentences"
                      :key="sentence.id"
                      :class="['rounded-2xl border p-4 text-sm', highlightBorderClass(sentence.type)]"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <p class="flex-1 leading-relaxed" v-html="formatHighlightedSentence(sentence)"></p>
                        <span class="text-xs font-semibold text-slate-500">概率 {{ Math.round(sentence.probability * 100) }}%</span>
                      </div>
                      <p class="mt-2 text-xs text-slate-500">{{ sentence.reason }}</p>
                    </div>
                  </div>

                  <div v-else-if="activeHistoryTab === 'translate'" class="space-y-3">
                    <p class="text-xs font-semibold text-slate-500">自动翻译结果</p>
                    <div class="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                      {{ activeHistoryRecord.analysis.translation }}
                    </div>
                  </div>

                  <div v-else-if="activeHistoryTab === 'polish'" class="space-y-4">
                    <p class="text-xs font-semibold text-slate-500">润色建议</p>
                    <div
                      v-for="suggestion in activeHistoryRecord.analysis.polish"
                      :key="suggestion.id"
                      class="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                    >
                      <p class="font-semibold text-slate-700">{{ suggestion.suggestion }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ suggestion.reason }}</p>
                      <button
                        type="button"
                        class="mt-3 inline-flex items-center rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-500"
                        @click="applyPolishSuggestion(suggestion)"
                      >
                        一键应用
                      </button>
                    </div>
                  </div>

                  <div v-else-if="activeHistoryTab === 'citation'" class="space-y-4">
                    <p class="text-xs font-semibold text-slate-500">引用核查</p>
                    <div
                      v-for="item in activeHistoryRecord.analysis.citations"
                      :key="item.id"
                      class="rounded-2xl border border-slate-200 bg-white p-4 text-sm"
                    >
                      <div class="flex items-start justify-between">
                        <p class="flex-1 text-slate-700">{{ item.excerpt }}</p>
                        <span class="ml-3 rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="citationStatusClass(item.status)">
                          {{ item.status }}
                        </span>
                      </div>
                      <p class="mt-2 text-xs text-slate-500">{{ item.note }}</p>
                    </div>
                    <p class="text-[11px] text-slate-400">引用核查为占位逻辑，后续可接入真实数据库。</p>
                  </div>
                </div>
                <div v-else class="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-10 text-center text-sm text-slate-500">
                  暂无可展示的历史结果，请稍后重试。
                </div>
              </div>
              <div v-else class="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-500">
                暂无历史记录，完成一次扫描后即可在此回顾。
              </div>
            </section>
          </div>
        </div>

        <div v-else-if="isPanelActive('pricing')" class="flex-1 overflow-y-auto bg-[#FAFAF7] px-0 py-6">
          <PricingPage embedded />
        </div>

        <div v-else-if="isPanelActive('profile')" class="flex-1 overflow-y-auto px-4 py-6">
          <div class="mx-auto w-full max-w-4xl">
            <ProfilePanel />
          </div>
        </div>

        <div v-else-if="isPanelActive('qa')" class="flex-1 overflow-y-auto px-4 py-6">
          <div class="mx-auto w-full max-w-5xl">
            <QAPanel />
          </div>
        </div>

        <div v-else class="flex-1 px-4 py-6">
          <div class="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-500">
            请选择左侧的功能以继续。
          </div>
        </div>
      </main>
    </div>
    <LoginPromptModal :open="showLoginModal" :message="loginMessage" @close="showLoginModal = false" />
    <UsageExamplesModal :open="showUsageExamples" :examples="usageExampleItems" @close="showUsageExamples = false" />
  </div>
</template>

<script setup>
import { computed, h, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowUpTrayIcon,
  BoltIcon,
  BookOpenIcon,
  BookmarkSquareIcon,
  CommandLineIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  HomeIcon,
  MagnifyingGlassCircleIcon,
  LanguageIcon,
  PaintBrushIcon,
  PencilSquareIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  PlusIcon,
  SparklesIcon,
  Squares2X2Icon,
  ShieldCheckIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline';
import AppHeader from '../sections/AppHeader.vue';
import LoginPromptModal from '../components/common/LoginPromptModal.vue';
import ProfilePanel from '../components/dashboard/ProfilePanel.vue';
import QAPanel from '../components/dashboard/QAPanel.vue';
import OnboardingStepsBar from '../components/dashboard/OnboardingStepsBar.vue';
import UsageExamplesModal from '../components/common/UsageExamplesModal.vue';
import PricingPage from './PricingPage.vue';
import { useAuthStore } from '../store/auth';
import { useScanStore } from '../store/scan';
import { usageExamples as usageExampleItems } from '../utils/usageExamples';

const authStore = useAuthStore();
const scanStore = useScanStore();
const router = useRouter();
const route = useRoute();

const editorRef = ref(null);
const fileInput = ref(null);
const newMenuRef = ref(null);
const newMenuButtonRef = ref(null);
const activeFeatureCard = ref(null);
const activeQuote = ref('');
const showUsageExamples = ref(false);
const showOnboarding = ref(false);
const onboardingSteps = ref([]);
const onboardingStorageKey = 'ai-detector-onboarding-v1';

const editorMode = ref('edit');
const isScanning = ref(false);
const dragActive = ref(false);
const detectionResults = ref(null);
const highlightedPreviewHtml = ref('');
const showLoginModal = ref(false);
const loginMessage = ref('登录后即可查看完整检测结果。');
const activeResultTab = ref('scan');
const newMenuOpen = ref(false);
const activePanel = ref('home');
const activeHistoryId = ref('');
const activeHistoryTab = ref('scan');
const headerVariant = computed(() => (activePanel.value === 'document' ? 'scan' : 'standard'));

const editorModes = [
  { key: 'edit', label: '编辑模式' },
  { key: 'preview', label: '标色预览' },
];

const functionOptions = [
  { key: 'scan', label: 'AI 检测', icon: ShieldCheckIcon, activeClass: 'border-transparent bg-slate-900 text-white shadow-sm' },
  { key: 'polish', label: '润色', icon: PencilSquareIcon, activeClass: 'border-transparent bg-primary-600 text-white shadow-sm' },
  { key: 'translate', label: '翻译', icon: LanguageIcon, activeClass: 'border-transparent bg-sky-600 text-white shadow-sm' },
  {
    key: 'citation',
    label: '引用核查',
    icon: DocumentMagnifyingGlassIcon,
    activeClass: 'border-transparent bg-emerald-600 text-white shadow-sm',
  },
];

const panelOptions = ['home', 'document', 'history', 'profile', 'qa', 'pricing'];

const motivationalQuotes = [
  '“To survive, you must tell stories.” — Umberto Eco.',
  '“Writing is thinking. To write well is to think clearly.” — David McCullough.',
  '“The secret of getting ahead is getting started.” — Mark Twain.',
  '“Clarity precedes mastery.” — Robin Sharma.',
  '“Precision builds trust in every insight.” — Veritascribe Research.',
];

const buildOnboardingSteps = () => [
  {
    key: 'upload',
    label: '上传文档',
    description: '拖拽或选择文件触发上传与文本提取。',
    status: 'current',
  },
  {
    key: 'scan',
    label: '开始扫描',
    description: '选择功能并点击“立即扫描”获得结果。',
    status: 'upcoming',
  },
  {
    key: 'review',
    label: '查看报告',
    description: '在标色预览和结果标签中浏览句子级洞察。',
    status: 'upcoming',
  },
  {
    key: 'export',
    label: '导出报告',
    description: '将检测结果导出为 JSON 文件便于分享。',
    status: 'upcoming',
  },
];

const userDisplayName = computed(() => {
  const profile = authStore.user?.profile;
  if (profile?.firstName || profile?.surname) {
    return `${profile.firstName || ''} ${profile.surname || ''}`.trim() || profile.firstName || profile.surname || '访客';
  }
  if (authStore.user?.name) return authStore.user.name;
  if (authStore.user?.username) return authStore.user.username;
  if (authStore.user?.email) return authStore.user.email.split('@')[0];
  return '访客';
});

const userPlanTag = computed(() => {
  const plan = authStore.user?.plan || 'personal-free';
  if (plan.includes('team')) return 'TEAM';
  if (plan.includes('edu')) return 'EDU';
  if (plan.includes('pro')) return 'PRO';
  return 'FREE';
});

const pickRandomQuote = () => {
  if (!motivationalQuotes.length) {
    activeQuote.value = '';
    return;
  }
  const index = Math.floor(Math.random() * motivationalQuotes.length);
  activeQuote.value = motivationalQuotes[index];
};

const resetOnboardingSteps = () => {
  onboardingSteps.value = buildOnboardingSteps();
};

const completeOnboarding = () => {
  showOnboarding.value = false;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(onboardingStorageKey, 'done');
  }
};

const dismissOnboarding = () => {
  completeOnboarding();
};

const markOnboardingStep = (key) => {
  if (!showOnboarding.value) return;
  const nextSteps = onboardingSteps.value.map((step) => ({ ...step }));
  const target = nextSteps.find((step) => step.key === key);
  if (!target) return;
  target.status = 'done';
  const remaining = nextSteps.find((step) => step.status !== 'done');
  nextSteps.forEach((step) => {
    if (step.status !== 'done') {
      step.status = remaining && step.key === remaining.key ? 'current' : 'upcoming';
    }
  });
  onboardingSteps.value = nextSteps;
  if (!remaining) {
    completeOnboarding();
  }
};

const maybeShowOnboarding = () => {
  if (!authStore.isAuthenticated) return;
  if (typeof window === 'undefined') return;
  const cached = window.localStorage.getItem(onboardingStorageKey);
  if (cached === 'done') return;
  showOnboarding.value = true;
  resetOnboardingSteps();
};

const featureCards = [
  {
    key: 'advanced',
    title: 'Advanced scan',
    subtitle: '多模型重检，捕捉细微 AI 痕迹',
    icon: SparklesIcon,
    iconClass: 'bg-gradient-to-br from-amber-100 via-violet-100 to-sky-100 text-amber-600',
    tooltip: '高级检测',
    modalTitle: 'Unlock Advanced Scan. Diagnose authorship with depth.',
    modalSubtitle: 'Layer multi-model comparisons to surface nuance and authorship signals instantly.',
    buttonLabel: 'Upgrade to try',
    buttonVariant: 'upgrade',
  },
  {
    key: 'xl',
    title: 'XL Documents',
    subtitle: '跨越 50 页的长文档分段检测',
    icon: Squares2X2Icon,
    iconClass: 'bg-slate-900 text-white',
    tooltip: '长文档支持',
    modalTitle: 'Scan XL Documents. Go beyond a basic AI checker.',
    modalSubtitle: 'Scan up to 50 pages, page by page, simultaneously.',
    buttonLabel: 'Upgrade to try',
    buttonVariant: 'upgrade',
  },
  {
    key: 'vocabulary',
    title: 'AI Vocabulary',
    subtitle: '精选词库保障语气一致',
    icon: BookOpenIcon,
    iconClass: 'bg-emerald-100 text-emerald-600',
    tooltip: '词汇助手',
    tag: 'ENABLED',
    tagClass: 'bg-emerald-100 text-emerald-600',
    modalTitle: "Grow an AI Vocabulary. Keep tone precise and consistent.",
    modalSubtitle: 'Activate curated phrases that reinforce your institution’s voice across every document.',
    buttonLabel: "Try it now — it's free",
    buttonVariant: 'free',
  },
  {
    key: 'citation',
    title: 'Citation check',
    subtitle: '引用对照保障来源可信',
    icon: BookmarkSquareIcon,
    iconClass: 'bg-indigo-100 text-indigo-600',
    tooltip: '引用核查',
    modalTitle: 'Run Citation Check. Trust every sourced claim.',
    modalSubtitle: 'Automatically cross-reference statements with academic databases before submission.',
    buttonLabel: 'Upgrade to try',
    buttonVariant: 'upgrade',
  },
  {
    key: 'plagiarism',
    title: 'Plagiarism',
    subtitle: '跨平台查重，守护原创',
    icon: MagnifyingGlassCircleIcon,
    iconClass: 'bg-rose-100 text-rose-600',
    tooltip: '查重检测',
    modalTitle: 'Deploy Plagiarism Guard. Compare across millions of sources.',
    modalSubtitle: 'Scan assignments against research archives and LMS submissions simultaneously.',
    buttonLabel: 'Upgrade to try',
    buttonVariant: 'upgrade',
  },
];

const ChromeGlyph = markRaw(() =>
  h('svg', { viewBox: '0 0 24 24', class: 'h-5 w-5' }, [
    h('circle', { cx: '12', cy: '12', r: '10', fill: '#E8EAED' }),
    h('path', { d: 'M12 12L21 12A9 9 0 0012 3', fill: '#EA4335' }),
    h('path', { d: 'M12 12L7.5 20.79A9 9 0 0021 12', fill: '#34A853' }),
    h('path', { d: 'M12 12L3 12A9 9 0 0011.99 21', fill: '#FBBC04' }),
    h('circle', { cx: '12', cy: '12', r: '4', fill: '#4285F4' }),
  ]),
);

const integrationButtons = [
  {
    key: 'multi-upload',
    label: 'Multi-file Upload',
    icon: ArrowUpTrayIcon,
    class: 'bg-slate-900 text-white hover:bg-slate-800',
    action: 'multi-upload',
  },
  {
    key: 'api',
    label: 'API',
    icon: CommandLineIcon,
    class: 'bg-purple-600 text-white hover:bg-purple-500',
    action: 'contact',
  },
  {
    key: 'chrome',
    label: 'Chrome',
    icon: ChromeGlyph,
    class: 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300',
    action: 'external',
    href: 'https://chrome.google.com/webstore',
  },
  {
    key: 'canvas',
    label: 'Canvas',
    icon: PaintBrushIcon,
    class: 'bg-orange-500 text-white hover:bg-orange-400',
    action: 'contact',
  },
  {
    key: 'moodle',
    label: 'Moodle',
    icon: AcademicCapIcon,
    class: 'bg-amber-500 text-white hover:bg-amber-400',
    action: 'contact',
  },
  {
    key: 'zapier',
    label: 'Zapier',
    icon: BoltIcon,
    class: 'bg-orange-400 text-white hover:bg-orange-300',
    action: 'external',
    href: 'https://zapier.com',
  },
  {
    key: 'docs',
    label: 'Google Docs',
    icon: DocumentTextIcon,
    class: 'bg-blue-500 text-white hover:bg-blue-400',
    action: 'external',
    href: 'https://docs.google.com',
  },
  {
    key: 'classroom',
    label: 'Google Classroom',
    icon: UserGroupIcon,
    class: 'bg-emerald-500 text-white hover:bg-emerald-400',
    action: 'external',
    href: 'https://classroom.google.com',
  },
];

const isFeatureModalOpen = computed(() => Boolean(activeFeatureCard.value));

const fontSizeMap = {
  small: '2',
  base: '3',
  lg: '4',
  xl: '5',
  '2xl': '6',
};

const characterUsage = computed(() => `字数：${scanStore.characterCount}/${scanStore.characterLimit}`);

const functionLabelMap = computed(() =>
  functionOptions.reduce((acc, option) => {
    acc[option.key] = option.label;
    return acc;
  }, {})
);

const selectedFunctionSummary = computed(() => {
  if (!scanStore.selectedFunctions.length) {
    return 'AI 检测';
  }
  return scanStore.selectedFunctions.map((key) => functionLabelMap.value[key] || key).join('、');
});

const hasResults = computed(() => Boolean(detectionResults.value));

const availableResultTabs = computed(() => {
  const tabs = [{ key: 'scan', label: 'AI 检测' }];
  if (scanStore.selectedFunctions.includes('polish')) {
    tabs.push({ key: 'polish', label: '润色建议' });
  }
  if (scanStore.selectedFunctions.includes('translate')) {
    tabs.push({ key: 'translate', label: '翻译结果' });
  }
  if (scanStore.selectedFunctions.includes('citation')) {
    tabs.push({ key: 'citation', label: '引用核查' });
  }
  return tabs;
});

const historyRecords = computed(() => scanStore.historyRecords);

const activeHistoryRecord = computed(() => historyRecords.value.find((item) => item.id === activeHistoryId.value));

const historyFunctionSummary = computed(() => {
  if (!activeHistoryRecord.value) {
    return 'AI 检测';
  }
  if (!Array.isArray(activeHistoryRecord.value.functions) || !activeHistoryRecord.value.functions.length) {
    return 'AI 检测';
  }
  return activeHistoryRecord.value.functions
    .map((key) => functionLabelMap.value[key] || key)
    .join('、');
});

const availableHistoryTabs = computed(() => {
  const record = activeHistoryRecord.value;
  const analysis = record?.analysis;
  if (!record || !analysis) {
    return [];
  }
  const tabs = [{ key: 'scan', label: 'AI 检测' }];
  if (record.functions.includes('polish') && analysis.polish?.length) {
    tabs.push({ key: 'polish', label: '润色建议' });
  }
  if (record.functions.includes('translate') && analysis.translation) {
    tabs.push({ key: 'translate', label: '翻译结果' });
  }
  if (record.functions.includes('citation') && analysis.citations?.length) {
    tabs.push({ key: 'citation', label: '引用核查' });
  }
  return tabs;
});

const historyPreviewHtml = computed(() => {
  const record = activeHistoryRecord.value;
  if (!record) return '';
  if (record.analysis?.highlightedHtml) {
    return record.analysis.highlightedHtml;
  }
  if (record.editorHtml) {
    return record.editorHtml;
  }
  if (record.inputText) {
    return escapeHtml(record.inputText).replace(/\n/g, '<br>');
  }
  return '';
});

const historyCharacterUsage = computed(() => {
  const record = activeHistoryRecord.value;
  const length = record?.inputText ? record.inputText.length : 0;
  return `字数：${length}/${scanStore.characterLimit}`;
});

const highlightBorderClass = (type) => {
  if (type === 'ai') return 'border-amber-200 bg-amber-50';
  if (type === 'mixed') return 'border-violet-200 bg-violet-50';
  return 'border-emerald-200 bg-emerald-50';
};

const citationStatusClass = (status) => {
  if (status === '缺失引用') {
    return 'bg-rose-100 text-rose-600';
  }
  if (status === '待验证') {
    return 'bg-amber-100 text-amber-600';
  }
  return 'bg-emerald-100 text-emerald-600';
};

const marketingReasons = {
  ai: '句式重复且缺少真实细节，呈现出明显的模板化生成痕迹。',
  mixed: '部分句子自然，但仍夹杂模型常见的衔接词与泛化表达。',
  human: '语句包含个性化经历与细节，语气自然贴近人类写作。',
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const tokenizeText = (text = '') => {
  const normalized = String(text).replace(/\r\n/g, '\n');
  const regex = /([^\n。！？!?]+[。！？!?]?|\n)/g;
  const tokens = [];
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const raw = match[0];
    if (raw === '\n') {
      tokens.push({ type: 'break', raw });
      continue;
    }
    const trimmed = raw.trim();
    if (!trimmed) continue;
    tokens.push({ type: 'sentence', raw, text: trimmed });
  }
  return tokens;
};

const buildHighlightedHtml = (tokens, sentences) => {
  const classMap = {
    ai: 'bg-amber-100 text-amber-900',
    mixed: 'bg-violet-100 text-violet-900',
    human: 'bg-emerald-100 text-emerald-900',
  };
  let sentenceIndex = 0;
  return tokens
    .map((token) => {
      if (token.type === 'break') {
        return '<br />';
      }
      const sentence = sentences[sentenceIndex];
      sentenceIndex += 1;
      if (!sentence) {
        return `<span class="highlight-chip">${escapeHtml(token.raw)}</span>`;
      }
      const classes = classMap[sentence.type] || 'bg-slate-100 text-slate-700';
      return `<span class="highlight-chip ${classes}" data-sentence-id="${sentence.id}">${escapeHtml(token.raw)}</span>`;
    })
    .join('');
};

const parsePanel = (value) => {
  if (typeof value !== 'string') return 'home';
  return panelOptions.includes(value) ? value : 'home';
};

const syncPanelToRoute = (panel) => {
  const query = { ...route.query };
  if (panel === 'home') {
    if (!('panel' in query)) {
      return;
    }
    delete query.panel;
  } else {
    if (query.panel === panel) {
      return;
    }
    query.panel = panel;
  }
  router.replace({ name: 'dashboard', query });
};

const setActivePanel = (panel) => {
  const next = parsePanel(panel);
  if (activePanel.value === next) return;
  activePanel.value = next;
};

const isPanelActive = (panel) => activePanel.value === panel;

const selectHistoryRecord = (id) => {
  if (activeHistoryId.value === id) return;
  activeHistoryId.value = id;
  activeHistoryTab.value = 'scan';
};

const formatHistoryTimestamp = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const buildHistoryTitle = () => {
  if (scanStore.lastUploadedFileName) {
    return `文件 · ${scanStore.lastUploadedFileName}`;
  }
  const raw = (scanStore.inputText || '').trim();
  if (!raw) {
    return '';
  }
  return raw.length > 24 ? `${raw.slice(0, 24)}…` : raw;
};

const formatHistorySummary = (record) => {
  if (!record?.analysis?.summary) {
    return 'AI 检测';
  }
  const { ai = 0, mixed = 0, human = 0 } = record.analysis.summary;
  return `AI ${ai}% · Mixed ${mixed}% · Human ${human}%`;
};

const classifyOrder = ['ai', 'mixed', 'human'];

const simulateAnalysis = () => {
  const text = scanStore.inputText.trim();
  const tokens = tokenizeText(text);
  const sentenceTokens = tokens.filter((token) => token.type === 'sentence');

  if (!sentenceTokens.length) {
    return {
      summary: { ai: 0, mixed: 0, human: 100 },
      sentences: [],
      translation: '尚未检测到可分析的句子，请输入文本后重新扫描。',
      polish: [],
      citations: [],
      aiLikelyCount: 0,
      highlightedHtml: '<p class="text-sm text-slate-400">暂无内容，请先输入文本。</p>',
    };
  }

  const counts = { ai: 0, mixed: 0, human: 0 };
  const sentences = sentenceTokens.map((token, index) => {
    const type = classifyOrder[index % classifyOrder.length];
    counts[type] += 1;
    const probability =
      type === 'ai'
        ? Number((0.72 + (index % 3) * 0.06).toFixed(2))
        : type === 'mixed'
        ? Number((0.46 + (index % 3) * 0.08).toFixed(2))
        : Number((0.18 + (index % 3) * 0.05).toFixed(2));
    return {
      id: `sentence-${index}`,
      text: token.text,
      raw: token.raw,
      type,
      probability,
      reason: marketingReasons[type],
    };
  });

  const total = sentences.length;
  const summary = {
    ai: Math.round((counts.ai / total) * 100),
    mixed: Math.round((counts.mixed / total) * 100),
    human: Math.round((counts.human / total) * 100),
  };
  const diff = summary.ai + summary.mixed + summary.human - 100;
  if (diff !== 0) {
    summary.human = Math.max(0, summary.human - diff);
  }

  const translation = sentenceTokens
    .map((token, index) => `第 ${index + 1} 句：${token.text} → ${token.text.replace(/。?$/, '。')}【示例译文】`)
    .join('\n');

  const polish = sentences.slice(0, Math.min(4, sentences.length)).map((item, index) => ({
    id: `polish-${index}`,
    original: item.text,
    suggestion: `${item.text.replace(/。?$/, '')}，加入更具体的事实与数据以增强可信度。`,
    reason:
      item.type === 'human'
        ? '优化语气以保持整体风格一致。'
        : '改写句式并补充细节，以降低模型生成痕迹。',
  }));

  const citations = sentenceTokens.slice(0, Math.min(3, sentenceTokens.length)).map((token, index) => {
    const statusCycle = ['待验证', '缺失引用', '已找到线索'];
    return {
      id: `citation-${index}`,
      excerpt: token.text,
      status: statusCycle[index % statusCycle.length],
      note:
        statusCycle[index % statusCycle.length] === '缺失引用'
          ? '未检测到权威来源，请补充引用。'
          : statusCycle[index % statusCycle.length] === '待验证'
          ? '建议补充出处或核查现有来源准确性。'
          : '已匹配到可能的来源，请确认引用格式。',
    };
  });

  return {
    summary,
    sentences,
    translation,
    polish,
    citations,
    aiLikelyCount: counts.ai + counts.mixed,
    highlightedHtml: buildHighlightedHtml(tokens, sentences),
  };
};

const syncEditorFromStore = () => {
  if (!editorRef.value) return;
  const html = scanStore.editorHtml || '';
  if (editorRef.value.innerHTML !== html) {
    editorRef.value.innerHTML = html;
  }
};

onMounted(() => {
  syncEditorFromStore();
  const initialPanel = parsePanel(route.query.panel);
  activePanel.value = initialPanel;
  if (initialPanel === 'home') {
    pickRandomQuote();
  }
  if (historyRecords.value.length && !activeHistoryId.value) {
    activeHistoryId.value = historyRecords.value[0].id;
  }
  const features = parseFeatures(route.query.features);
  if (features.length) {
    scanStore.setFunctions(features);
  }
  maybeShowOnboarding();
  document.addEventListener('click', onGlobalClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick);
  document.removeEventListener('keydown', featureModalKeyHandler);
});

watch(
  () => scanStore.editorHtml,
  () => {
    syncEditorFromStore();
  }
);

watch(availableResultTabs, (tabs) => {
  if (!tabs.find((tab) => tab.key === activeResultTab.value)) {
    activeResultTab.value = 'scan';
  }
});

watch(
  () => authStore.isAuthenticated,
  (value) => {
    if (value) {
      maybeShowOnboarding();
    } else {
      showOnboarding.value = false;
    }
  }
);

watch(
  () => route.query.panel,
  (value) => {
    const next = parsePanel(value);
    if (activePanel.value !== next) {
      activePanel.value = next;
    }
  }
);

watch(activePanel, (panel) => {
  syncPanelToRoute(panel);
  if (panel === 'history') {
    if (!activeHistoryId.value && historyRecords.value.length) {
      activeHistoryId.value = historyRecords.value[0].id;
    }
  } else {
    activeHistoryTab.value = 'scan';
  }
  if (panel === 'home') {
    pickRandomQuote();
  } else {
    closeFeatureModal();
  }
});

watch(isFeatureModalOpen, (open) => {
  if (typeof window === 'undefined') return;
  if (open) {
    document.addEventListener('keydown', featureModalKeyHandler);
  } else {
    document.removeEventListener('keydown', featureModalKeyHandler);
  }
});

watch(
  historyRecords,
  (records) => {
    if (!records.length) {
      activeHistoryId.value = '';
      return;
    }
    if (!records.find((item) => item.id === activeHistoryId.value)) {
      activeHistoryId.value = records[0].id;
    }
  },
  { deep: true }
);

watch(availableHistoryTabs, (tabs) => {
  if (!tabs.length) {
    activeHistoryTab.value = 'scan';
    return;
  }
  if (!tabs.find((tab) => tab.key === activeHistoryTab.value)) {
    activeHistoryTab.value = tabs[0].key;
  }
});

watch(
  () => route.query.features,
  (value) => {
    const features = parseFeatures(value);
    if (features.length) {
      scanStore.setFunctions(features);
    }
  }
);

const parseFeatures = (value) => {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => ['scan', 'polish', 'translate', 'citation'].includes(item));
};

const formatHighlightedSentence = (sentence) => {
  const colorMap = {
    ai: 'text-amber-700',
    mixed: 'text-violet-700',
    human: 'text-emerald-700',
  };
  return `<span class="font-semibold ${colorMap[sentence.type] || ''}">${escapeHtml(sentence.text)}</span>`;
};

const openFeatureModal = (card) => {
  if (!card) return;
  activeFeatureCard.value = card;
};

const handleFeatureModalAction = (card) => {
  if (!card) return;
  if (card.buttonVariant === 'upgrade') {
    closeFeatureModal();
    setActivePanel('pricing');
    return;
  }
  if (card.buttonVariant === 'free') {
    closeFeatureModal();
    setActivePanel('document');
  }
};

const closeFeatureModal = () => {
  activeFeatureCard.value = null;
};

const featureModalKeyHandler = (event) => {
  if (event.key === 'Escape') {
    closeFeatureModal();
  }
};

const handleIntegrationAction = (integration) => {
  if (!integration) return;
  if (integration.action === 'multi-upload') {
    router.push({ name: 'multi-upload' });
    return;
  }
  if (integration.action === 'contact') {
    router.push({ name: 'contact' });
    return;
  }
  if (integration.action === 'document') {
    setActivePanel('document');
    return;
  }
  if (integration.action === 'external' && integration.href && typeof window !== 'undefined') {
    window.open(integration.href, '_blank', 'noopener');
  }
};

const applyExample = (key) => {
  scanStore.applyExample(key);
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
  nextTick(() => {
    syncEditorFromStore();
  });
};

const isFunctionSelected = (key) => scanStore.selectedFunctions.includes(key);

const toggleFunction = (key) => {
  scanStore.toggleFunction(key);
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
};

const onEditorInput = (event) => {
  scanStore.setEditorHtml(event.target.innerHTML);
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
};

const applyCommand = (command) => {
  if (!editorRef.value) return;
  editorRef.value.focus();
  document.execCommand(command, false, null);
  scanStore.setEditorHtml(editorRef.value.innerHTML);
  scanStore.commitDraftToStorage();
};

const onFontSizeChange = (event) => {
  const value = event.target.value;
  if (!value) return;
  if (!editorRef.value) return;
  editorRef.value.focus();
  document.execCommand('fontSize', false, fontSizeMap[value]);
  event.target.value = '';
  scanStore.setEditorHtml(editorRef.value.innerHTML);
  scanStore.commitDraftToStorage();
};

const handleScan = async () => {
  if (!scanStore.selectedFunctions.length) {
    scanStore.setFunctions(['scan']);
  }

  if (!authStore.isAuthenticated) {
    loginMessage.value = '请登录后开始扫描并查看检测结果。';
    showLoginModal.value = true;
    return;
  }

  if (!scanStore.inputText.trim()) {
    loginMessage.value = '请先输入文本或上传文件，再开始扫描。';
    showLoginModal.value = true;
    return;
  }

  isScanning.value = true;
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const analysis = simulateAnalysis();
  detectionResults.value = analysis;
  highlightedPreviewHtml.value = analysis.highlightedHtml;
  editorMode.value = 'preview';
  activeResultTab.value = 'scan';
  markOnboardingStep('scan');
  markOnboardingStep('review');
  isScanning.value = false;
  scanStore.commitDraftToStorage();
};

const exportReport = () => {
  if (!detectionResults.value) return;
  const payload = {
    summary: detectionResults.value.summary,
    sentences: detectionResults.value.sentences,
    translation: detectionResults.value.translation,
    input: scanStore.inputText,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ai-detection-report.json';
  link.click();
  URL.revokeObjectURL(url);
  markOnboardingStep('export');
};

const resetEditor = () => {
  scanStore.resetText();
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
  nextTick(() => {
    syncEditorFromStore();
  });
  scanStore.commitDraftToStorage();
};

const applyPolishSuggestion = (suggestion) => {
  if (!suggestion?.original || !suggestion?.suggestion) return;
  const updated = scanStore.inputText.replace(suggestion.original, suggestion.suggestion);
  scanStore.setText(updated);
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
  nextTick(() => {
    syncEditorFromStore();
  });
  scanStore.commitDraftToStorage();
};

const triggerUpload = () => {
  scanStore.resetError();
  fileInput.value?.click();
};

const onFileChange = async (event) => {
  const [file] = event.target.files || [];
  if (!file) return;
  try {
    await scanStore.readFile(file);
    detectionResults.value = null;
    highlightedPreviewHtml.value = '';
    editorMode.value = 'edit';
    nextTick(() => {
      syncEditorFromStore();
    });
    markOnboardingStep('upload');
  } catch (error) {
    console.error(error);
  } finally {
    event.target.value = '';
    scanStore.commitDraftToStorage();
  }
};

const triggerMultiUpload = () => {
  newMenuOpen.value = false;
  router.push({ name: 'multi-upload' });
};

const onDragEnter = () => {
  dragActive.value = true;
};

const onDragOver = () => {
  dragActive.value = true;
};

const onDragLeave = () => {
  dragActive.value = false;
};

const onDrop = async (event) => {
  dragActive.value = false;
  const files = event.dataTransfer?.files;
  if (!files?.length) return;
  try {
    await scanStore.readFiles(files);
    detectionResults.value = null;
    highlightedPreviewHtml.value = '';
    editorMode.value = 'edit';
    nextTick(() => {
      syncEditorFromStore();
    });
    markOnboardingStep('upload');
  } catch (error) {
    console.error(error);
  } finally {
    scanStore.commitDraftToStorage();
  }
};

const goToProfile = () => {
  setActivePanel('profile');
};

const goToQA = () => {
  setActivePanel('qa');
};

const startNewScan = () => {
  newMenuOpen.value = false;
  setActivePanel('document');
  scanStore.resetAll();
  detectionResults.value = null;
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
  activeResultTab.value = 'scan';
  nextTick(() => {
    syncEditorFromStore();
  });
  scanStore.commitDraftToStorage();
};

const toggleNewMenu = () => {
  newMenuOpen.value = !newMenuOpen.value;
};

const onGlobalClick = (event) => {
  if (!newMenuOpen.value) return;
  const target = event.target;
  if (newMenuRef.value?.contains(target) || newMenuButtonRef.value?.contains(target)) return;
  newMenuOpen.value = false;
};

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.nav-item {
  @apply flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-600;
}
.nav-item--active {
  @apply border-slate-900 bg-slate-900 text-white shadow;
}
.menu-item {
  @apply flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100;
}

.toolbar-button {
  @apply inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-600;
}

.toolbar-select select {
  @apply rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600 focus:outline-none;
}

.editor-surface {
  @apply h-full overflow-y-auto px-6 pt-6 pb-48 text-sm leading-relaxed text-slate-700 focus:outline-none;
}

.editor-surface:empty::before {
  content: attr(data-placeholder);
  @apply text-slate-400;
}

.preview-surface {
  @apply h-full overflow-y-auto px-6 pt-6 pb-48 text-sm leading-relaxed text-slate-700;
}

.highlight-chip {
  @apply rounded-xl px-1.5 py-0.5;
}

.function-chip {
  @apply inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition;
}

.rounded-4xl {
  border-radius: 2rem;
}
</style>
