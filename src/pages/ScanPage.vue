<template>
  <div class="min-h-screen bg-neutral-50 font-sans selection:bg-primary-100 selection:text-primary-900">
    <AppHeader mode="dashboard" :dashboard-context="headerVariant" />
    <div class="relative flex flex-col lg:flex-row">
      <aside class="hidden w-20 flex-shrink-0 flex-col self-stretch border-r border-neutral-100 bg-white px-4 py-8 lg:flex lg:min-h-[calc(100vh-4rem)] xl:w-72 transition-all duration-300 ease-in-out">
        <nav class="space-y-1">
          <button
            type="button"
            :class="['nav-item group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200', isPanelActive('home') ? 'bg-gradient-to-r from-primary-100 to-primary-50 text-primary-800 shadow-sm ring-1 ring-primary-200' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900']"
            @click="setActivePanel('home')"
          >
            <HomeIcon :class="['h-5 w-5 transition-colors', isPanelActive('home') ? 'text-primary-700' : 'text-neutral-400 group-hover:text-neutral-600']" />
            <span class="nav-label">{{ t('scan.nav.home') }}</span>
          </button>
          <button
            type="button"
            :class="['nav-item group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200', isPanelActive('document') ? 'bg-gradient-to-r from-primary-100 to-primary-50 text-primary-800 shadow-sm ring-1 ring-primary-200' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900']"
            @click="setActivePanel('document')"
          >
            <DocumentTextIcon :class="['h-5 w-5 transition-colors', isPanelActive('document') ? 'text-primary-700' : 'text-neutral-400 group-hover:text-neutral-600']" />
            <span class="nav-label">{{ t('scan.nav.document') }}</span>
          </button>
          <div class="relative pt-4">
            <button
              ref="newMenuButtonRef"
              type="button"
              class="nav-item group relative flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary-900/10 ring-1 ring-primary-400/30 transition-all hover:-translate-y-0.5 hover:from-primary-800 hover:via-primary-700 hover:to-primary-600 hover:shadow-md hover:shadow-primary-900/15"
              @click="toggleNewMenu"
            >
              <PlusIcon class="h-4 w-4 text-white" />
              <span class="nav-label text-white">{{ t('scan.nav.new') }}</span>
            </button>
            <transition
              name="fade"
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="newMenuOpen"
                ref="newMenuRef"
                class="absolute left-0 right-0 top-full z-20 mt-2 w-full origin-top rounded-xl border border-neutral-100 bg-white p-1.5 shadow-premium text-sm"
              >
                <button type="button" class="w-full rounded-lg px-3 py-2 text-left text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-colors" @click="startNewScan">{{ t('scan.nav.newScan') }}</button>
                <button
                  type="button"
                  class="w-full rounded-lg px-3 py-2 text-left text-neutral-400 cursor-not-allowed"
                  @click="triggerMultiUpload"
                >
                  {{ t('scan.nav.multiUpload') }}
                </button>
              </div>
            </transition>
          </div>
        </nav>
        <div class="m-2 mt-8 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 p-4 text-xs leading-relaxed text-neutral-500">
          <p>{{ t('scan.sidebarTip') }}</p>
        </div>
        <div v-if="authStore.isAuthenticated" class="mt-6 space-y-1 border-t border-neutral-100 pt-6">
          <button
            type="button"
            :class="['nav-item group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200', isPanelActive('profile') ? 'bg-gradient-to-r from-primary-100 to-primary-50 text-primary-800 shadow-sm ring-1 ring-primary-200' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900']"
            @click="goToProfile"
          >
            <Cog6ToothIcon :class="['h-5 w-5 transition-colors', isPanelActive('profile') ? 'text-primary-700' : 'text-neutral-400 group-hover:text-neutral-600']" />
            <span class="nav-label">{{ t('scan.nav.settings') }}</span>
          </button>
            <button
              type="button"
              :class="['nav-item group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200', isPanelActive('qa') ? 'bg-gradient-to-r from-primary-100 to-primary-50 text-primary-800 shadow-sm ring-1 ring-primary-200' : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900']"
              @click="setActivePanel('qa')"
            >
              <QuestionMarkCircleIcon :class="['h-5 w-5 transition-colors', isPanelActive('qa') ? 'text-primary-700' : 'text-neutral-400 group-hover:text-neutral-600']" />
              <span class="nav-label">{{ t('scan.nav.qa') }}</span>
            </button>
        </div>
      </aside>

      <main class="relative z-0 flex min-h-[calc(100vh-4rem)] flex-1 flex-col">
        <div v-if="isPanelActive('home')" class="relative flex-1 isolate px-6 py-10 lg:px-12">
          <!-- Background Mesh Gradients -->
          <div class="fixed inset-0 -z-10 pointer-events-none">
             <div class="absolute top-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-primary-100/28 blur-3xl mix-blend-multiply filter"></div>
             <div class="absolute top-[20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-100/24 blur-3xl mix-blend-multiply filter"></div>
             <div class="absolute bottom-[-10%] right-[10%] h-[600px] w-[600px] rounded-full bg-sky-100/20 blur-3xl mix-blend-multiply filter"></div>
          </div>
          <div
            :class="[
              'mx-auto flex w-full max-w-7xl flex-col gap-12',
              isFeatureModalOpen ? 'pointer-events-none select-none filter blur-sm transition-all duration-300' : 'transition-all duration-300',
            ]"
          >
            <header class="flex flex-col gap-6">
              <div class="space-y-4">
                <div class="flex flex-wrap items-end gap-4">
                  <h1 class="text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900">
                    {{ t('scan.welcome.title', { name: userDisplayName }) }}
                  </h1>
                  <span class="mb-1.5 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-700/10">
                    {{ userPlanTag }}
                  </span>
                </div>
                <p class="max-w-2xl text-lg font-light text-neutral-500 leading-relaxed">{{ activeQuote }}</p>
              </div>
              <OnboardingStepsBar
                v-if="showOnboarding"
                :steps="onboardingSteps"
                @skip="dismissOnboarding"
                @complete="completeOnboarding"
                class="mt-4"
              />
            </header>

            <section class="grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
              <div class="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#31424d_0%,#283943_100%)] p-8 text-white shadow-xl shadow-slate-300/40">
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,190,206,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(165,209,193,0.16),transparent_28%)]"></div>
                <div class="relative z-10">
                  <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div class="max-w-2xl">
                      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-sky-100">{{ dashboardHomeCopy.commandCenterEyebrow }}</p>
                      <h2 class="mt-3 text-3xl font-semibold tracking-tight text-white">{{ dashboardHomeCopy.commandCenterTitle }}</h2>
                      <p class="mt-3 text-sm leading-7 text-slate-300">{{ dashboardHomeCopy.commandCenterSubtitle }}</p>
                    </div>
                  </div>

                  <div class="mt-8 grid gap-4 sm:grid-cols-3">
                    <div
                      v-for="item in homeStatCards"
                      :key="item.label"
                      class="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                    >
                      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ item.label }}</p>
                      <p class="mt-3 text-3xl font-semibold tracking-tight text-white">{{ item.value }}</p>
                      <p class="mt-1 text-xs text-slate-400">{{ item.description }}</p>
                    </div>
                  </div>

                  <div class="mt-8 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ t('scan.quickLaunch.badge') }}</p>
                        <h3 class="mt-3 text-2xl font-semibold tracking-tight text-white">{{ t('scan.quickLaunch.title') }}</h3>
                        <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{{ t('scan.quickLaunch.description') }}</p>
                      </div>
                      <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sky-100">
                        <DocumentTextIcon class="h-7 w-7" />
                      </div>
                    </div>
                    <div class="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        class="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-50"
                        @click="startNewScan"
                      >
                        {{ dashboardHomeCopy.primaryCta }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-[2rem] border border-slate-200/70 bg-[#fbfcfa]/95 p-7 shadow-lg shadow-slate-200/80">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ dashboardHomeCopy.snapshotEyebrow }}</p>
                    <h3 class="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">{{ dashboardHomeCopy.snapshotTitle }}</h3>
                  </div>
                  <span class="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-primary-700/10">
                    {{ dashboardHomeCopy.snapshotBadge }}
                  </span>
                </div>
                <div v-if="homeActivityItems.length" class="mt-6 space-y-3">
                  <button
                    v-for="item in homeActivityItems"
                    :key="item.recordId"
                    type="button"
                    class="group w-full rounded-3xl border border-neutral-200/80 bg-[#fdfefd] px-5 py-4 text-left shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md hover:shadow-slate-200/80"
                    @click="openHistoryRecord(item.recordId)"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-neutral-900">{{ item.title }}</p>
                        <p class="mt-1 text-sm leading-6 text-neutral-500">{{ item.summary }}</p>
                      </div>
                      <span :class="['inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]', item.badgeClass]">
                        {{ item.badge }}
                      </span>
                    </div>
                    <div class="mt-3 flex items-center justify-between gap-3">
                      <p class="text-xs text-neutral-400">{{ item.meta }}</p>
                      <ArrowRightIcon class="h-4 w-4 text-neutral-300 transition group-hover:text-primary-500" />
                    </div>
                  </button>
                </div>
                <div v-else class="mt-6 rounded-3xl border border-dashed border-neutral-200 bg-[#fdfefd] px-5 py-6">
                  <p class="text-sm font-semibold text-neutral-900">{{ dashboardHomeCopy.activity.emptyTitle }}</p>
                  <p class="mt-2 text-sm leading-6 text-neutral-500">{{ dashboardHomeCopy.activity.emptyDescription }}</p>
                  <button
                    type="button"
                    class="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500"
                    @click="startNewScan"
                  >
                    <span>{{ dashboardHomeCopy.activity.emptyCta }}</span>
                    <ArrowRightIcon class="h-4 w-4" />
                  </button>
                </div>
                <button
                  v-if="homeActivityItems.length"
                  type="button"
                  class="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-600"
                  @click="runHomeAction('history')"
                >
                  <span>{{ dashboardHomeCopy.snapshotCta }}</span>
                  <ArrowRightIcon class="h-4 w-4" />
                </button>
              </div>
            </section>

            <section class="grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
              <div class="rounded-[2rem] border border-slate-200/70 bg-[#fbfcfa]/95 p-7 shadow-lg shadow-slate-200/80">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400">{{ t('scan.features.title') }}</h3>
                    <p class="mt-2 text-sm text-neutral-500">{{ t('scan.features.subtitle') }}</p>
                  </div>
                </div>
                <div class="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <button
                    v-for="card in featureCards"
                    :key="card.key"
                    type="button"
                    :title="card.tooltip"
                    :disabled="card.disabled"
                    :aria-disabled="card.disabled"
                    :class="[
                      'group relative rounded-2xl p-6 text-left ring-1 transition-all',
                      card.disabled
                        ? 'cursor-not-allowed bg-slate-50/95 text-slate-500 ring-slate-200/80 opacity-80 grayscale'
                        : 'cursor-pointer bg-neutral-50/90 ring-neutral-200/70 hover:-translate-y-1 hover:bg-white hover:shadow-lg hover:shadow-primary-500/10 hover:ring-primary-200',
                    ]"
                    @click="openFeatureModal(card)"
                  >
                    <div class="flex items-center justify-between">
                      <div :class="['flex h-10 w-10 items-center justify-center rounded-xl transition-colors', card.iconClass]">
                        <component :is="card.icon" class="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span
                        v-if="card.tag"
                        :class="['inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', card.tagClass || 'bg-neutral-100 text-neutral-500']"
                      >
                        {{ card.tag }}
                      </span>
                    </div>
                    <div class="mt-4">
                      <p class="text-sm font-semibold text-neutral-900">{{ card.title }}</p>
                      <p class="mt-1 text-xs leading-5 text-neutral-500">{{ card.subtitle }}</p>
                    </div>
                  </button>
                </div>
              </div>

              <div class="flex flex-col gap-6">
                <div class="rounded-[2rem] border border-slate-200/70 bg-[#fbfcfa]/95 p-7 shadow-lg shadow-slate-200/80">
                  <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400">{{ dashboardHomeCopy.actionsTitle }}</h3>
                  <div class="mt-5 space-y-3">
                    <button
                      v-for="item in homeActionItems"
                      :key="item.key"
                      type="button"
                      class="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-4 text-left transition hover:border-primary-200 hover:bg-white hover:shadow-sm"
                      @click="runHomeAction(item.key)"
                    >
                      <div>
                        <p class="text-sm font-semibold text-neutral-900">{{ item.title }}</p>
                        <p class="mt-1 text-xs leading-5 text-neutral-500">{{ item.description }}</p>
                      </div>
                      <ArrowRightIcon class="h-4 w-4 text-neutral-400" />
                    </button>
                  </div>
                </div>

                <section v-if="showIntegrationHub" class="rounded-[2rem] border border-slate-200/70 bg-[#fbfcfa]/95 p-7 shadow-lg shadow-slate-200/80">
                  <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">{{ t('scan.integrations.title') }}</h3>
                  <div class="mt-5 flex flex-wrap gap-3">
                    <button
                      v-for="integration in integrationButtons"
                      :key="integration.key"
                      type="button"
                      :class="[
                        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
                        integration.class,
                        integration.isAvailable ? 'hover:-translate-y-0.5 hover:shadow-md' : 'opacity-80',
                      ]"
                      @click="handleIntegrationAction(integration)"
                    >
                      <component :is="integration.icon" class="h-5 w-5" aria-hidden="true" />
                      <span>{{ integration.label }}</span>
                      <span class="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        {{ integration.status }}
                      </span>
                    </button>
                  </div>
                </section>
              </div>
            </section>

            <section v-if="false" class="rounded-4xl border border-slate-200 bg-blue-50/90 px-8 py-8 shadow-sm">
              <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div class="max-w-2xl space-y-2">
                  <span class="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">{{ t('scan.educator.badge') }}</span>
                  <h3 class="text-2xl font-semibold tracking-tight text-slate-900">{{ t('scan.educator.title') }}</h3>
                  <p class="text-sm leading-relaxed text-slate-600">
                    {{ t('scan.educator.description') }}
                  </p>
                </div>
                <div class="flex items-center gap-6">
                  <button
                    type="button"
                    class="inline-flex cursor-not-allowed items-center justify-center rounded-full bg-sky-600/70 px-5 py-2 text-sm font-semibold text-white shadow"
                    @click="triggerComingSoon(t('scan.educator.title'))"
                  >
                    {{ t('scan.educator.cta') }}
                  </button>
                  <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-inner">
                    <svg class="h-10 w-10 text-sky-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h10M7 12h6m-6 5h10M9 5l-2 2 2 2M17 5l2 2-2 2" />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

          <transition name="fade">
            <div
              v-if="isFeatureModalOpen"
              class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/24 backdrop-blur-sm"
              @click="closeFeatureModal"
            >
              <div
                class="w-full max-w-xl rounded-4xl bg-[#fbfcfa] p-8 shadow-xl shadow-slate-300/35"
                @click.stop
              >
                <div class="space-y-6 text-center">
                  <div class="space-y-2">
                    <h3 class="text-2xl font-semibold tracking-tight text-slate-900">{{ activeFeatureCard?.modalTitle }}</h3>
                    <p class="text-sm text-slate-500">{{ activeFeatureCard?.modalSubtitle }}</p>
                  </div>
                  <div class="flex h-48 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50">
                    <span class="text-sm font-semibold text-slate-400">{{ t('scan.featureModal.placeholder') }}</span>
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

        <div v-if="isPanelActive('document')" class="relative z-0 flex min-h-[calc(100vh-4rem)] flex-col">
          <div class="sticky top-0 z-10 border-b border-neutral-100 bg-white/80 px-6 py-4 backdrop-blur-md transition-all">
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)_24rem] lg:items-center xl:grid-cols-[20rem_minmax(0,1fr)_28rem]">
              <div class="flex flex-wrap items-center gap-3">
                <div class="inline-flex items-center overflow-hidden rounded-lg bg-neutral-100/80 p-1 text-xs font-semibold text-neutral-600 ring-1 ring-black/5">
                  <button
                    v-for="mode in editorModes"
                    :key="mode.key"
                    type="button"
                    :class="[
                      'rounded-md px-4 py-1.5 transition-all duration-200 ease-out',
                      editorMode === mode.key ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-black/5' : 'text-neutral-500 hover:text-neutral-900',
                      mode.key === 'preview' && !hasResults ? 'pointer-events-none opacity-40' : '',
                    ]"
                    @click="editorMode = mode.key"
                  >
                    {{ mode.label }}
                  </button>
                </div>
                <button
                  type="button"
                  class="inline-flex items-center rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-primary-600"
                  @click="resetEditor"
                >
                  {{ t('scan.editor.reset') }}
                </button>
              </div>
              <div class="flex justify-end">
                <button
                  v-if="hasResults"
                  type="button"
                  class="inline-flex items-center rounded-full border border-primary-200 bg-white px-4 py-2 text-xs font-semibold text-primary-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50"
                  @click="openResultDetail"
                >
                  {{ t('scan.results.openDetail') }}
                </button>
              </div>
              <div class="flex flex-wrap items-center gap-4 text-xs font-medium text-neutral-400 lg:justify-end">
                <span :class="{ 'text-primary-600': characterCount > 0 && !isOverCharacterLimit, 'text-rose-600': isOverCharacterLimit }">{{ characterUsage }}</span>
                <span class="h-4 w-px bg-neutral-200"></span>
                <span>{{ t('scan.editor.selectedFunctions', { value: selectedFunctionSummary }) }}</span>
                <span v-if="scanStore.lastUploadedFileName" class="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-primary-700">
                  <ArrowUpTrayIcon class="h-3 w-3" />
                  {{ scanStore.lastUploadedFileName }}
                </span>
              </div>
            </div>
            <div v-if="scanStore.uploadError || scanStore.analysisError?.message" class="mt-3 space-y-2">
              <p v-if="scanStore.uploadError" class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {{ scanStore.uploadError }}
              </p>
              <p v-if="scanStore.analysisError?.message" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                {{ scanStore.analysisError.message }}
              </p>
            </div>
          </div>

          <div class="flex flex-1 flex-col lg:min-h-[calc(100vh-10rem)] lg:flex-row">
            <aside class="flex w-full flex-col border-b border-neutral-100 bg-white/75 px-4 py-5 lg:w-72 lg:border-b-0 lg:border-r xl:w-80">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h2 class="text-sm font-bold text-neutral-900">{{ t('scan.history.conversationTitle') }}</h2>
                  <p class="mt-1 text-xs leading-5 text-neutral-500">{{ t('scan.history.conversationSubtitle') }}</p>
                </div>
                <button
                  type="button"
                  class="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-primary-200 hover:text-primary-700"
                  @click="toggleHistoryManageMode"
                >
                  {{ isHistoryManaging ? t('scan.history.doneManage') : t('scan.history.manage') }}
                </button>
              </div>

              <label class="mt-4 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-500 shadow-sm">
                <MagnifyingGlassCircleIcon class="h-4 w-4 flex-shrink-0 text-neutral-400" />
                <input
                  v-model="historySearchQuery"
                  type="search"
                  class="min-w-0 flex-1 bg-transparent text-sm font-medium text-neutral-700 outline-none placeholder:text-neutral-400"
                  :placeholder="t('scan.history.searchPlaceholder')"
                />
                <button
                  v-if="historySearchQuery"
                  type="button"
                  class="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                  :title="t('scan.history.clearSearch')"
                  @click="clearHistorySearch"
                >
                  <XMarkIcon class="h-4 w-4" />
                </button>
              </label>

              <button
                type="button"
                :class="[
                  'mt-5 flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition',
                  activeHistoryId
                    ? 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-200 hover:text-primary-700'
                    : 'border-primary-200 bg-primary-50 text-primary-800 shadow-sm ring-1 ring-primary-100',
                ]"
                @click="startNewScan"
              >
                <span class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-primary-600 ring-1 ring-primary-100">
                  <PlusIcon class="h-4 w-4" />
                </span>
                <span class="min-w-0">
                  <span class="block">{{ t('scan.history.newConversation') }}</span>
                  <span class="mt-0.5 block text-xs font-medium text-neutral-500">{{ t('scan.history.newConversationHint') }}</span>
                </span>
              </button>

              <div
                v-if="isHistoryManaging"
                class="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50/90 p-3 text-xs text-neutral-600"
              >
                <div class="flex items-center justify-between gap-2">
                  <span>{{ t('scan.history.selectedCount', { value: selectedHistoryIds.length }) }}</span>
                  <button
                    type="button"
                    class="font-semibold text-neutral-700 transition hover:text-primary-700"
                    @click="clearHistorySelection"
                  >
                    {{ t('scan.history.clearSelection') }}
                  </button>
                </div>
                <div class="mt-3 flex gap-2">
                  <button
                    type="button"
                    class="flex-1 rounded-full bg-white px-3 py-2 font-semibold text-neutral-700 ring-1 ring-neutral-200 transition hover:text-rose-700 hover:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!selectedHistoryIds.length || isHistoryActionPending"
                    @click="deleteSelectedHistoryRecords"
                  >
                    {{ t('scan.history.deleteSelected') }}
                  </button>
                  <button
                    type="button"
                    class="flex-1 rounded-full bg-white px-3 py-2 font-semibold text-rose-700 ring-1 ring-rose-100 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!historyRecords.length || isHistoryActionPending"
                    @click="clearAllHistoryRecords"
                  >
                    {{ t('scan.history.clearAll') }}
                  </button>
                </div>
              </div>

              <div class="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                <div v-if="historyRecords.length > 0" class="space-y-2">
                  <div
                    v-for="record in historyRecords"
                    :key="record.id"
                    :class="[
                      'group w-full cursor-pointer rounded-2xl border px-3 py-3 text-left transition',
                      String(record.id) === String(activeHistoryId)
                        ? 'border-primary-200 bg-primary-50 text-neutral-900 shadow-sm ring-1 ring-primary-100'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:border-primary-200 hover:bg-primary-50/40 hover:text-primary-700',
                    ]"
                    @click="loadHistoryRecord(record.id)"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex min-w-0 flex-1 items-start gap-2">
                        <input
                          v-if="isHistoryManaging"
                          type="checkbox"
                          class="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          :checked="isHistorySelected(record.id)"
                          @click.stop
                          @change="toggleHistorySelection(record.id)"
                        />
                        <button
                          type="button"
                          :class="[
                            'mt-0.5 rounded-full p-1 transition',
                            record.isPinned
                              ? 'bg-amber-50 text-amber-500 ring-1 ring-amber-100'
                              : 'text-neutral-300 hover:bg-neutral-100 hover:text-amber-500',
                          ]"
                          :title="record.isPinned ? t('scan.history.unpin') : t('scan.history.pin')"
                          @click.stop="togglePinnedHistory(record)"
                        >
                          <StarIcon class="h-4 w-4" :class="{ 'fill-current': record.isPinned }" />
                        </button>
                        <div class="min-w-0 flex-1">
                          <div v-if="String(record.id) === String(renamingHistoryId)" class="flex items-center gap-1" @click.stop>
                            <input
                              v-model="renameHistoryDraft"
                              class="min-w-0 flex-1 rounded-lg border border-primary-200 bg-white px-2 py-1 text-sm font-semibold text-neutral-800 outline-none focus:ring-2 focus:ring-primary-100"
                              @keydown.enter.prevent="confirmRenameHistory"
                              @keydown.esc.prevent="cancelRenameHistory"
                            />
                            <button
                              type="button"
                              class="rounded-full p-1 text-emerald-600 transition hover:bg-emerald-50"
                              :title="t('scan.history.saveRename')"
                              @click.stop="confirmRenameHistory"
                            >
                              <CheckIcon class="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              class="rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                              :title="t('scan.history.cancelRename')"
                              @click.stop="cancelRenameHistory"
                            >
                              <XMarkIcon class="h-4 w-4" />
                            </button>
                          </div>
                          <p v-else class="line-clamp-2 text-sm font-semibold leading-5">{{ resolveHistoryTitle(record) }}</p>
                        </div>
                      </div>
                      <span
                        v-if="record.analysis?.summary"
                        class="mt-0.5 flex-shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-primary-700 ring-1 ring-primary-100"
                      >
                        {{ collapseSummaryForDisplay(record.analysis.summary).ai }}%
                      </span>
                    </div>
                    <p class="mt-1 text-xs leading-5 text-neutral-500">{{ formatHistorySummary(record) }}</p>
                    <div class="mt-2 flex items-center justify-between gap-2">
                      <p class="text-[11px] text-neutral-400">{{ formatHistoryTimestamp(record.createdAt) }}</p>
                      <div class="flex items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                        <button
                          type="button"
                          class="rounded-full p-1.5 text-neutral-400 transition hover:bg-white hover:text-primary-700"
                          :title="t('scan.history.rename')"
                          @click.stop="startRenameHistory(record)"
                        >
                          <PencilSquareIcon class="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          class="rounded-full p-1.5 text-neutral-400 transition hover:bg-white hover:text-rose-600"
                          :title="t('scan.history.delete')"
                          @click.stop="deleteSingleHistoryRecord(record)"
                        >
                          <TrashIcon class="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-5 text-center">
                  <p class="text-sm font-semibold text-neutral-600">{{ t('scan.history.emptyTitle') }}</p>
                  <p class="mt-2 text-xs leading-5 text-neutral-500">{{ historySearchQuery ? t('scan.history.emptySearch') : t('scan.history.empty') }}</p>
                </div>
              </div>

              <p class="mt-4 rounded-2xl border border-neutral-100 bg-neutral-50/80 px-3 py-3 text-xs leading-5 text-neutral-500">
                {{ authStore.isAuthenticated ? t('scan.history.cloudHint') : t('scan.history.localHint') }}
              </p>
            </aside>

            <section class="relative flex-1 px-6 py-8">
              <div class="flex min-h-[30rem] flex-col overflow-hidden rounded-2xl bg-white shadow-premium ring-1 ring-neutral-200/50 transition-all lg:min-h-[calc(100vh-14rem)]">
                <div class="relative flex-1 overflow-hidden">
                  <div
                    v-show="editorMode === 'edit'"
                    ref="editorRef"
                    class="editor-surface h-full w-full outline-none p-8 font-serif text-lg leading-loose text-neutral-800 placeholder-neutral-300"
                    contenteditable="true"
                    :data-placeholder="t('scan.editor.placeholder')"
                    @input="onEditorInput"
                    @paste="onEditorPaste"
                    @focus="editorMode = 'edit'"
                    @dragenter.prevent="onDragEnter"
                    @dragover.prevent="onDragOver"
                    @dragleave.prevent="onDragLeave"
                    @drop.prevent="onDrop"
                  ></div>
                  <div
                    v-show="editorMode === 'preview'"
                    class="preview-surface h-full w-full overflow-y-auto p-8 font-serif text-lg leading-loose"
                  >
                    <div v-if="hasResults">
                      <p
                        v-if="resultHasMergedBlocks"
                        class="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
                      >
                        {{ mergedDetectionNotice }}
                      </p>
                      <div ref="previewContentRef" v-html="highlightedPreviewHtml"></div>
                    </div>
                    <div v-else class="flex h-full items-center justify-center">
                      <div class="text-center space-y-2">
                        <DocumentTextIcon class="h-12 w-12 text-neutral-200 mx-auto" />
                        <p class="text-sm text-neutral-400">{{ t('scan.editor.previewEmpty') }}</p>
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="dragActive"
                    class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-400 bg-primary-50/90 text-primary-600 backdrop-blur-sm transition-all"
                  >
                    <ArrowUpTrayIcon class="mb-4 h-12 w-12" />
                    <p class="text-lg font-semibold">{{ t('scan.editor.dropTitle') }}</p>
                    <p class="mt-2 text-sm opacity-80">{{ t('scan.editor.dropSubtitle') }}</p>
                  </div>
                </div>
                <!-- Autosave indicator removed or minimal -->
              </div>
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept=".txt,.md,.docx,.pdf,.json,.csv,.yaml,.yml,.tex,.tax"
                @change="onFileChange"
              />
            </section>

            <aside class="flex w-full min-h-[24rem] flex-col border-t border-neutral-100 bg-white lg:min-h-[calc(100vh-14rem)] lg:w-[24rem] lg:border-t-0 lg:border-l xl:w-[28rem]">
              <div class="flex h-full flex-col">
                <div class="flex-1 overflow-y-auto px-6 py-8">
                  <div class="flex items-center justify-between mb-6">
                    <div>
                      <h2 class="text-base font-bold tracking-tight text-neutral-900">{{ t('scan.results.menuTitle') }}</h2>
                      <p class="text-xs text-slate-500">{{ t('scan.results.menuSubtitle') }}</p>
                    </div>
                  </div>
                  <div class="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 text-xs">
                    <div class="flex items-center justify-between mb-2">
                       <p class="font-semibold uppercase tracking-wider text-neutral-400">{{ t('scan.results.quota') }}</p>
                       <span v-if="isQuotaReady" class="font-mono text-neutral-600">{{ quotaRemainingDisplay }} / {{ quotaLimitDisplay }}</span>
                       <span v-else-if="isQuotaLoading" class="animate-pulse text-neutral-400">{{ t('scan.results.loading') }}</span>
                       <span v-else class="text-rose-500">{{ t('scan.results.error') }}</span>
                    </div>
                    <div class="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                      <div class="h-full bg-primary-500 transition-all duration-500" :style="{ width: quotaPercentage + '%' }"></div>
                    </div>
                    <p class="mt-2 text-[10px] text-neutral-400">{{ t('scan.quotaHint') }}</p>
                  </div>
                  <div
                    class="mt-3 rounded-xl border px-4 py-3 text-xs"
                    :class="
                      canStartScan
                        ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700'
                        : 'border-rose-200 bg-rose-50/80 text-rose-700'
                    "
                  >
                    <div class="flex items-center justify-between gap-3">
                      <span class="font-semibold uppercase tracking-wider">
                        {{ t('scan.toolbar.start') }}
                      </span>
                      <span class="font-mono">
                        {{ scanReadinessCounter }}
                      </span>
                    </div>
                    <p class="mt-2 leading-5">
                      {{ scanReadinessMessage }}
                    </p>
                  </div>

                  <div v-if="!hasResults" class="mt-8 space-y-8">
                    <div class="space-y-6">
                      <div class="space-y-3">
                         <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400">{{ t('scan.results.verification') }}</h3>
                         <div class="grid grid-cols-2 gap-3">
                           <template v-for="option in functionOptions" :key="option.key">
                             <button
                               v-if="['scan', 'citation'].includes(option.key)"
                               type="button"
                               :class="[
                                 'group flex flex-col items-center justify-center gap-3 rounded-xl border p-4 text-xs font-semibold transition-all duration-200',
                                 isComingSoonFunction(option.key) ? 'cursor-not-allowed opacity-40 grayscale' : 'hover:shadow-md hover:-translate-y-0.5',
                                 isFunctionSelected(option.key)
                                   ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500 shadow-sm'
                                   : 'bg-white border-neutral-200 text-neutral-600 hover:border-primary-300 hover:bg-neutral-50',
                               ]"
                               :aria-disabled="isComingSoonFunction(option.key)"
                               @click="toggleFunction(option.key)"
                             >
                               <component :is="option.icon" :class="['h-6 w-6 transition-transform group-hover:scale-110', isFunctionSelected(option.key) ? 'text-primary-600' : 'text-neutral-400']" />
                               <span class="text-center">{{ option.label }}</span>
                             </button>
                           </template>
                         </div>
                      </div>
                      
                      <div class="space-y-3">
                        <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400">{{ t('scan.results.enhancement') }}</h3>
                         <div class="grid grid-cols-2 gap-3">
                           <template v-for="option in functionOptions" :key="option.key">
                             <button
                               v-if="['polish', 'translate'].includes(option.key)"
                               type="button"
                               :class="[
                                 'group flex flex-col items-center justify-center gap-3 rounded-xl border p-4 text-xs font-semibold transition-all duration-200',
                                 isComingSoonFunction(option.key) ? 'cursor-not-allowed opacity-40 grayscale' : 'hover:shadow-md hover:-translate-y-0.5',
                                 isFunctionSelected(option.key)
                                   ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500 shadow-sm'
                                   : 'bg-white border-neutral-200 text-neutral-600 hover:border-primary-300 hover:bg-neutral-50',
                               ]"
                               :aria-disabled="isComingSoonFunction(option.key)"
                               @click="toggleFunction(option.key)"
                             >
                               <component :is="option.icon" :class="['h-6 w-6 transition-transform group-hover:scale-110', isFunctionSelected(option.key) ? 'text-primary-600' : 'text-neutral-400']" />
                               <span class="text-center">{{ option.label }}</span>
                             </button>
                           </template>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="mt-8 space-y-6">
                    <div class="relative overflow-hidden rounded-2xl border border-neutral-100 bg-white p-6 shadow-premium ring-1 ring-black/5">
                       <div class="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-primary-100/50 blur-3xl"></div>
                       <div class="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-primary-200/20 blur-3xl"></div>
                       
                       <div class="relative z-10">
                         <div class="flex items-center justify-between mb-8">
                           <h3 class="text-sm font-bold text-neutral-900 uppercase tracking-wider">{{ t('scan.results.summary.title') }}</h3>
                           <span class="rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-bold tracking-wider text-primary-700 ring-1 ring-primary-700/10">{{ modelVersionLabel }}</span>
                         </div>
                         
                         <div class="flex items-end gap-3 mb-8">
                           <span class="text-6xl font-bold tracking-tighter leading-none text-neutral-900">{{ resultDisplaySummary.ai }}%</span>
                           <span class="text-lg font-medium text-neutral-500 mb-1.5">{{ t('scan.results.summary.label') }}</span>
                         </div>

                         <div class="space-y-4">
                           <div class="space-y-1.5">
                             <div class="flex justify-between text-xs font-semibold">
                               <span class="text-neutral-600">{{ t('scan.results.summary.ai') }}</span>
                               <span class="text-neutral-900">{{ resultDisplaySummary.ai }}%</span>
                             </div>
                             <div class="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                               <div class="h-full bg-primary-500" :style="{ width: resultDisplaySummary.ai + '%' }"></div>
                             </div>
                           </div>

                           <div class="space-y-1.5">
                             <div class="flex justify-between text-xs font-semibold">
                               <span class="text-neutral-600">{{ t('scan.results.summary.human') }}</span>
                               <span class="text-neutral-900">{{ resultDisplaySummary.human }}%</span>
                             </div>
                             <div class="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                               <div class="h-full bg-emerald-500" :style="{ width: resultDisplaySummary.human + '%' }"></div>
                             </div>
                           </div>
                         </div>
                       </div>
                    </div>

                    <button
                      type="button"
                      class="flex w-full items-start gap-4 rounded-2xl border border-neutral-100 bg-white p-4 text-left shadow-sm transition hover:border-primary-200 hover:bg-primary-50/40"
                      @click="exportReport"
                    >
                      <span class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 ring-1 ring-primary-100">
                        <DocumentArrowDownIcon class="h-5 w-5" />
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-semibold text-slate-900">{{ t('scan.results.export') }}</span>
                        <span class="mt-1 block text-xs leading-5 text-slate-500">
                          {{ authStore.isAuthenticated ? t('scan.results.exportHint') : t('scan.results.exportLockedHint') }}
                        </span>
                      </span>
                    </button>

                    <div class="rounded-2xl border border-neutral-100 bg-white p-1">
                      <div class="grid grid-cols-2 gap-1 p-1 bg-neutral-50/50 rounded-xl">
                        <button
                          v-for="tab in availableResultTabs"
                          :key="tab.key"
                          type="button"
                          :class="[
                            'rounded-lg py-2 text-xs font-semibold transition-all duration-200',
                            activeResultTab === tab.key
                              ? 'bg-white text-neutral-900 shadow-sm ring-1 ring-black/5'
                              : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50',
                          ]"
                          @click="activeResultTab = tab.key"
                        >
                          {{ tab.label }}
                        </button>
                      </div>
                      
                      <div class="custom-scrollbar max-h-[400px] overflow-y-auto break-words p-4">
                        <div v-if="activeResultTab === 'scan'" class="space-y-4">
                          <p v-if="resultHasMergedBlocks" class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            {{ t('scan.results.mergeNotice') }}
                          </p>
                          <div
                            v-for="(sentence, index) in scanStore.result.sentences"
                            :key="sentence.id"
                            :class="[
                              'rounded-2xl border p-4 text-sm transition-all duration-150',
                              highlightBorderClass(sentence),
                              isSentenceResultActive(sentence) ? 'ring-2 ring-slate-300/80 shadow-sm' : '',
                            ]"
                            @mouseenter="setActiveSentence(getSentenceDefaultActiveId(sentence))"
                            @mouseleave="clearActiveSentence"
                          >
                            <div class="mb-3 flex items-center justify-between gap-3">
                              <span class="inline-flex items-center rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                                {{ formatSentenceBlockLabel(sentence, index) }}
                              </span>
                              <span class="text-xs font-semibold text-slate-500">
                                {{ formatSentenceProbabilityLabel(sentence) }}
                              </span>
                            </div>
                            <div
                              class="result-sentence-text min-w-0 space-y-3"
                              @mouseover="setActiveSentenceFromResultParagraph($event, sentence)"
                              @mouseleave="setActiveSentence(getSentenceDefaultActiveId(sentence))"
                              v-html="formatHighlightedSentence(sentence)"
                            ></div>
                            <p v-if="sentence.reason" class="mt-2 text-xs text-slate-500">{{ sentence.reason }}</p>
                          </div>
                        </div>
                        <div v-else-if="activeResultTab === 'translate'" class="space-y-3">
                          <p class="text-xs font-semibold text-slate-500">{{ t('scan.results.translation') }}</p>
                          <div class="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-line break-words">
                            {{ scanStore.result.translation }}
                          </div>
                        </div>
                        <div v-else-if="activeResultTab === 'polish'" class="space-y-4">
                          <p class="text-xs font-semibold text-slate-500">{{ t('scan.results.polish') }}</p>
                          <div class="rounded-2xl border border-slate-200 bg-white p-4 text-sm whitespace-pre-line break-words text-slate-700">
                            {{ scanStore.result.polish }}
                          </div>
                          <button
                            type="button"
                            class="inline-flex items-center rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-500"
                            @click="applyPolishSuggestion(scanStore.result.polish)"
                          >
                            {{ t('scan.results.apply') }}
                          </button>
                        </div>
                        <div v-else-if="activeResultTab === 'citation'" class="space-y-4">
                          <p class="text-xs font-semibold text-slate-500">{{ t('scan.results.citation') }}</p>
                          <div
                            v-for="item in scanStore.result.citations"
                            :key="item.id"
                            class="rounded-2xl border border-slate-200 bg-white p-4 text-sm break-words"
                          >
                            <p class="text-slate-700">{{ item.text }}</p>
                            <p v-if="item.source" class="mt-2 text-xs text-slate-500">{{ item.source }}</p>
                          </div>
                          <p class="text-[11px] text-slate-400">{{ t('scan.results.citationHint') }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

          </div>
          <div class="pointer-events-none fixed bottom-6 left-1/2 z-30 flex w-full max-w-3xl -translate-x-1/2 px-4 transition-all duration-500 ease-out" :class="{ 'translate-y-24 opacity-0': !isPanelActive('document') }">
            <div class="pointer-events-auto flex w-full items-center justify-between gap-4 rounded-full border border-white/20 bg-white/90 px-2 pl-6 py-2 shadow-premium backdrop-blur-xl ring-1 ring-black/5">
              <div class="flex items-center gap-1">
                <button type="button" class="toolbar-button rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors" @click="applyCommand('bold')"><span class="font-bold">B</span></button>
                <button type="button" class="toolbar-button italic rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors" @click="applyCommand('italic')">I</button>
                <button type="button" class="toolbar-button underline rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors" @click="applyCommand('underline')">U</button>
                <div class="mx-2 h-4 w-px bg-neutral-200"></div>
                <button type="button" class="toolbar-button rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors" @click="applyCommand('insertUnorderedList')">{{ t('scan.toolbar.bulleted') }}</button>
                <label class="sr-only" for="font-size">{{ t('scan.toolbar.fontSize') }}</label>
                <!-- Simplified select for aesthetic -->
                 <BaseListbox
                    button-id="font-size"
                    v-model="fontSizeSelection"
                    :options="fontSizeOptions"
                    :placeholder="t('scan.toolbar.fontSize')"
                    :aria-label="t('scan.toolbar.fontSize')"
                    button-class="text-xs font-medium text-neutral-600 hover:text-neutral-900"
                    display-class="text-xs"
                    @update:model-value="onFontSizeChange"
                  />
              </div>
              <div class="flex items-center gap-3">
                <button type="button" class="group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-all" @click="triggerUpload">
                  <ArrowUpTrayIcon class="h-4 w-4 text-neutral-400 group-hover:text-neutral-600" />
                  {{ t('scan.toolbar.upload') }}
                </button>
                <button
                  type="button"
                  :disabled="isScanning || !canStartScan"
                  :class="[
                    'inline-flex items-center gap-2 rounded-full pl-4 pr-5 py-2.5 text-sm font-semibold text-white transition-all',
                    isScanning || !canStartScan
                      ? 'cursor-not-allowed bg-slate-300 shadow-none'
                      : 'bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 shadow-lg shadow-primary-700/20 hover:from-primary-600 hover:via-primary-500 hover:to-primary-400 hover:scale-105 active:scale-95',
                  ]"
                  @click="handleScan"
                >
                  <svg
                    v-if="isScanning"
                    class="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <PlayIcon v-else class="h-4 w-4" />
                  {{ isScanning ? t('scan.toolbar.scanning') : t('scan.toolbar.start') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="isPanelActive('profile')" class="flex-1 px-4 py-6">
          <div class="mx-auto w-full max-w-4xl">
            <ProfilePanel />
          </div>
        </div>

        <div v-else-if="isPanelActive('qa')" class="flex-1 px-4 py-6">
          <div class="mx-auto w-full max-w-5xl">
            <QAPanel />
          </div>
        </div>


      </main>
    </div>
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isResultDetailOpen && hasResults"
        class="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm"
        @click.self="closeResultDetail"
      >
        <section class="ml-auto flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-black/10 lg:w-[72vw]">
          <header class="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600">{{ t('scan.results.detailEyebrow') }}</p>
              <h2 class="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">{{ resultDetailTitle }}</h2>
              <div class="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                <span v-if="activeHistoryRecord">{{ formatHistoryTimestamp(activeHistoryRecord.createdAt) }}</span>
                <span>{{ characterUsage }}</span>
                <span>{{ t('scan.editor.selectedFunctions', { value: selectedFunctionSummary }) }}</span>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition hover:border-primary-200 hover:text-primary-700"
                @click="exportReport"
              >
                <DocumentArrowDownIcon class="h-4 w-4" />
                {{ t('scan.results.export') }}
              </button>
              <button
                type="button"
                class="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-700"
                @click="closeResultDetail"
              >
                {{ t('scan.results.closeDetail') }}
              </button>
            </div>
          </header>

          <div class="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[18rem,1fr]">
            <aside class="border-b border-neutral-100 bg-neutral-50/70 px-6 py-6 lg:border-b-0 lg:border-r">
              <div class="rounded-3xl border border-neutral-100 bg-white p-5 shadow-sm">
                <p class="text-xs font-bold uppercase tracking-widest text-neutral-400">{{ t('scan.results.summary.title') }}</p>
                <div class="mt-6 flex items-end gap-2">
                  <span class="text-5xl font-bold tracking-tight text-neutral-950">{{ resultDisplaySummary.ai }}%</span>
                  <span class="pb-1 text-sm font-semibold text-neutral-500">{{ t('scan.results.summary.label') }}</span>
                </div>
                <div class="mt-6 space-y-4">
                  <div>
                    <div class="mb-1 flex justify-between text-xs font-semibold text-neutral-600">
                      <span>{{ t('scan.results.summary.ai') }}</span>
                      <span>{{ resultDisplaySummary.ai }}%</span>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div class="h-full bg-primary-500" :style="{ width: resultDisplaySummary.ai + '%' }"></div>
                    </div>
                  </div>
                  <div>
                    <div class="mb-1 flex justify-between text-xs font-semibold text-neutral-600">
                      <span>{{ t('scan.results.summary.human') }}</span>
                      <span>{{ resultDisplaySummary.human }}%</span>
                    </div>
                    <div class="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div class="h-full bg-emerald-500" :style="{ width: resultDisplaySummary.human + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-4 rounded-3xl border border-neutral-100 bg-white p-2 shadow-sm">
                <button
                  v-for="tab in availableResultTabs"
                  :key="tab.key"
                  type="button"
                  :class="[
                    'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition',
                    activeResultTab === tab.key
                      ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-100'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900',
                  ]"
                  @click="activeResultTab = tab.key"
                >
                  <span>{{ tab.label }}</span>
                  <ArrowRightIcon v-if="activeResultTab === tab.key" class="h-4 w-4" />
                </button>
              </div>
            </aside>

            <main class="min-h-0 px-6 py-6">
              <div v-if="activeResultTab === 'scan'" class="space-y-4">
                <p v-if="resultHasMergedBlocks" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {{ t('scan.results.mergeNotice') }}
                </p>
                <div
                  v-for="(sentence, index) in scanStore.result.sentences"
                  :key="sentence.id"
                  :class="[
                    'rounded-3xl border p-5 text-sm transition-all duration-150',
                    highlightBorderClass(sentence),
                    isSentenceResultActive(sentence) ? 'ring-2 ring-slate-300/80 shadow-sm' : '',
                  ]"
                  @mouseenter="setActiveSentence(getSentenceDefaultActiveId(sentence))"
                  @mouseleave="clearActiveSentence"
                >
                  <div class="mb-4 flex items-center justify-between gap-3">
                    <span class="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {{ formatSentenceBlockLabel(sentence, index) }}
                    </span>
                    <span class="text-xs font-semibold text-slate-500">
                      {{ formatSentenceProbabilityLabel(sentence) }}
                    </span>
                  </div>
                  <div
                    class="result-sentence-text min-w-0 space-y-3 text-base"
                    @mouseover="setActiveSentenceFromResultParagraph($event, sentence)"
                    @mouseleave="setActiveSentence(getSentenceDefaultActiveId(sentence))"
                    v-html="formatHighlightedSentence(sentence)"
                  ></div>
                  <p v-if="sentence.reason" class="mt-3 text-xs leading-5 text-slate-500">{{ sentence.reason }}</p>
                </div>
              </div>

              <div v-else-if="activeResultTab === 'translate'" class="space-y-3">
                <p class="text-xs font-semibold text-slate-500">{{ t('scan.results.translation') }}</p>
                <div class="rounded-3xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-700 whitespace-pre-line break-words">
                  {{ scanStore.result.translation }}
                </div>
              </div>

              <div v-else-if="activeResultTab === 'polish'" class="space-y-4">
                <p class="text-xs font-semibold text-slate-500">{{ t('scan.results.polish') }}</p>
                <div class="rounded-3xl border border-slate-200 bg-white p-5 text-sm whitespace-pre-line break-words text-slate-700">
                  {{ scanStore.result.polish }}
                </div>
                <button
                  type="button"
                  class="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-500"
                  @click="applyPolishSuggestion(scanStore.result.polish)"
                >
                  {{ t('scan.results.apply') }}
                </button>
              </div>

              <div v-else-if="activeResultTab === 'citation'" class="space-y-4">
                <p class="text-xs font-semibold text-slate-500">{{ t('scan.results.citation') }}</p>
                <div
                  v-for="item in scanStore.result.citations"
                  :key="item.id"
                  class="rounded-3xl border border-slate-200 bg-white p-5 text-sm break-words"
                >
                  <p class="text-slate-700">{{ item.text }}</p>
                  <p v-if="item.source" class="mt-2 text-xs text-slate-500">{{ item.source }}</p>
                </div>
                <p class="text-[11px] text-slate-400">{{ t('scan.results.citationHint') }}</p>
              </div>
            </main>
          </div>
        </section>
      </div>
    </transition>
    <LoginPromptModal
      :open="showLoginModal"
      :message="loginMessage"
      :login-to="loginPromptLoginTo"
      :register-to="loginPromptRegisterTo"
      @close="showLoginModal = false"
    />
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
  StarIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  Squares2X2Icon,
  ShieldCheckIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ArrowRightIcon,
  PlayIcon,
} from '@heroicons/vue/24/outline';
import AppHeader from '../sections/AppHeader.vue';
import LoginPromptModal from '../components/common/LoginPromptModal.vue';
import BaseListbox from '../components/common/BaseListbox.vue';
import ProfilePanel from '../components/dashboard/ProfilePanel.vue';
import QAPanel from '../components/dashboard/QAPanel.vue';
import OnboardingStepsBar from '../components/dashboard/OnboardingStepsBar.vue';
import { useI18n } from '../i18n';
import { clearGuestToken, ensureGuestToken } from '../api/modules/auth';
import { extractApiErrorCode } from '../api/client';
import { fetchQuota } from '../api/modules/quota';
import { exportPdfReport as requestPdfReport } from '../api/modules/reports';
import { useAuthStore } from '../store/auth';
import { useScanStore } from '../store/scan';
import { clampProbability, getProbabilityCardClasses, getProbabilityTextClasses } from '../utils/detectionStyles';
import {
  buildHighlightedPreviewHtml,
  buildSentenceParagraphLinkId,
  escapeHtml,
  plainTextToHtml,
  sanitizeHtmlForEditor,
} from '../utils/editorContent';
import { showComingSoon, showToast } from '../utils/toast';

