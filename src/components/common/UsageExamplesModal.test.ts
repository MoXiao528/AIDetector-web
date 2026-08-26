import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import { createI18n } from '../../i18n';
import UsageExamplesModal from './UsageExamplesModal.vue';

describe('UsageExamplesModal', () => {
  it('结果快照只展示 AI/Human 两个分桶', () => {
    const wrapper = mount(UsageExamplesModal, {
      props: {
        open: true,
        examples: [
          {
            key: 'binary-example',
            title: 'Binary example',
            docType: 'Test',
            length: '20 words',
            description: 'Binary result',
            ai: 45,
            human: 55,
            snapshot: 'Snapshot',
            snippet: 'Example text',
          },
        ],
      },
      global: {
        plugins: [createI18n()],
      },
    });

    expect(wrapper.text()).toContain('AI 45%');
    expect(wrapper.text()).toMatch(/(?:人工|Human) 55%/);
    expect(wrapper.text()).not.toContain('Mixed');
    expect(wrapper.text()).not.toContain('待复核 25%');
  });
});
