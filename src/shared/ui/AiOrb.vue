<script setup lang="ts">
withDefaults(defineProps<{ large?: boolean }>(), { large: false })
</script>
<template>
  <span class="ae-ai-orb" :class="{ 'ae-ai-orb--large': large }" aria-hidden="true">
    <svg viewBox="0 0 32 32">
      <path
        d="M16 2c1.5 8.5 5.5 12.5 14 14-8.5 1.5-12.5 5.5-14 14C14.5 21.5 10.5 17.5 2 16 10.5 14.5 14.5 10.5 16 2Z"
        fill="currentColor"
      />
    </svg>
  </span>
</template>
<style scoped>
.ae-ai-orb {
  position: relative;
  isolation: isolate;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #fff;
  color: #fff;
  background: radial-gradient(
    ellipse at 30% 12%,
    #e0f6ff 0%,
    #7bc4ff 17%,
    #2592ff 39%,
    #0863ec 68%,
    #62bbff 88%,
    #dcf7ff 100%
  );
  box-shadow:
    inset 1px 2px 4px #fff9,
    inset -2px -3px 5px #c5efff99,
    0 3px 8px #388bd836;
}
.ae-ai-orb::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid #ffffff6b;
  border-radius: 50%;
  z-index: -1;
}
.ae-ai-orb svg {
  width: 68%;
  height: 68%;
  filter: drop-shadow(0 2px 3px #00459c21);
}
.ae-ai-orb--large {
  width: 144px;
  height: 144px;
  border-width: 2px;
  box-shadow:
    0 0 0 4px #ffffffb8,
    0 0 0 6px #b6deff73,
    inset 2px 5px 10px #fff9,
    inset -5px -6px 12px #c5efff99,
    0 16px 24px -12px #378ee47a;
}
.ae-ai-orb--large::after {
  content: '';
  position: absolute;
  top: 8%;
  left: 17%;
  width: 54%;
  height: 26%;
  transform: rotate(-30deg);
  border-radius: 50%;
  background: linear-gradient(#ffffff91, #ffffff00);
  filter: blur(2px);
  z-index: -1;
}
</style>
