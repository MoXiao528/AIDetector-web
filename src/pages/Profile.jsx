import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue';
import { usePreferencesStore } from '../store/preferences';

export default defineComponent({
  name: 'ProfilePage',
  setup() {
    const preferencesStore = usePreferencesStore();
    const drawerOpen = ref(true);
    const saving = ref(false);
    const toast = ref('');
    const avatarPreview = ref('');

    const form = reactive({
      name: '',
      organization: '',
      industry: '',
      language: 'zh-CN',
      notificationChannel: 'email',
      theme: 'system',
    });

    const industries = ['教育与研究', '媒体与出版', '企业服务', '创意与设计', '政府与公益'];
    const languages = [
      { label: '简体中文', value: 'zh-CN' },
      { label: 'English', value: 'en-US' },
      { label: '日本語', value: 'ja-JP' },
    ];
    const notificationChannels = [
      { label: '邮件提醒', value: 'email' },
      { label: '短信提醒', value: 'sms' },
      { label: '站内推送', value: 'in-app' },
    ];
    const themeOptions = [
      { label: '跟随系统', value: 'system' },
      { label: '浅色', value: 'light' },
      { label: '深色', value: 'dark' },
    ];

    const syncForm = () => {
      const stored = preferencesStore.preferences;
      form.name = stored.name || '';
      form.organization = stored.organization || '';
      form.industry = stored.industry || '';
      form.language = stored.language || 'zh-CN';
      form.notificationChannel = stored.notificationChannel || 'email';
      form.theme = stored.theme || 'system';
      avatarPreview.value = stored.avatarDataUrl || '';
    };

    onMounted(() => {
      preferencesStore.initialize();
      syncForm();
    });

    watch(
      () => ({ ...preferencesStore.preferences }),
      () => syncForm(),
      { deep: true }
    );

    const handleAvatarChange = (event) => {
      const file = event?.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        avatarPreview.value = reader.result?.toString() || '';
      };
      reader.readAsDataURL(file);
    };

    const handleSave = () => {
      saving.value = true;
      preferencesStore.updatePreferences({
        name: form.name.trim(),
        organization: form.organization.trim(),
        industry: form.industry,
        language: form.language,
        notificationChannel: form.notificationChannel,
        avatarDataUrl: avatarPreview.value,
        theme: form.theme,
      });
      toast.value = '偏好已保存到本地存储。';
      setTimeout(() => {
        toast.value = '';
      }, 2000);
      saving.value = false;
    };

    const handleReset = () => {
      preferencesStore.resetPreferences();
      syncForm();
      toast.value = '已恢复默认设置。';
      setTimeout(() => {
        toast.value = '';
      }, 1800);
    };

    const effectiveTheme = computed(() => preferencesStore.effectiveTheme);

    const renderInputField = (id, label, value, handler, placeholder = '', description = '') =>
      h('div', { class: 'space-y-2' }, [
        h('label', { class: 'text-sm font-semibold text-slate-700 dark:text-slate-200', for: id }, label),
        h('input', {
          id,
          value,
          placeholder,
          class:
            'w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-bg)] px-4 py-2 text-sm text-[color:var(--text-primary)] shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/70',
          onInput: (event) => handler(event.target.value),
        }),
        description ? h('p', { class: 'text-xs text-slate-500 dark:text-slate-400' }, description) : null,
      ]);

    const renderSelectField = (id, label, value, options, handler) =>
      h('div', { class: 'space-y-2' }, [
        h('label', { class: 'text-sm font-semibold text-slate-700 dark:text-slate-200', for: id }, label),
        h(
          'select',
          {
            id,
            value,
            class:
              'w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-bg)] px-4 py-2 text-sm text-[color:var(--text-primary)] shadow-sm focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200/70',
            onChange: (event) => handler(event.target.value),
          },
          options.map((option) => h('option', { value: option.value || option }, option.label || option))
        ),
      ]);

    const renderRadioGroup = (label, value, options, handler) =>
      h('div', { class: 'space-y-3' }, [
        h('p', { class: 'text-sm font-semibold text-slate-700 dark:text-slate-200' }, label),
        h(
          'div',
          { class: 'flex flex-wrap gap-3' },
          options.map((option) =>
            h(
              'button',
              {
                type: 'button',
                class:
                  'rounded-2xl border px-4 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary-200/70 ' +
                  (value === option.value
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-[color:var(--border-color)] bg-[color:var(--surface-bg)] text-[color:var(--text-primary)] hover:border-primary-200'),
                onClick: () => handler(option.value),
              },
              option.label
            )
          )
        ),
      ]);

    const renderAvatarPicker = () =>
      h('div', { class: 'space-y-3' }, [
        h('p', { class: 'text-sm font-semibold text-slate-700 dark:text-slate-200' }, '头像上传'),
        h('div', { class: 'flex items-center gap-4' }, [
          h('div', {
            class:
              'flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-bg)] text-sm text-slate-500',
          },
          avatarPreview.value
            ? h('img', { src: avatarPreview.value, alt: 'avatar preview', class: 'h-full w-full object-cover' })
            : '本地预览'),
          h('div', { class: 'space-y-2' }, [
            h('input', {
              id: 'avatar-upload',
              type: 'file',
              accept: 'image/*',
              class: 'text-sm text-slate-700 dark:text-slate-200',
              onChange: handleAvatarChange,
            }),
            h('p', { class: 'text-xs text-slate-500 dark:text-slate-400' }, '选择图片后立即在本地预览，并保存到本地存储。'),
          ]),
        ]),
      ]);

    const renderDrawerForm = () =>
      h(
        'form',
        {
          class: 'space-y-6',
          onSubmit: (event) => {
            event.preventDefault();
            handleSave();
          },
        },
        [
          renderInputField('name', '姓名', form.name, (val) => (form.name = val), '请输入姓名'),
          renderInputField('organization', '组织', form.organization, (val) => (form.organization = val), '公司/学校/团队'),
          renderSelectField('industry', '行业', form.industry, industries.map((item) => ({ label: item, value: item })), (val) => (form.industry = val)),
          renderAvatarPicker(),
          renderSelectField('language', '界面语言', form.language, languages, (val) => (form.language = val)),
          renderRadioGroup('通知渠道', form.notificationChannel, notificationChannels, (val) => (form.notificationChannel = val)),
          renderRadioGroup('主题模式', form.theme, themeOptions, (val) => (form.theme = val)),
          h('div', { class: 'flex flex-wrap gap-3' }, [
            h(
              'button',
              {
                type: 'submit',
                disabled: saving.value,
                class:
                  'inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400',
              },
              saving.value ? '保存中...' : '保存设置'
            ),
            h(
              'button',
              {
                type: 'button',
                class:
                  'inline-flex items-center justify-center rounded-full border border-[color:var(--border-color)] px-5 py-2 text-sm font-semibold text-[color:var(--text-primary)] shadow-sm transition hover:border-primary-300 hover:text-primary-700',
                onClick: handleReset,
              },
              '恢复默认'
            ),
            toast.value
              ? h('span', { class: 'text-sm font-medium text-emerald-600' }, toast.value)
              : null,
          ]),
        ]
      );

    const renderSummaryCard = () =>
      h('div', { class: 'surface-card border rounded-3xl p-6 shadow-lg' }, [
        h('p', { class: 'text-sm font-semibold text-slate-500 dark:text-slate-300' }, '当前偏好'),
        h('div', { class: 'mt-4 space-y-3 text-sm text-[color:var(--text-primary)]' }, [
          h('div', { class: 'flex items-center justify-between' }, [h('span', '姓名'), h('span', form.name || '未填写')]),
          h('div', { class: 'flex items-center justify-between' }, [h('span', '组织'), h('span', form.organization || '未填写')]),
          h('div', { class: 'flex items-center justify-between' }, [h('span', '行业'), h('span', form.industry || '未选择')]),
          h('div', { class: 'flex items-center justify-between' }, [h('span', '语言'), h('span', languages.find((item) => item.value === form.language)?.label || form.language)]),
          h('div', { class: 'flex items-center justify-between' }, [h('span', '通知渠道'), h('span', notificationChannels.find((item) => item.value === form.notificationChannel)?.label || form.notificationChannel)]),
          h('div', { class: 'flex items-center justify-between' }, [h('span', '主题'), h('span', themeOptions.find((item) => item.value === form.theme)?.label || form.theme)]),
          h('div', { class: 'flex items-center justify-between' }, [h('span', '系统主题'), h('span', effectiveTheme.value === 'dark' ? '深色' : '浅色')]),
        ]),
      ]);

    const renderDrawer = () =>
      h('div', { class: 'fixed inset-y-0 right-0 z-30 w-full max-w-xl transform transition-transform duration-300 ' + (drawerOpen.value ? 'translate-x-0' : 'translate-x-full') }, [
        h('div', { class: 'h-full overflow-y-auto border-l border-[color:var(--border-color)] bg-[color:var(--surface-bg)] px-6 py-8 shadow-2xl' }, [
          h('div', { class: 'mb-6 flex items-center justify-between' }, [
            h('div', [
              h('p', { class: 'text-lg font-semibold text-[color:var(--text-primary)]' }, '个人资料与通知'),
              h('p', { class: 'text-sm text-slate-500 dark:text-slate-400' }, '填写资料、选择语言与通知渠道，支持本地存储。'),
            ]),
            h(
              'button',
              {
                type: 'button',
                class: 'rounded-full border border-[color:var(--border-color)] px-3 py-1 text-sm text-[color:var(--text-primary)] hover:border-primary-300 hover:text-primary-700',
                onClick: () => (drawerOpen.value = false),
              },
              '收起'
            ),
          ]),
          renderDrawerForm(),
        ]),
      ]);

    const renderDrawerOverlay = () =>
      drawerOpen.value
        ? h('div', {
            class: 'fixed inset-0 z-20 bg-slate-900/30 backdrop-blur-sm',
            onClick: () => (drawerOpen.value = false),
          })
        : null;

    return () =>
      h('div', { class: 'min-h-screen bg-[color:var(--page-bg)]' }, [
        h('div', { class: 'mx-auto max-w-6xl px-6 py-10' }, [
          h('div', { class: 'flex flex-col gap-6 lg:flex-row lg:items-center' }, [
            h('div', { class: 'flex-1 space-y-4' }, [
              h('h1', { class: 'text-3xl font-semibold text-[color:var(--text-primary)] sm:text-4xl' }, '个人中心'),
              h('p', { class: 'text-base text-[color:var(--text-muted)] sm:text-lg' }, '集中管理姓名、组织、语言与通知偏好。主题切换与本地存储同步，随时恢复默认。'),
              h('div', { class: 'flex flex-wrap gap-3' }, [
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500',
                    onClick: () => (drawerOpen.value = true),
                  },
                  '打开抽屉表单'
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'rounded-full border border-[color:var(--border-color)] px-5 py-2 text-sm font-semibold text-[color:var(--text-primary)] shadow-sm transition hover:border-primary-300 hover:text-primary-700',
                    onClick: handleReset,
                  },
                  '恢复默认'
                ),
              ]),
            ]),
            h('div', { class: 'w-full rounded-3xl border border-[color:var(--border-color)] bg-[color:var(--surface-bg)] p-6 shadow-lg lg:w-80' }, [
              h('p', { class: 'text-sm font-semibold text-slate-500 dark:text-slate-300' }, '主题与状态'),
              h('div', { class: 'mt-4 space-y-3 text-sm text-[color:var(--text-primary)]' }, [
                h('div', { class: 'flex items-center justify-between' }, [h('span', '当前模式'), h('span', themeOptions.find((item) => item.value === form.theme)?.label || '系统')]),
                h('div', { class: 'flex items-center justify-between' }, [h('span', '系统方案'), h('span', effectiveTheme.value === 'dark' ? '深色' : '浅色')]),
                h('div', { class: 'rounded-2xl bg-primary-50 p-3 text-primary-700' }, '切换主题会立即作用于全局样式。'),
              ]),
            ]),
          ]),
          h('div', { class: 'mt-10 grid gap-6 lg:grid-cols-3' }, [
            h('div', { class: 'lg:col-span-2 space-y-4' }, [
              h('div', { class: 'surface-card border rounded-3xl p-6 shadow-lg' }, [
                h('h2', { class: 'text-xl font-semibold text-[color:var(--text-primary)]' }, '个人亮点'),
                h('p', { class: 'mt-3 text-sm text-[color:var(--text-muted)]' }, '记录在本地浏览器，无需登录即可保留。'),
                h('div', { class: 'mt-4 grid gap-4 sm:grid-cols-2' }, [
                  h('div', { class: 'rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 p-4 text-sm text-primary-900' }, [
                    h('p', { class: 'font-semibold' }, '即时保存'),
                    h('p', { class: 'mt-2 leading-relaxed' }, '所有字段更新后即可保存在本地存储，刷新页面仍然可见。'),
                  ]),
                  h('div', { class: 'rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-bg)] p-4 text-sm text-[color:var(--text-primary)]' }, [
                    h('p', { class: 'font-semibold' }, '抽屉式表单'),
                    h('p', { class: 'mt-2 leading-relaxed' }, '在右侧抽屉中集中完成头像上传、语言与通知配置。'),
                  ]),
                ]),
              ]),
              renderSummaryCard(),
            ]),
            h('div', { class: 'space-y-4' }, [
              h('div', { class: 'surface-card border rounded-3xl p-6 shadow-lg' }, [
                h('h3', { class: 'text-lg font-semibold text-[color:var(--text-primary)]' }, '头像预览'),
                h('div', { class: 'mt-3 flex items-center gap-3' }, [
                  avatarPreview.value
                    ? h('img', { src: avatarPreview.value, alt: 'avatar preview', class: 'h-14 w-14 rounded-2xl object-cover border border-[color:var(--border-color)]' })
                    : h('div', { class: 'flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-[color:var(--border-color)] text-xs text-slate-500' }, '未上传'),
                  h('div', { class: 'text-sm text-[color:var(--text-muted)]' }, '在抽屉中上传头像即可立即查看本地预览。'),
                ]),
              ]),
            ]),
          ]),
        ]),
        renderDrawerOverlay(),
        renderDrawer(),
      ]);
  },
});