const authStore = useAuthStore();
const scanStore = useScanStore();
const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();

const editorRef = ref(null);
const previewContentRef = ref(null);
const fileInput = ref(null);
const newMenuRef = ref(null);
const newMenuButtonRef = ref(null);
const activeFeatureCard = ref(null);
const activeQuote = ref('');
const showOnboarding = ref(false);
const onboardingSteps = ref([]);
const onboardingStorageKey = 'ai-detector-onboarding-v1';
const fontSizeSelection = ref('');
const localText = ref(scanStore.inputText || '');

const editorMode = ref('edit');
const isScanning = ref(false);
const dragActive = ref(false);
const detectionResults = computed(() => scanStore.result);
const highlightedPreviewHtml = ref('');
const showLoginModal = ref(false);
const loginMessage = ref(t('scan.loginPrompt.default'));
const activeResultTab = ref('scan');
const newMenuOpen = ref(false);
const activePanel = ref('home');
const activeHistoryId = ref('');
const historySearchQuery = ref('');
const isHistoryManaging = ref(false);
const selectedHistoryIds = ref([]);
const renamingHistoryId = ref('');
const renameHistoryDraft = ref('');
const isHistoryActionPending = ref(false);
const activeSentenceId = ref('');
const isResultDetailOpen = ref(false);
const headerVariant = computed(() => (activePanel.value === 'document' ? 'scan' : 'standard'));
const quotaInfo = ref({ actor_type: '', limit: 0, used_today: 0, remaining: 0 });
const isQuotaLoading = ref(false);
const isQuotaReady = ref(false);
const showIntegrationHub = false;

