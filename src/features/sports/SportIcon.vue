<script setup lang="ts">
withDefaults(defineProps<{ sport: string; size?: number }>(), { size: 26 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.65"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="sport === 'football'">
      <circle cx="12" cy="12" r="9.5" />
      <path
        d="m12 7 4.75 3.45-1.82 5.6H9.07l-1.82-5.6L12 7Z"
        fill="currentColor"
        stroke-width="1"
      />
      <path
        d="M12 7V2.5m4.75 7.95 4.27-1.39m-6.09 6.99 2.64 3.63m-8.5-3.63-2.64 3.63m.82-9.23L2.98 9.06"
      />
    </template>
    <template v-else-if="sport === 'basketball'">
      <circle cx="12" cy="12" r="9.5" />
      <path
        d="m5.3 5.3 13.4 13.4m0-13.4L5.3 18.7M3.1 8.8c5.4 1.6 10.5-1.1 12.1-5.7M8.8 20.9c1.6-5.4 6.7-8.1 12.1-5.7"
      />
    </template>
    <template v-else-if="sport === 'tennis'">
      <circle cx="12" cy="12" r="9.5" />
      <path
        d="M7.1 3.9c5.2 4.6 5.2 11.6 0 16.2M16.9 3.9c-5.2 4.6-5.2 11.6 0 16.2"
        transform="rotate(28 12 12)"
      />
    </template>
    <template v-else>
      <circle
        v-for="x in [5, 12, 19]"
        :key="x"
        :cx="x"
        cy="12"
        r="1.5"
        fill="currentColor"
        stroke="none"
      />
    </template>
  </svg>
</template>
