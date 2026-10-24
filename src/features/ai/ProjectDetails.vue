<script setup lang="ts">
import { BookOpen } from '@lucide/vue'
import type { ChatAnswer, DetailPanel } from './conversation-types'
defineProps<{ answer: ChatAnswer; panel: DetailPanel }>()
</script>
<template>
  <template v-if="answer.project">
    <p class="ac-detail-subtitle">{{ answer.project.title }} · {{ answer.project.scope }}</p>
    <template v-if="panel !== 'sources'"
      ><section
        v-for="item in [...answer.project.reasons, ...answer.project.details]"
        :key="item.title"
        class="ac-card"
      >
        <h3>{{ item.title }}</h3>
        <p class="ac-prose">{{ item.text }}</p>
      </section>
      <section class="ac-card">
        <h2>后续核对方案</h2>
        <ol class="ac-project-plan">
          <li v-for="step in answer.project.plan" :key="step">{{ step }}</li>
        </ol>
      </section></template
    >
    <section class="ac-card">
      <h2>来源与数据</h2>
      <article v-for="source in answer.sources" :key="source.id" class="ac-source-item">
        <h3><BookOpen :size="17" />{{ source.title }}</h3>
        <p class="ac-source-type">{{ source.type }}</p>
        <blockquote>{{ source.excerpt }}</blockquote>
        <p class="ac-card-note">{{ source.asOf }} · {{ source.status }}</p>
      </article>
    </section>
    <p class="ac-prose">{{ answer.project.caveat }}</p>
  </template>
</template>