const allowedPanelSet = new Set(['home', 'document', 'profile', 'qa']);
const allowedFunctionKeys = new Set(['scan']);
let lastComingSoonAt = 0;
let historySearchTimer = null;

const triggerComingSoon = (label) => {
  const now = Date.now();
  if (now - lastComingSoonAt < 1200) return;
  lastComingSoonAt = now;
  showComingSoon(label);
};

const editorModes = computed(() => [
  { key: 'edit', label: t('scan.editor.modes.edit') },
  { key: 'preview', label: t('scan.editor.modes.preview') },
]);

const functionOptions = computed(() => [
  {
    key: 'scan',
    label: t('scan.functions.scan'),
    icon: ShieldCheckIcon,
    activeClass: 'border-transparent bg-slate-900 text-white shadow-sm',
  },
  {
    key: 'polish',
    label: t('scan.functions.polish'),
    icon: PencilSquareIcon,
    activeClass: 'border-transparent bg-primary-600 text-white shadow-sm',
  },
  {
    key: 'translate',
    label: t('scan.functions.translate'),
    icon: LanguageIcon,
    activeClass: 'border-transparent bg-sky-600 text-white shadow-sm',
  },
  {
    key: 'citation',
    label: t('scan.functions.citation'),
    icon: DocumentMagnifyingGlassIcon,
    activeClass: 'border-transparent bg-emerald-600 text-white shadow-sm',
  },
]);

