import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AiComposer from '@/shared/ui/AiComposer.vue'
describe('中文输入', () => {
  it('组合输入时回车不提前发送', async () => {
    const wrapper = mount(AiComposer)
    const input = wrapper.get('textarea')
    await input.setValue('海港')
    await input.trigger('compositionstart')
    await input.trigger('keydown', { key: 'Enter', isComposing: true })
    expect(wrapper.emitted('submit')).toBeUndefined()
    await input.trigger('compositionend')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('submit')).toEqual([['海港']])
  })
})
