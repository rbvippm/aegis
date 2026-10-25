<script setup lang="ts">
import { computed } from 'vue'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeftRight,
  PauseCircle,
  ChevronRight,
} from '@lucide/vue'
import PlatformBadge from '@/shared/ui/PlatformBadge.vue'
import { sportsMatches } from '@/mocks/sports'
import type { OddsFormat } from '@/features/sports/types'
import { movementTone, movementLabel, movementValue, type HomeMovement } from './events'
const props = defineProps<{ movement: HomeMovement; format: OddsFormat }>()
defineEmits<{ open: [movement: HomeMovement] }>()
const match = computed(() => sportsMatches.find((item) => item.id === props.movement.matchId))
const market = computed(() =>
  match.value?.markets.find((item) => item.id === props.movement.marketId),
)
const icon = computed(
  () =>
    ({
      up: TrendingUp,
      down: TrendingDown,
      flat: Minus,
      line: ArrowLeftRight,
      suspended: PauseCircle,
    })[movementTone(props.movement)],
)
</script>
<template>
  <button
    class="he-movement"
    :class="`he-movement--${movementTone(movement)}`"
    :aria-label="`${movementLabel(movement)}：平台 ${movement.platform} ${movementValue(movement, format)}`"
    @click="$emit('open', movement)"
  >
    <span class="he-movement__icon"><component :is="icon" :size="19" /></span
    ><span class="he-movement__main"
      ><span class="he-movement__top"
        ><PlatformBadge :platform="movement.platform" /><span class="he-movement__label">{{
          movementLabel(movement)
        }}</span
        ><time>{{ movement.time }}</time></span
      ><strong class="he-movement__value">{{ movementValue(movement, format) }}</strong
      ><small
        >{{ match?.home }} vs {{ match?.away }} · {{ market?.label
        }}<span v-if="movement.type === 'price'">
          · {{ market?.selections[movement.side === 'home' ? 0 : 1] }}</span
        ></small
      ></span
    ><ChevronRight :size="14" />
  </button>
</template>
<style>
.he-movement {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #e4edf8;
  padding: 13px 0;
  background: none;
  text-align: left;
  color: #14213d;
  cursor: pointer;
}
.he-movement__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 11px;
  background: #edf4ff;
  color: #3978c9;
}
.he-movement__main {
  flex: 1;
  min-width: 0;
}
.he-movement__top {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  line-height: 1.5;
}
.he-movement time {
  margin-left: auto;
  font-size: 12px;
  color: var(--ae-muted);
}
.he-movement__label {
  color: #526581;
  font-size: 12px;
}
.he-movement__value {
  display: block;
  margin: 5px 0 3px;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 650;
}
.he-movement small {
  display: block;
  color: var(--ae-muted);
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.he-movement--up .he-movement__value,
.he-movement--up .he-movement__icon {
  color: #087f6b;
}
.he-movement--down .he-movement__value,
.he-movement--down .he-movement__icon {
  color: #bd3348;
}
.he-movement--up .he-movement__icon {
  background: #e6f7f0;
}
.he-movement--down .he-movement__icon {
  background: #fff0f3;
}
.he-movement--suspended .he-movement__icon {
  color: #94702e;
  background: #fff5df;
}
</style>