const panelOptions = ['home', 'document', 'profile', 'qa'];

const motivationalQuotes = computed(() => t('scan.quotes'));

const buildOnboardingSteps = () => [
  {
    key: 'upload',
    label: t('scan.onboarding.upload.label'),
    description: t('scan.onboarding.upload.description'),
    status: 'current',
  },
  {
    key: 'scan',
    label: t('scan.onboarding.scan.label'),
    description: t('scan.onboarding.scan.description'),
    status: 'upcoming',
  },
  {
    key: 'review',
    label: t('scan.onboarding.review.label'),
    description: t('scan.onboarding.review.description'),
    status: 'upcoming',
  },
  {
    key: 'export',
    label: t('scan.onboarding.export.label'),
    description: t('scan.onboarding.export.description'),
    status: 'upcoming',
  },
];

const userDisplayName = computed(() => {
  const profile = authStore.user?.profile;
  if (profile?.firstName || profile?.surname) {
    return (
      `${profile.firstName || ''} ${profile.surname || ''}`.trim() ||
      profile.firstName ||
      profile.surname ||
      t('scan.user.guest')
    );
  }
  if (authStore.user?.name) return authStore.user.name;
  if (authStore.user?.username) return authStore.user.username;
  if (authStore.user?.email) return authStore.user.email.split('@')[0];
  return t('scan.user.guest');
});

