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
    ><ChevronRight :size="16" />
  </button>
</template>
<style>
.he-movement {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #e7eef8;
  padding: 12px 2px;
  background: none;
  text-align: left;
  color: #14213d;
  cursor: pointer;
}
.he-movement:last-of-type {
  border-bottom: 0;
}
.he-movement__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #e7f1ff;
  color: #0864ff;
}
.he-movement__main {
  flex: 1;
  min-width: 0;
}
.he-movement__top {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  line-height: 1.4;
}
.he-movement time {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: #526581;
}
.he-movement__label {
  min-width: 0;
  overflow: hidden;
  color: #14213d;
  font-size: 13px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.he-movement__value {
  display: block;
  margin: 2px 0 1px;
  overflow: hidden;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: -0.2px;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.he-movement small {
  display: block;
  overflow: hidden;
  color: #526581;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.he-movement > svg {
  flex-shrink: 0;
  color: #8eacd0;
}
.he-movement--up .he-movement__value,
.he-movement--up .he-movement__label,
.he-movement--up .he-movement__icon {
  color: #087f6b;
}
.he-movement--down .he-movement__value,
.he-movement--down .he-movement__label,
.he-movement--down .he-movement__icon {
  color: #c4273d;
}
.he-movement--up .he-movement__icon {
  background: #e5f7f1;
}
.he-movement--down .he-movement__icon {
  background: #fff0f3;
}
.he-movement--suspended .he-movement__icon,
.he-movement--suspended .he-movement__label {
  color: #8a6424;
}
.he-movement--suspended .he-movement__icon {
  background: #fff6e4;
}
.he-movement--suspended .he-movement__value {
  font-size: 16px;
  font-weight: 650;
}
</style>
