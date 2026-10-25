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
    <template
      v-else-if="
        ['cs', 'dota', 'lol', 'valorant', 'ebasketball', 'esoccer', 'kog', 'aov'].includes(sport)
      "
    >
      <path d="M7 7h10c3 0 4 3 4 7l-1 4h-3l-3-3h-4l-3 3H4l-1-4c0-4 1-7 4-7Z" />
      <path d="M7 10v4m-2-2h4m7-1h.1m2 2h.1" />
    </template>
    <template v-else-if="['american-football', 'rugby', 'aussie-rules'].includes(sport)">
      <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-35 12 12)" />
      <path d="m8 15 8-6m-6 3 1 2m2-4 1 2" />
    </template>
    <template v-else-if="['ice-hockey', 'field-hockey', 'floorball', 'bandy'].includes(sport)">
      <path d="m6 3 7 14h6l2 3h-9L4 4m14-1L9 18" />
      <ellipse cx="5" cy="20" rx="3" ry="1" />
    </template>
    <template v-else-if="['boxing', 'mma'].includes(sport)">
      <path d="M7 16c-4-1-5-4-4-7 1-2 3-2 4 0V5c0-3 3-3 4 0 1-3 4-2 4 0 3-1 5 1 5 4v4l-5 6H8Z" />
      <path d="M8 19v3h7v-3" />
    </template>
    <template
      v-else-if="
        [
          'baseball',
          'cricket',
          'volleyball',
          'handball',
          'netball',
          'table-tennis',
          'badminton',
          'squash',
        ].includes(sport)
      "
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M5 6c6 1 7 10 1 13m12-14c-6 3-6 12 0 14m-15-7h18" />
    </template>
    <template
      v-else-if="['golf', 'snooker', 'darts', 'pesapallo', 'kabaddi', 'futsal'].includes(sport)"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
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