const normalizeReportId = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const triggerBlobDownload = (blob, filename = 'aidetector-report.pdf') => {
  if (typeof window === 'undefined') return;
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
};

const buildReportPayload = ({
  reportType,
  historyId,
}) => {
  const normalizedHistoryId = normalizeReportId(historyId);
  if (!normalizedHistoryId) return null;

  return {
    reportType,
    locale: locale.value,
    historyId: normalizedHistoryId,
  };
};

const downloadReport = async (payload, fallbackFileName) => {
  const response = await requestPdfReport(payload);
  triggerBlobDownload(response.blob, response.fileName || fallbackFileName);
};

const showExportLockedToast = () => {
  showToast({
    title: t('scan.results.exportLoginTitle'),
    message: t('scan.results.exportLoginMessage'),
  });
};

const showScanFailureToast = (error) => {
  showToast({
    title: t('scan.editor.scanErrorTitle'),
    message: error?.message || t('scan.editor.scanErrorMessage'),
  });
};

const showUploadFailureToast = (error) => {
  showToast({
    title: t('scan.editor.uploadErrorTitle'),
    message: scanStore.uploadError || error?.message || t('errors.fileParseError'),
  });
};

const userPlanTag = computed(() => {
  const plan = authStore.user?.plan || 'personal-free';
  if (plan.includes('team')) return t('scan.planTags.team');
  if (plan.includes('edu')) return t('scan.planTags.edu');
  if (plan.includes('pro')) return t('scan.planTags.pro');
  return t('scan.planTags.free');
});

const dashboardHomeCopy = computed(() => t('scan.dashboard'));

const pickRandomQuote = () => {
  if (!motivationalQuotes.value.length) {
    activeQuote.value = '';
    return;
  }
  const index = Math.floor(Math.random() * motivationalQuotes.value.length);
  activeQuote.value = motivationalQuotes.value[index];
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

const featureCards = computed(() => [
  {
    key: 'advanced',
    title: t('scan.featureCards.advanced.title'),
    subtitle: t('scan.featureCards.advanced.subtitle'),
    icon: SparklesIcon,
    iconClass: 'bg-gradient-to-br from-amber-100 via-violet-100 to-sky-100 text-amber-600',
    tooltip: t('scan.featureCards.advanced.tooltip'),
    tag: t('scan.featureCards.vocabulary.tag'),
    tagClass: 'bg-slate-100 text-slate-600',
    modalTitle: t('scan.featureCards.advanced.modalTitle'),
    modalSubtitle: t('scan.featureCards.advanced.modalSubtitle'),
    buttonLabel: t('scan.featureCards.advanced.buttonLabel'),
    buttonVariant: 'upgrade',
    disabled: true,
  },
  {
    key: 'xl',
    title: t('scan.featureCards.xl.title'),
    subtitle: t('scan.featureCards.xl.subtitle'),
    icon: Squares2X2Icon,
    iconClass: 'bg-slate-900 text-white',
    tooltip: t('scan.featureCards.xl.tooltip'),
    tag: t('scan.featureCards.vocabulary.tag'),
    tagClass: 'bg-slate-100 text-slate-600',
    modalTitle: t('scan.featureCards.xl.modalTitle'),
    modalSubtitle: t('scan.featureCards.xl.modalSubtitle'),
    buttonLabel: t('scan.featureCards.xl.buttonLabel'),
    buttonVariant: 'upgrade',
    disabled: true,
  },
  {
    key: 'vocabulary',
    title: t('scan.featureCards.vocabulary.title'),
    subtitle: t('scan.featureCards.vocabulary.subtitle'),
    icon: BookOpenIcon,
    iconClass: 'bg-emerald-100 text-emerald-600',
    tooltip: t('scan.featureCards.vocabulary.tooltip'),
    tag: t('scan.featureCards.vocabulary.tag'),
    tagClass: 'bg-slate-100 text-slate-600',
    modalTitle: t('scan.featureCards.vocabulary.modalTitle'),
    modalSubtitle: t('scan.featureCards.vocabulary.modalSubtitle'),
    buttonLabel: t('scan.featureCards.vocabulary.buttonLabel'),
    buttonVariant: 'upgrade',
    disabled: true,
  },
  {
    key: 'citation',
    title: t('scan.featureCards.citation.title'),
    subtitle: t('scan.featureCards.citation.subtitle'),
    icon: BookmarkSquareIcon,
    iconClass: 'bg-indigo-100 text-indigo-600',
    tooltip: t('scan.featureCards.citation.tooltip'),
    tag: t('scan.featureCards.vocabulary.tag'),
    tagClass: 'bg-slate-100 text-slate-600',
    modalTitle: t('scan.featureCards.citation.modalTitle'),
    modalSubtitle: t('scan.featureCards.citation.modalSubtitle'),
    buttonLabel: t('scan.featureCards.citation.buttonLabel'),
    buttonVariant: 'upgrade',
    disabled: true,
  },
  {
    key: 'plagiarism',
    title: t('scan.featureCards.plagiarism.title'),
    subtitle: t('scan.featureCards.plagiarism.subtitle'),
    icon: MagnifyingGlassCircleIcon,
    iconClass: 'bg-rose-100 text-rose-600',
    tooltip: t('scan.featureCards.plagiarism.tooltip'),
    tag: t('scan.featureCards.vocabulary.tag'),
    tagClass: 'bg-slate-100 text-slate-600',
    modalTitle: t('scan.featureCards.plagiarism.modalTitle'),
    modalSubtitle: t('scan.featureCards.plagiarism.modalSubtitle'),
    buttonLabel: t('scan.featureCards.plagiarism.buttonLabel'),
    buttonVariant: 'upgrade',
    disabled: true,
  },
]);

const ChromeGlyph = markRaw(() =>
  h('svg', { viewBox: '0 0 24 24', class: 'h-5 w-5' }, [
    h('circle', { cx: '12', cy: '12', r: '10', fill: '#E8EAED' }),
    h('path', { d: 'M12 12L21 12A9 9 0 0012 3', fill: '#EA4335' }),
    h('path', { d: 'M12 12L7.5 20.79A9 9 0 0021 12', fill: '#34A853' }),
    h('path', { d: 'M12 12L3 12A9 9 0 0011.99 21', fill: '#FBBC04' }),
    h('circle', { cx: '12', cy: '12', r: '4', fill: '#4285F4' }),
  ]),
);

const integrationButtons = computed(() =>
  [
    {
      key: 'multi-upload',
      label: t('scan.integrations.buttons.multiUpload'),
      icon: ArrowUpTrayIcon,
      class: 'bg-slate-900 text-white',
      action: 'multi-upload',
      isAvailable: true,
    },
    {
      key: 'api',
      label: t('scan.integrations.buttons.api'),
      icon: CommandLineIcon,
      class: 'bg-purple-600 text-white',
      action: 'contact',
      isAvailable: false,
    },
    {
      key: 'chrome',
      label: t('scan.integrations.buttons.chrome'),
      icon: ChromeGlyph,
      class: 'border border-slate-200 bg-white text-slate-700',
      action: 'external',
      isAvailable: false,
    },
    {
      key: 'canvas',
      label: t('scan.integrations.buttons.canvas'),
      icon: PaintBrushIcon,
      class: 'bg-orange-500 text-white',
      action: 'contact',
      isAvailable: false,
    },
    {
      key: 'moodle',
      label: t('scan.integrations.buttons.moodle'),
      icon: AcademicCapIcon,
      class: 'bg-amber-500 text-white',
      action: 'contact',
      isAvailable: false,
    },
    {
      key: 'zapier',
      label: t('scan.integrations.buttons.zapier'),
      icon: BoltIcon,
      class: 'bg-orange-400 text-white',
      action: 'external',
      isAvailable: false,
    },
    {
      key: 'docs',
      label: t('scan.integrations.buttons.docs'),
      icon: DocumentTextIcon,
      class: 'bg-blue-500 text-white',
      action: 'external',
      isAvailable: false,
    },
    {
      key: 'classroom',
      label: t('scan.integrations.buttons.classroom'),
      icon: UserGroupIcon,
      class: 'bg-emerald-500 text-white',
      action: 'external',
      isAvailable: false,
    },
  ].map((item) => ({
    ...item,
    status: item.isAvailable ? dashboardHomeCopy.value.integrations.live : dashboardHomeCopy.value.integrations.preview,
  }))
);

const isFeatureModalOpen = computed(() => Boolean(activeFeatureCard.value));

const fontSizeMap = {
  small: '2',
  base: '3',
  lg: '4',
  xl: '5',
  '2xl': '6',
};

const fontSizeOptions = computed(() => [
  { value: 'small', label: t('scan.toolbar.fontSizes.small') },
  { value: 'base', label: t('scan.toolbar.fontSizes.base') },
  { value: 'lg', label: t('scan.toolbar.fontSizes.lg') },
  { value: 'xl', label: t('scan.toolbar.fontSizes.xl') },
  { value: '2xl', label: t('scan.toolbar.fontSizes.2xl') },
]);

const minDetectChars = 200;
const countVisibleCharacters = (value = '') => String(value || '').replace(/\s/g, '').length;
const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
const collapseSummaryForDisplay = (summary) => {
  const ai = clampPercent(summary?.ai);
  const mixed = clampPercent(summary?.mixed);
  const human = clampPercent(summary?.human);
  if (summary && ai === 0 && mixed === 0 && human === 0) {
    return { ai: 0, human: 0 };
  }
  return {
    ai,
    human: Math.max(0, 100 - ai),
  };
};

const characterUsage = computed(() =>
  t('scan.editor.wordCount', { current: scanStore.characterCount, limit: scanStore.characterLimit })
);

const characterCount = computed(() => scanStore.characterCount);
const isOverCharacterLimit = computed(() => characterCount.value > scanStore.characterLimit);
const overflowCharacterCount = computed(() => Math.max(characterCount.value - scanStore.characterLimit, 0));
const detectableCharacterCount = computed(() => countVisibleCharacters(scanStore.inputText));
const remainingToMinDetect = computed(() => Math.max(minDetectChars - detectableCharacterCount.value, 0));
const canStartScan = computed(() => detectableCharacterCount.value >= minDetectChars && !isOverCharacterLimit.value);
const scanReadinessCounter = computed(() =>
  isOverCharacterLimit.value
    ? `${characterCount.value} / ${scanStore.characterLimit}`
    : `${detectableCharacterCount.value} / ${minDetectChars}`
);
const scanReadinessMessage = computed(() => {
  if (isOverCharacterLimit.value) {
    return t('scan.editor.tooLongHint', {
      limit: scanStore.characterLimit,
      overflow: overflowCharacterCount.value,
    });
  }
  if (canStartScan.value) {
    return t('scan.editor.minDetectHint', { minimum: minDetectChars });
  }
  return t('scan.editor.minDetectRemaining', { remaining: remainingToMinDetect.value });
});
const resultHasMergedBlocks = computed(() =>
  Boolean(scanStore.result?.sentences?.some((item) => String(item.text || '').includes('\n')))
);
const resultDisplaySummary = computed(() => collapseSummaryForDisplay(scanStore.result?.summary));
const normalizeModelVersionLabel = (modelName) => {
  const normalized = String(modelName || '').trim();
  if (!normalized) return '';
  const version = normalized.match(/v\d+(?:\.\d+)?/i)?.[0];
  return version ? t('scan.results.summary.modelBadge', { version }) : normalized;
};
const modelVersionLabel = computed(() =>
  normalizeModelVersionLabel(scanStore.result?.modelName || scanStore.result?.model_name) || t('scan.results.summary.badge')
);
const mergedDetectionNotice = computed(() => t('scan.results.mergeNotice'));

const formatQuotaValue = (value) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '--';
};

const quotaLimitDisplay = computed(() => formatQuotaValue(quotaInfo.value.limit));
const quotaUsedDisplay = computed(() => formatQuotaValue(quotaInfo.value.used_today));
const quotaRemainingDisplay = computed(() => formatQuotaValue(quotaInfo.value.remaining));
const quotaRemainingValue = computed(() => Number(quotaInfo.value.remaining || 0));

const quotaPercentage = computed(() => {
  const limit = Number(quotaInfo.value.limit || 0);
  const remaining = Number(quotaInfo.value.remaining || 0);
  if (limit <= 0) return 0;
  return Math.min(100, Math.max(0, (remaining / limit) * 100));
});

const resolveHistoryTitle = (record) => {
  return scanStore.resolveHistoryRecordTitle(record, t('scan.history.recordFallback'));
};

const homeStatCards = computed(() => [
  {
    label: dashboardHomeCopy.value.stats.remaining,
    value: quotaRemainingDisplay.value,
    description: dashboardHomeCopy.value.stats.remainingDescription,
  },
  {
    label: dashboardHomeCopy.value.stats.used,
    value: quotaUsedDisplay.value,
    description: dashboardHomeCopy.value.stats.usedDescription,
  },
  {
    label: dashboardHomeCopy.value.stats.records,
    value: historyRecords.value.length.toLocaleString(),
    description: dashboardHomeCopy.value.stats.recordsDescription,
  },
]);

const homeActivityItems = computed(() => {
  return historyRecords.value.slice(0, 5).map((record) => {
    const aiScore = Math.round(Number(record?.analysis?.summary?.ai || 0));
    const needsReview = aiScore >= 60;
    return {
      recordId: record.id,
      title: resolveHistoryTitle(record),
      summary: formatHistorySummary(record),
      meta: formatHistoryTimestamp(record.createdAt) || dashboardHomeCopy.value.stats.recordsDescription,
      badge: needsReview
        ? dashboardHomeCopy.value.activity.reviewBadge
        : dashboardHomeCopy.value.activity.savedBadge,
      badgeClass: needsReview
        ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-700/10'
        : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10',
    };
  });
});

const homeActionItems = computed(() => dashboardHomeCopy.value.actions);

const refreshQuota = async ({ retryOnGuestError = true } = {}) => {
  if (typeof window === 'undefined') return;
  isQuotaLoading.value = true;
  try {
    await ensureGuestToken();
    const response = await fetchQuota();
    const limit = Number(response?.limit ?? 0);
    const remaining = Number(response?.remaining ?? 0);
    quotaInfo.value = {
      actor_type: response?.actor_type || '',
      limit,
      used_today: response?.used_today ?? 0,
      remaining,
    };
    isQuotaReady.value = true;
    
    if (Number.isFinite(remaining) && remaining >= 0) {
      const currentTotal = authStore.creditUsage.total;
      
      if (currentTotal === 0) {
        const initialTotal = Math.max(limit, remaining);
        authStore.setCredits({ total: initialTotal, remaining });
      } else {
        authStore.setCredits({ remaining, onlyRemaining: true });
      }
    }
  } catch (error) {
    const errorCode = extractApiErrorCode(error);
    if (
      error?.status === 401 &&
      !authStore.isAuthenticated &&
      retryOnGuestError &&
      (errorCode === 'GUEST_TOKEN_REQUIRED' || !errorCode)
    ) {
      clearGuestToken();
      await ensureGuestToken();
      await refreshQuota({ retryOnGuestError: false });
      return;
    }
    isQuotaReady.value = false;
  } finally {
    isQuotaLoading.value = false;
  }
};

const showQuotaNoticeOnce = () => {
  if (typeof window === 'undefined') return;
  const now = new Date();
  const dayKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const storageKey = `quota_notice_shown_${dayKey}`;
  if (window.localStorage.getItem(storageKey)) return;
  window.localStorage.setItem(storageKey, 'true');
  showToast({
    title: t('header.quotaNotice.title'),
    message: `${t('header.quotaNotice.guest')}\n${t('header.quotaNotice.user')}`,
  });
};

const showQuotaUpsellOnce = () => {
  if (typeof window === 'undefined') return;
  if (authStore.isAuthenticated) return;
  const now = new Date();
  const dayKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const storageKey = `quota_upsell_shown_${dayKey}`;
  if (window.localStorage.getItem(storageKey)) return;
  window.localStorage.setItem(storageKey, 'true');
  loginMessage.value = t('scan.loginPrompt.upsell');
  showLoginModal.value = true;
};

const promptGuestQuotaUpgrade = ({ exhausted = false } = {}) => {
  if (authStore.isAuthenticated) return;

  loginMessage.value = exhausted
    ? t('scan.loginPrompt.quotaExhausted', {
      required: scanStore.inputText.length,
      remaining: Math.max(0, quotaRemainingValue.value || 0),
    })
    : t('scan.loginPrompt.quotaShortfall', {
      required: scanStore.inputText.length,
      remaining: Math.max(0, quotaRemainingValue.value || 0),
    });
  showLoginModal.value = true;
};

const isComingSoonPanel = (panel) => !allowedPanelSet.has(panel);
const isComingSoonFunction = (key) => !allowedFunctionKeys.has(key);

const functionLabelMap = computed(() =>
  functionOptions.value.reduce((acc, option) => {
    acc[option.key] = option.label;
    return acc;
  }, {})
);

const selectedFunctionSummary = computed(() => {
  if (!scanStore.selectedFunctions.length) {
    return t('scan.functions.scan');
  }
  return scanStore.selectedFunctions.map((key) => functionLabelMap.value[key] || key).join(t('scan.separator'));
});

const loginPromptLoginTo = computed(() => ({
  name: 'login',
  query: { redirect: route.fullPath },
}));

const loginPromptRegisterTo = computed(() => ({
  name: 'register',
  query: { redirect: route.fullPath },
}));

const hasResults = computed(() => Boolean(detectionResults.value));

const buildPreviewHtmlForAnalysis = ({ analysis, editorHtml = '', inputText = '' } = {}) => {
  if (!analysis) return '';
  return buildHighlightedPreviewHtml({
    editorHtml,
    fallbackText: inputText,
    sentences: analysis.sentences || [],
    fallbackHighlightedHtml: analysis.highlightedHtml || analysis.highlighted_html || '',
  });
};

const syncHighlightedPreviewHtml = (analysis = detectionResults.value) => {
  highlightedPreviewHtml.value = buildPreviewHtmlForAnalysis({
    analysis,
    editorHtml: scanStore.editorHtml || '',
    inputText: scanStore.inputText || '',
  });
};

const availableResultTabs = computed(() => {
  const tabs = [{ key: 'scan', label: t('scan.functions.scan') }];
  if (scanStore.result?.polish) {
    tabs.push({ key: 'polish', label: t('scan.results.polish') });
  }
  if (scanStore.result?.translation) {
    tabs.push({ key: 'translate', label: t('scan.results.translation') });
  }
  if (scanStore.result?.citations?.length) {
    tabs.push({ key: 'citation', label: t('scan.results.citation') });
  }
  return tabs;
});

const historyRecords = computed(() => scanStore.historyRecords);

const activeHistoryRecord = computed(() =>
  historyRecords.value.find((item) => String(item.id) === String(activeHistoryId.value))
);

const resultDetailTitle = computed(() => {
  if (activeHistoryRecord.value) {
    return resolveHistoryTitle(activeHistoryRecord.value);
  }
  return buildHistoryTitle() || t('scan.results.detailTitle');
});

const isTooShortSentence = (sentence) => sentence?.type === 'too_short';
const highlightBorderClass = (sentence) =>
  getProbabilityCardClasses(clampProbability(sentence?.probability), sentence?.type);
const formatSentenceProbabilityLabel = (sentence) =>
  isTooShortSentence(sentence)
    ? t('scan.results.tooShort')
    : t('scan.results.probability', { value: Math.round((sentence?.probability || 0) * 100) });
const setActiveSentence = (sentenceId = '') => {
  activeSentenceId.value = sentenceId || '';
};
const clearActiveSentence = () => {
  activeSentenceId.value = '';
};
const getSentenceBlockId = (sentence) => String(sentence?.id || '');
const getSentenceDefaultActiveId = (sentence) => {
  const startParagraph = Number(sentence?.startParagraph ?? sentence?.start_paragraph);
  const paragraphIndex = Number.isFinite(startParagraph) && startParagraph > 0 ? startParagraph : 1;
  return buildSentenceParagraphLinkId(sentence, paragraphIndex);
};
const isSentenceResultActive = (sentence) => {
  const blockId = getSentenceBlockId(sentence);
  const activeId = String(activeSentenceId.value || '');
  return Boolean(blockId) && (activeId === blockId || activeId.startsWith(`${blockId}:p-`));
};
const setActiveSentenceFromResultParagraph = (event, sentence) => {
  const target = event?.target;
  const targetElement = target?.nodeType === 3 ? target.parentElement : target;
  const paragraphNode = targetElement?.closest?.('[data-sentence-id]');
  const paragraphId = paragraphNode?.getAttribute?.('data-sentence-id');
  if (paragraphId) {
    setActiveSentence(paragraphId);
  }
};

const syncPreviewHoverState = async () => {
  const containers = [previewContentRef.value].filter(Boolean);
  containers.forEach((container) => {
    const nodes = Array.from(container.querySelectorAll('[data-sentence-id]'));
    nodes.forEach((node) => {
      const nodeSentenceId = node.getAttribute('data-sentence-id');
      node.classList.toggle(
        'is-linked-active',
        Boolean(activeSentenceId.value) && nodeSentenceId === activeSentenceId.value
      );
    });
  });
};

const parsePanel = (value) => {
  if (typeof value !== 'string') return 'home';
  if (value === 'history') return 'document';
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
  if (isComingSoonPanel(next)) {
    triggerComingSoon(next === 'qa' ? t('scan.nav.qa') : t('scan.nav.pricing'));
    return;
  }
  if (activePanel.value === next) return;
  activePanel.value = next;
};

const isPanelActive = (panel) => activePanel.value === panel;

const clearCurrentHistorySelection = () => {
  activeHistoryId.value = '';
  isResultDetailOpen.value = false;
  if ('detail' in route.query) {
    syncDetailRoute('');
  }
};

const clearHistorySelection = () => {
  selectedHistoryIds.value = [];
};

const isHistorySelected = (id) => selectedHistoryIds.value.some((item) => String(item) === String(id));

const toggleHistorySelection = (id) => {
  const normalizedId = String(id);
  if (!normalizedId) return;
  if (isHistorySelected(normalizedId)) {
    selectedHistoryIds.value = selectedHistoryIds.value.filter((item) => String(item) !== normalizedId);
  } else {
    selectedHistoryIds.value = [...selectedHistoryIds.value, id];
  }
};

const toggleHistoryManageMode = () => {
  isHistoryManaging.value = !isHistoryManaging.value;
  clearHistorySelection();
  cancelRenameHistory();
};

const clearHistorySearch = () => {
  historySearchQuery.value = '';
};

const runHistoryAction = async (action) => {
  if (isHistoryActionPending.value) return null;
  isHistoryActionPending.value = true;
  try {
    return await action();
  } catch (error) {
    showToast({
      title: t('scan.history.actionErrorTitle'),
      message: error?.message || t('scan.history.actionErrorMessage'),
    });
    return null;
  } finally {
    isHistoryActionPending.value = false;
  }
};

const startRenameHistory = (record) => {
  renamingHistoryId.value = record?.id || '';
  renameHistoryDraft.value = resolveHistoryTitle(record);
};

const cancelRenameHistory = () => {
  renamingHistoryId.value = '';
  renameHistoryDraft.value = '';
};

const confirmRenameHistory = async () => {
  const id = renamingHistoryId.value;
  const title = renameHistoryDraft.value.trim();
  if (!id || !title) return;
  await runHistoryAction(async () => {
    await scanStore.renameHistoryRecord(id, title);
    cancelRenameHistory();
  });
};

const togglePinnedHistory = async (record) => {
  if (!record?.id) return;
  await runHistoryAction(() => scanStore.togglePinnedHistoryRecord(record.id));
};

const deleteSingleHistoryRecord = async (record) => {
  if (!record?.id) return;
  if (typeof window !== 'undefined' && !window.confirm(t('scan.history.deleteConfirm'))) return;
  const deletedActiveRecord = String(record.id) === String(activeHistoryId.value);
  await runHistoryAction(async () => {
    await scanStore.deleteHistoryRecord(record.id);
    selectedHistoryIds.value = selectedHistoryIds.value.filter((item) => String(item) !== String(record.id));
    if (deletedActiveRecord) {
      await resetEditor();
    }
  });
};

const deleteSelectedHistoryRecords = async () => {
  const ids = [...selectedHistoryIds.value];
  if (!ids.length) return;
  if (typeof window !== 'undefined' && !window.confirm(t('scan.history.deleteSelectedConfirm', { value: ids.length }))) return;
  const shouldResetEditor = ids.some((id) => String(id) === String(activeHistoryId.value));
  await runHistoryAction(async () => {
    await scanStore.batchDeleteHistoryRecords(ids);
    clearHistorySelection();
    if (shouldResetEditor) {
      await resetEditor();
    }
  });
};

const clearAllHistoryRecords = async () => {
  if (!historyRecords.value.length) return;
  if (typeof window !== 'undefined' && !window.confirm(t('scan.history.clearAllConfirm'))) return;
  await runHistoryAction(async () => {
    await scanStore.clearAllHistoryRecords();
    clearHistorySelection();
    await resetEditor();
  });
};

const searchHistoryRecords = async () => {
  await scanStore.searchHistoryRecords({ q: historySearchQuery.value });
  selectedHistoryIds.value = selectedHistoryIds.value.filter((id) =>
    historyRecords.value.some((record) => String(record.id) === String(id))
  );
};

const loadHistoryRecord = async (id) => {
  if (id === null || id === undefined || id === '') return;
  if (isHistoryManaging.value) {
    toggleHistorySelection(id);
    return;
  }
  let record = historyRecords.value.find((item) => String(item.id) === String(id));
  if (authStore.isAuthenticated && (!record || !record.analysis)) {
    record = (await scanStore.fetchHistoryRecordDetail(id)) || record;
  }
  if (!record) return;

  activeHistoryId.value = record.id;
  setActivePanel('document');
  scanStore.loadHistoryRecord(record);
  if (record.analysis) {
    syncHighlightedPreviewHtml(record.analysis);
    editorMode.value = 'preview';
  } else {
    highlightedPreviewHtml.value = '';
    editorMode.value = 'edit';
  }
  activeResultTab.value = 'scan';
  await nextTick();
  syncEditorFromStore();
};

const openHistoryRecord = async (id) => {
  await loadHistoryRecord(id);
};

const syncDetailRoute = (detailId = '') => {
  const query = { ...route.query };
  if (detailId) {
    query.panel = 'document';
    query.detail = String(detailId);
    router.push({ name: 'dashboard', query });
    return;
  }
  if (!('detail' in query)) return;
  delete query.detail;
  router.replace({ name: 'dashboard', query });
};

const openResultDetail = () => {
  if (!hasResults.value) return;
  isResultDetailOpen.value = true;
  const detailId = scanStore.currentResultHistoryId || activeHistoryId.value || 'current';
  syncDetailRoute(detailId);
};

const closeResultDetail = () => {
  isResultDetailOpen.value = false;
  syncDetailRoute('');
};

const syncResultDetailFromRoute = async (value) => {
  const detailId = Array.isArray(value) ? value[0] : value;
  if (!detailId) {
    isResultDetailOpen.value = false;
    return;
  }
  setActivePanel('document');
  if (detailId !== 'current' && String(scanStore.currentResultHistoryId || activeHistoryId.value) !== String(detailId)) {
    await loadHistoryRecord(detailId);
  }
  isResultDetailOpen.value = hasResults.value;
};

const formatHistoryTimestamp = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
};

const buildHistoryTitle = () => {
  if (scanStore.lastUploadedFileName) {
    return t('scan.history.fileLabel', { name: scanStore.lastUploadedFileName });
  }
  const raw = (scanStore.inputText || '').trim();
  if (!raw) {
    return '';
  }
  return raw.length > 24 ? `${raw.slice(0, 24)}...` : raw;
};

const formatHistorySummary = (record) => {
  if (!record?.analysis?.summary) {
    return t('scan.functions.scan');
  }
  const { ai, human } = collapseSummaryForDisplay(record.analysis.summary);
  return `${t('scan.results.summary.aiLabel')} ${ai}% / ${t('scan.results.summary.humanShort')} ${human}%`;
};

const syncEditorFromStore = () => {
  if (!editorRef.value) return;
  const html = scanStore.editorHtml || '';
  if (editorRef.value.innerHTML !== html) {
    editorRef.value.innerHTML = html;
  }
};

onMounted(async () => {
  await scanStore.loadExamples(locale.value);
  if (scanStore.inputText && scanStore.inputText.trim() !== '') {
    localText.value = scanStore.inputText;
  }
  if (scanStore.inputText && !scanStore.editorHtml) {
    scanStore.setText(scanStore.inputText);
  }
  const initialPanel = parsePanel(route.query.panel);
  activePanel.value = initialPanel;
  syncPanelToRoute(initialPanel);
  if (initialPanel === 'home') {
    pickRandomQuote();
  }
  const features = parseFeatures(route.query.features);
  if (features.length) {
    scanStore.setFunctions(features);
  }
  if (scanStore.selectedFunctions.some((key) => isComingSoonFunction(key)) || !scanStore.selectedFunctions.length) {
    scanStore.setFunctions(['scan']);
  }
  await nextTick();
  syncEditorFromStore();
  maybeShowOnboarding();
  await refreshQuota();
  showQuotaNoticeOnce();
  document.addEventListener('click', onGlobalClick);
  document.addEventListener('keydown', onDetailKeydown);
  await syncResultDetailFromRoute(route.query.detail);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onGlobalClick);
  document.removeEventListener('keydown', featureModalKeyHandler);
  document.removeEventListener('keydown', onDetailKeydown);
  if (historySearchTimer) {
    clearTimeout(historySearchTimer);
  }
});

watch(
  () => scanStore.editorHtml,
  () => {
    syncEditorFromStore();
  }
);

watch(
  () => scanStore.inputText,
  (value) => {
    if (value && value !== localText.value) {
      localText.value = value;
    }
    if (value && !scanStore.editorHtml) {
      scanStore.setText(value);
    }
  },
  { immediate: true }
);

watch(
  () => locale.value,
  (value) => {
    scanStore.loadExamples(value);
  }
);

watch(
  () => authStore.isAuthenticated,
  () => {
    refreshQuota();
  }
);

watch(availableResultTabs, (tabs) => {
  clearActiveSentence();
  if (!tabs.find((tab) => tab.key === activeResultTab.value)) {
    activeResultTab.value = 'scan';
  }
});

watch(activeResultTab, () => {
  clearActiveSentence();
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
    if (typeof value === 'string' && (value === 'history' || !panelOptions.includes(value))) {
      syncPanelToRoute(next);
      return;
    }
    if (activePanel.value !== next) {
      activePanel.value = next;
    }
  }
);

watch(activePanel, async (panel) => {
  syncPanelToRoute(panel);
  clearActiveSentence();
  if (panel === 'document') {
    await scanStore.searchHistoryRecords({ q: historySearchQuery.value });
  }
  if (panel === 'home') {
    pickRandomQuote();
  } else {
    closeFeatureModal();
  }
});

watch(historySearchQuery, () => {
  if (historySearchTimer) {
    clearTimeout(historySearchTimer);
  }
  historySearchTimer = setTimeout(() => {
    searchHistoryRecords();
  }, 250);
});

watch(activeHistoryId, async (newId) => {
  clearActiveSentence();
  if (newId && authStore.isAuthenticated) {
    await scanStore.fetchHistoryRecordDetail(newId);
  }
});

watch(
  () => route.query.detail,
  (value) => {
    syncResultDetailFromRoute(value);
  }
);

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

    if (activeHistoryId.value && !records.find((item) => String(item.id) === String(activeHistoryId.value))) {
      activeHistoryId.value = '';
    }
  },
  { deep: true }
);

watch(
  [activeSentenceId, highlightedPreviewHtml, activePanel, activeHistoryId, editorMode],
  () => {
    syncPreviewHoverState();
  },
  { flush: 'post' }
);

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
    .filter((item) => allowedFunctionKeys.has(item));
};

const formatHighlightedSentence = (sentence) => {
  const classes = getProbabilityTextClasses(clampProbability(sentence.probability), sentence?.type);
  const startParagraph = Number(sentence?.startParagraph ?? sentence?.start_paragraph);
  const firstParagraphIndex = Number.isFinite(startParagraph) && startParagraph > 0 ? startParagraph : 1;
  const blockId = getSentenceBlockId(sentence);
  return String(sentence?.text || '')
    .split('\n')
    .filter((item) => item.trim())
    .map((item, index) => {
      const paragraphIndex = firstParagraphIndex + index;
      const sentenceId = buildSentenceParagraphLinkId(sentence, paragraphIndex);
      const blockAttribute = blockId && blockId !== sentenceId ? ` data-sentence-block-id="${escapeHtml(blockId)}"` : '';
      return `<p class="font-semibold leading-relaxed ${classes}" data-sentence-id="${escapeHtml(sentenceId)}"${blockAttribute}>${escapeHtml(item)}</p>`;
    })
    .join('');
};

const formatSentenceBlockLabel = (sentence, index = 0) => {
  const start = Number(sentence?.startParagraph ?? sentence?.start_paragraph);
  const end = Number(sentence?.endParagraph ?? sentence?.end_paragraph);
  const isChinese = String(locale.value || '').toLowerCase().startsWith('zh');

  if (Number.isFinite(start) && Number.isFinite(end) && start > 0 && end > 0) {
    if (start === end) {
      return isChinese ? `段落 ${start}` : `Paragraph ${start}`;
    }
    return isChinese ? `段落 ${start}-${end} · 合并检测` : `Paragraphs ${start}-${end} · Merged`;
  }

  const displayIndex = index + 1;
  return isChinese ? `检测块 ${displayIndex}` : `Block ${displayIndex}`;
};

const openFeatureModal = (card) => {
  if (!card || card.disabled) return;
  activeFeatureCard.value = card;
};

const handleFeatureModalAction = (card) => {
  if (!card) return;
  closeFeatureModal();
  if (card.buttonVariant === 'free') {
    startNewScan();
    return;
  }
  triggerComingSoon(card.title);
};

const closeFeatureModal = () => {
  activeFeatureCard.value = null;
};

const featureModalKeyHandler = (event) => {
  if (event.key === 'Escape') {
    closeFeatureModal();
  }
};

const onDetailKeydown = (event) => {
  if (event.key === 'Escape' && isResultDetailOpen.value) {
    closeResultDetail();
  }
};

const handleIntegrationAction = (integration) => {
  if (!integration) return;
  if (integration.action === 'multi-upload') {
    triggerComingSoon(integration.label);
    return;
  }
  triggerComingSoon(integration.label);
};

const runHomeAction = (action) => {
  if (action === 'new-scan') {
    startNewScan();
    return;
  }
  if (action === 'document') {
    setActivePanel('document');
    return;
  }
  if (action === 'history') {
    setActivePanel('document');
  }
};

const applyExample = async (key) => {
  clearCurrentHistorySelection();
  scanStore.applyExample(key);
  scanStore.resetResult();
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
  await nextTick();
  syncEditorFromStore();
};

const isFunctionSelected = (key) => scanStore.selectedFunctions.includes(key);

const toggleFunction = (key) => {
  if (isComingSoonFunction(key)) {
    triggerComingSoon(t('scan.functions.' + key));
    return;
  }
  scanStore.toggleFunction(key);
  clearCurrentHistorySelection();
  scanStore.resetResult();
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
};

const onEditorInput = (event) => {
  clearCurrentHistorySelection();
  scanStore.setEditorHtml(event.target.innerHTML);
  if (event.target.innerHTML !== scanStore.editorHtml) {
    event.target.innerHTML = scanStore.editorHtml;
  }
  localText.value = scanStore.inputText;
  scanStore.resetResult();
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
};

const onEditorPaste = (event) => {
  const clipboard = event.clipboardData;
  if (!clipboard) return;
  const html = clipboard.getData('text/html');
  const text = clipboard.getData('text/plain');
  if (!html && !text) return;

  event.preventDefault();
  const safeHtml = sanitizeHtmlForEditor(html || plainTextToHtml(text), text);
  document.execCommand('insertHTML', false, safeHtml);
  if (editorRef.value) {
    clearCurrentHistorySelection();
    scanStore.setEditorHtml(editorRef.value.innerHTML);
    editorRef.value.innerHTML = scanStore.editorHtml;
    localText.value = scanStore.inputText;
    scanStore.resetResult();
    highlightedPreviewHtml.value = '';
    editorMode.value = 'edit';
  }
};

const applyCommand = (command) => {
  if (!editorRef.value) return;
  editorRef.value.focus();
  document.execCommand(command, false, null);
  scanStore.setEditorHtml(editorRef.value.innerHTML);
  scanStore.commitDraftToStorage();
};

const onFontSizeChange = (event) => {
  const value = event?.target?.value ?? event;
  if (!value) return;
  if (!editorRef.value) return;
  editorRef.value.focus();
  document.execCommand('fontSize', false, fontSizeMap[value]);
  fontSizeSelection.value = '';
  scanStore.setEditorHtml(editorRef.value.innerHTML);
  scanStore.commitDraftToStorage();
};

const handleScan = async () => {
  if (!scanStore.selectedFunctions.length) {
    scanStore.setFunctions(['scan']);
  }

  if (!scanStore.inputText.trim()) {
    showToast({ title: '\u63D0\u793A', message: t('scan.loginPrompt.inputFirst') });
    return;
  }

  if (isOverCharacterLimit.value) {
    showToast({
      title: '\u63D0\u793A',
      message: t('scan.editor.tooLongToast', {
        current: characterCount.value,
        limit: scanStore.characterLimit,
      }),
    });
    return;
  }

  if (!canStartScan.value) {
    showToast({
      title: '\u63D0\u793A',
      message: t('scan.editor.minDetectRemaining', { remaining: remainingToMinDetect.value }),
    });
    return;
  }

  await ensureGuestToken();
  if (!authStore.isAuthenticated && isQuotaReady.value && scanStore.inputText.length > quotaRemainingValue.value) {
    promptGuestQuotaUpgrade();
    return;
  }

  isScanning.value = true;
  scanStore.resetResult();
  highlightedPreviewHtml.value = '';
  try {
    const analysis = await scanStore.analyzeText(scanStore.inputText, {
      functions: scanStore.selectedFunctions,
      html: scanStore.editorHtml || plainTextToHtml(scanStore.inputText),
    });
    syncHighlightedPreviewHtml(analysis);
    editorMode.value = 'preview';
    activeResultTab.value = 'scan';
    activeHistoryId.value = scanStore.currentResultHistoryId || historyRecords.value[0]?.id || '';
    markOnboardingStep('scan');
    markOnboardingStep('review');
    await refreshQuota({ retryOnGuestError: false });
    showQuotaUpsellOnce();
  } catch (error) {
    const errorCode = extractApiErrorCode(error);
    if (errorCode === 'TEXT_TOO_LONG') {
      showToast({
        title: '\u63D0\u793A',
        message:
          error?.message ||
          t('scan.editor.tooLongToast', {
            current: characterCount.value,
            limit: scanStore.characterLimit,
          }),
      });
    } else if (error?.status === 429 && errorCode === 'QUOTA_EXCEEDED') {
      await refreshQuota({ retryOnGuestError: false });
      promptGuestQuotaUpgrade({ exhausted: true });
    } else {
      showScanFailureToast(error);
    }
  } finally {
    isScanning.value = false;
    scanStore.commitDraftToStorage();
  }
};

const exportReport = async () => {
  if (!scanStore.result) return;
  if (!authStore.isAuthenticated) {
    showExportLockedToast();
    return;
  }

  try {
    const payload = buildReportPayload({
      reportType: 'scan',
      historyId: scanStore.currentResultHistoryId,
    });
    if (!payload) {
      showToast({
        title: t('scan.results.exportErrorTitle'),
        message: t('scan.results.exportErrorMessage'),
      });
      return;
    }
    await downloadReport(payload, 'aidetector-report.pdf');
  } catch {
    showToast({
      title: t('scan.results.exportErrorTitle'),
      message: t('scan.results.exportErrorMessage'),
    });
  }
};

const resetEditor = async () => {
  clearCurrentHistorySelection();
  scanStore.resetText();
  scanStore.resetResult();
  highlightedPreviewHtml.value = '';
  editorMode.value = 'edit';
  await nextTick();
  syncEditorFromStore();
  scanStore.commitDraftToStorage();
};

const applyPolishSuggestion = (polishText) => {
  if (!polishText) return;
  triggerComingSoon(t('scan.results.polish'));
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
    clearCurrentHistorySelection();
    scanStore.resetResult();
    highlightedPreviewHtml.value = '';
    editorMode.value = 'edit';
    nextTick(() => {
      syncEditorFromStore();
    });
    markOnboardingStep('upload');
  } catch (error) {
    showUploadFailureToast(error);
  } finally {
    event.target.value = '';
    scanStore.commitDraftToStorage();
  }
};

const triggerMultiUpload = () => {
  newMenuOpen.value = false;
  triggerComingSoon(t('scan.nav.multiUpload'));
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
    clearCurrentHistorySelection();
    scanStore.resetResult();
    highlightedPreviewHtml.value = '';
    editorMode.value = 'edit';
    nextTick(() => {
      syncEditorFromStore();
    });
    markOnboardingStep('upload');
  } catch (error) {
    showUploadFailureToast(error);
  } finally {
    scanStore.commitDraftToStorage();
  }
};

const goToProfile = () => {
  setActivePanel('profile');
};

const startNewScan = () => {
  newMenuOpen.value = false;
  setActivePanel('document');
  clearCurrentHistorySelection();
  scanStore.resetAll();
  scanStore.resetResult();
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
  @apply relative flex w-full items-center justify-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 xl:justify-start xl:text-sm;
}
.nav-item--active {
  @apply bg-primary-50 text-slate-900;
}
.nav-item--disabled {
  @apply cursor-not-allowed opacity-50 hover:bg-transparent;
}
.nav-label {
  @apply hidden xl:inline;
}
.nav-indicator {
  @apply h-6 w-1 rounded-full bg-transparent transition;
}
.nav-indicator--active {
  @apply bg-primary-500;
}
.menu-item {
  @apply flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100;
}
.menu-item--disabled {
  @apply cursor-not-allowed opacity-50 hover:bg-transparent;
}

.toolbar-button {
  @apply inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-200 hover:text-primary-600;
}

.toolbar-select select {
  @apply rounded-full border border-slate-200 bg-white px-2 py-1 text-slate-600 focus:outline-none;
}

.editor-surface {
  @apply h-full overflow-y-auto px-8 pt-8 pb-48 text-base leading-7 text-slate-700 focus:outline-none;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.editor-surface :deep(*) {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.editor-surface:empty::before {
  content: attr(data-placeholder);
  @apply text-slate-400;
}

.preview-surface {
  @apply h-full overflow-y-auto px-8 pt-8 pb-48 text-base leading-7 text-slate-700;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.preview-surface :deep(*) {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.result-sentence-text {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.result-sentence-text :deep(*) {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.highlight-chip {
  @apply rounded-xl px-1.5 py-0.5;
  overflow-wrap: anywhere;
  word-break: break-word;
}

:deep(.highlight-chip) {
  overflow-wrap: anywhere;
  word-break: break-word;
}

:deep(.highlight-chip--structured) {
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  border-radius: 0.75rem;
  padding: 0.08rem 0.32rem;
  line-height: inherit;
  overflow-wrap: anywhere;
  word-break: break-word;
}

:deep(.highlight-chip.is-linked-active) {
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.16);
  filter: saturate(1.15) brightness(0.98);
}

.function-chip {
  @apply inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition;
}

</style>
