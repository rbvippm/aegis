<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  TrendingDown,
  TrendingUp,
  Minus,
  PauseCircle,
  ArrowLeftRight,
} from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import PlatformBadge from '@/shared/ui/PlatformBadge.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import SportIcon from '@/features/sports/SportIcon.vue'
import SportsPlan from '@/features/sports/SportsPlan.vue'
import '@/features/sports/sports.css'
import { sportsMatches } from '@/mocks/sports'
import { homeMovements } from '@/mocks/home-movements'
import { dataMode } from '@/shared/api/config'
import { formatOdds } from '@/features/sports/logic'
import type { OddsFormat, SportsQuote } from '@/features/sports/types'
import { findOpportunities } from './overview'
import {
  recommendedQuotes,
  sportName,
  movementLabel,
  movementTone,
  movementValue,
  type HomeMovement,
} from './events'
import HomeMovementRow from './HomeMovementRow.vue'
defineProps<{ format: OddsFormat; formatName: string }>()
const emit = defineEmits<{ format: []; sources: [] }>()
const router = useRouter()
const demo = dataMode === 'demo'
const section = ref('popular')
const popular = sportsMatches
  .slice()
  .sort((a, b) => Number(b.id === 'harbor-mountain') - Number(a.id === 'harbor-mountain'))
const matchIndex = ref(0)
const match = computed(() => popular[matchIndex.value]!)
const marketId = ref('handicap')
const market = computed(
  () => match.value.markets.find((item) => item.id === marketId.value) ?? match.value.markets[0]!,
)
const recommended = computed(() => recommendedQuotes(market.value))
const opportunities = demo ? findOpportunities(sportsMatches) : []
const opportunityIndex = ref(0)
const opportunity = computed(() => opportunities[opportunityIndex.value])
const panel = ref('')
const selectedSide = ref<'home' | 'away'>('home')
const selectedPlatform = ref('')
const selectedMovement = ref<HomeMovement>(homeMovements[0]!)
const movementMatch = computed(() =>
  sportsMatches.find((item) => item.id === selectedMovement.value.matchId)!,
)
const movementMarket = computed(() =>
  movementMatch.value.markets.find((item) => item.id === selectedMovement.value.marketId)!,
)
const recent = homeMovements.slice(0, 20)
const preview = recent.slice(0, 3)
const amount = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function next(direction: number) {
  if (section.value === 'popular')
    matchIndex.value = (matchIndex.value + direction + popular.length) % popular.length
  else if (opportunities.length)
    opportunityIndex.value =
      (opportunityIndex.value + direction + opportunities.length) % opportunities.length
}
function showQuote(platform: string, side: 'home' | 'away') {
  selectedPlatform.value = platform
  selectedSide.value = side
  panel.value = 'quote'
}
function showMovement(movement: HomeMovement) {
  selectedMovement.value = movement
  panel.value = 'movement'
}
function quoteDirection(q: SportsQuote) {
  if (selectedSide.value !== 'home' || q.previousHome === undefined || q.home === null)
    return 'flat'
  return q.home > q.previousHome ? 'up' : q.home < q.previousHome ? 'down' : 'flat'
}
function openSources() {
  panel.value = ''
  emit('sources')
}
function ask() {
  void router.push({
    path: '/ai',
    query: {
      analyze: '1',
      q: `${match.value.home}对${match.value.away}怎么看？请确认赛事、${market.value.scope}、${market.value.line}及数据时间后分析。`,
    },
  })
}
const panelTitle = computed(() =>
  panel.value === 'history'
    ? '最近 20 条滚球记录'
    : panel.value === 'movement'
      ? movementLabel(selectedMovement.value)
      : panel.value === 'plan'
        ? '分配试算'
        : panel.value === 'market'
          ? '玩法与结算规则'
          : '同盘口报价详情',
)
</script>
<template>
  <section class="hr-card he-card" aria-label="赛事与机会">
    <div class="hr-tabs" aria-label="赛事内容">
      <button
        v-for="tab in [
          { id: 'popular', label: '热门赛事' },
          { id: 'opportunities', label: '套利机会' },
          { id: 'movements', label: '滚球动态' },
        ]"
        :key="tab.id"
        :class="{ active: section === tab.id }"
        :aria-pressed="section === tab.id"
        @click="section = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    <StatePanel v-if="!demo" title="暂无赛事数据" description="赛事和报价服务尚未接入。" />
    <template v-else-if="section === 'popular'">
      <div class="he-meta">
        <span class="he-league"
          ><SportIcon :sport="match.sport" :size="17" />{{ sportName(match.sport) }} ·
          {{ match.league }}</span
        >
        <div class="he-pager" aria-label="热门赛事切换">
          <button aria-label="上一场热门赛事" @click="next(-1)"><ChevronLeft :size="17" /></button
          ><span>{{ matchIndex + 1 }} / {{ popular.length }}</span
          ><button aria-label="下一场热门赛事" @click="next(1)"><ChevronRight :size="17" /></button>
        </div>
      </div>
      <div class="hr-teams he-teams">
        <span
          ><i>{{ match.home[0] }}</i
          >{{ match.home }}</span
        >
        <div class="he-score">
          <strong>{{ match.score }}</strong
          ><small :class="{ 'he-live': match.phase === 'live' }">{{ match.stage }}</small>
        </div>
        <span
          >{{ match.away }}<i>{{ match.away[0] }}</i></span
        >
      </div>
      <label class="he-play"
        ><span class="he-field-label">推荐玩法</span
        ><GlassSelect v-model="marketId" label="推荐玩法"
          ><option v-for="item in match.markets" :key="item.id" :value="item.id">
            {{ item.label }} · {{ item.scope }} · {{ item.line }}
          </option></GlassSelect
        ></label
      >
      <div class="he-quotes">
        <button
          v-for="item in recommended"
          :key="item.side"
          class="he-quote"
          :aria-label="`平台 ${item.quote.platform} · ${item.selection} · 报价详情`"
          @click="showQuote(item.quote.platform, item.side)"
        >
          <span class="he-quote__head"
            ><PlatformBadge :platform="item.quote.platform" /><small>{{
              item.ties > 1 ? '并列较优' : '当前较优'
            }}</small></span
          ><span class="he-selection">{{ item.selection }}</span
          ><strong>{{ formatOdds(item.decimal, format) }}</strong
          ><span class="he-quote__more">查看报价<ChevronRight :size="12" /></span>
        </button>
      </div>
      <div class="he-foot">
        <button @click="panel = 'market'">同场 · 同盘 · 同选项<Info :size="12" /></button
        ><button class="hr-link" @click="ask">让 AI 解读 →</button>
      </div>
      <button class="he-ticker" @click="showMovement(recent[0]!)">
        <TrendingDown :size="17" /><span
          ><small>滚球播报</small><PlatformBadge :platform="recent[0]!.platform" /><b>{{
            movementValue(recent[0]!, format)
          }}</b></span
        ><ChevronRight :size="14" />
      </button>
    </template>
    <template v-else-if="section === 'opportunities'">
      <template v-if="opportunity">
        <div class="he-meta">
          <span class="he-league"
            ><SportIcon :sport="opportunity.match.sport" :size="17" />{{
              sportName(opportunity.match.sport)
            }}
            · {{ opportunity.match.league }}</span
          >
          <div class="he-pager" aria-label="套利机会切换">
            <button aria-label="上一个套利机会" @click="next(-1)"><ChevronLeft :size="17" /></button
            ><span>{{ opportunityIndex + 1 }} / {{ opportunities.length }}</span
            ><button aria-label="下一个套利机会" @click="next(1)">
              <ChevronRight :size="17" />
            </button>
          </div>
        </div>
        <h3 class="he-opportunity-title">
          {{ opportunity.match.home }} <span>vs</span> {{ opportunity.match.away }}
        </h3>
        <div class="he-market-summary">
          <strong>{{ opportunity.market.label }} · {{ opportunity.market.line }}</strong
          ><small>{{ opportunity.market.scope }} · 两项完整结果</small>
        </div>
        <div class="he-profit">
          <span>1,000 USDT 预算 · 理论毛收益</span
          ><strong>+{{ amount(opportunity.result.gross) }}<small> USDT</small></strong
          ><span class="he-roi">理论收益率 {{ opportunity.result.roi.toFixed(2) }}%</span>
        </div>
        <div class="he-opportunity-legs">
          <span v-for="leg in recommendedQuotes(opportunity.market)" :key="leg.side"
            ><PlatformBadge :platform="leg.quote.platform" /><span>{{ leg.selection }}</span
            ><b>{{ formatOdds(leg.decimal, format) }}</b></span
          >
        </div>
        <button class="he-plan-action" @click="panel = 'plan'">
          查看分配试算<ChevronRight :size="16" />
        </button>
        <p class="he-qualification">发现理论价差；费用、限额与报价有效期待核验，净收益待核算。</p>
      </template>
      <StatePanel
        v-else
        title="暂无匹配机会"
        description="暂未发现符合完整结果与有效报价要求的机会。"
      />
    </template>
    <template v-else
      ><div class="he-meta">
        <span class="he-league">近期盘口与赔率变化</span
        ><button class="he-view-all" @click="panel = 'history'">
          查看全部<ChevronRight :size="14" />
        </button>
      </div>
      <HomeMovementRow
        v-for="movement in preview"
        :key="movement.id"
        :movement="movement"
        :format="format"
        @open="showMovement"
    /></template>
    <button class="hr-format" :aria-label="formatName" @click="emit('format')">
      <span>赔率显示格式</span><span>{{ formatName }}<ChevronDown :size="13" /></span>
    </button>
    <BottomDrawer :open="!!panel" :title="panelTitle" @close="panel = ''">
      <div class="he-sheet sports-page">
        <template v-if="panel === 'plan' && opportunity"
          ><p class="he-sheet-context">
            <SportIcon :sport="opportunity.match.sport" :size="16" />{{
              sportName(opportunity.match.sport)
            }}
            · {{ opportunity.match.league }} · {{ opportunity.market.label }}
          </p>
          <SportsPlan
            :key="`${opportunity.match.id}-${opportunity.market.id}`"
            :match="opportunity.match"
            :market="opportunity.market"
            :format="format"
        /></template>
        <template v-else-if="panel === 'history'"
          ><p class="he-sheet-note">最近 {{ recent.length }} 条 · {{ formatName }}</p>
          <HomeMovementRow
            v-for="movement in recent"
            :key="movement.id"
            :movement="movement"
            :format="format"
            @open="showMovement"
          />
          <p class="he-sheet-note">10/24 固定快照 · 报价显示制式与首页一致</p></template
        >
        <template v-else-if="panel === 'movement'"
          ><button class="he-back" @click="panel = 'history'">
            <ChevronLeft :size="15" />全部记录
          </button>
          <p class="he-sheet-context">
            <SportIcon :sport="movementMatch.sport" :size="16" />{{
              sportName(movementMatch.sport)
            }}
            · {{ movementMatch.league }}
          </p>
          <h3>{{ movementMatch.home }} vs {{ movementMatch.away }}</h3>
          <div
            class="he-detail-value"
            :class="`he-detail-value--${movementTone(selectedMovement)}`"
          >
            <component
              :is="
                selectedMovement.type === 'suspended'
                  ? PauseCircle
                  : selectedMovement.type === 'line'
                    ? ArrowLeftRight
                    : movementTone(selectedMovement) === 'up'
                      ? TrendingUp
                      : TrendingDown
              "
              :size="24"
            /><strong>{{ movementValue(selectedMovement, format) }}</strong>
          </div>
          <dl class="he-definitions">
            <div>
              <dt>平台</dt>
              <dd><PlatformBadge :platform="selectedMovement.platform" /></dd>
            </div>
            <div>
              <dt>玩法</dt>
              <dd>{{ movementMarket.label }} · {{ movementMarket.line }}</dd>
            </div>
            <div>
              <dt>时段与规则</dt>
              <dd>{{ movementMarket.scope }}</dd>
            </div>
            <div>
              <dt>记录时间</dt>
              <dd>10/24 {{ selectedMovement.time }} · UTC+8</dd>
            </div>
            <div v-if="selectedMovement.type === 'price'">
              <dt>选项 / 格式</dt>
              <dd>
                {{ movementMarket.selections[selectedMovement.side === 'home' ? 0 : 1] }} ·
                {{ formatName }}
              </dd>
            </div>
          </dl>
          <p class="he-sheet-note">
            {{
              selectedMovement.type === 'suspended'
                ? '该平台当前暂停报价，不参与较优报价与试算；恢复前不生成有效赔率。'
                : selectedMovement.type === 'line'
                  ? '盘口线已变化；新旧盘口需分别比较，不能把不同盘口混在一起排序。'
                  : '颜色和箭头按底层十进制赔率判断涨跌；显示制式变化不改变涨跌方向。'
            }}
          </p></template
        >
        <template v-else-if="panel === 'quote' || panel === 'market'"
          ><p class="he-sheet-context">
            <SportIcon :sport="match.sport" :size="16" />{{ sportName(match.sport) }} ·
            {{ match.league }}
          </p>
          <h3>{{ match.home }} vs {{ match.away }}</h3>
          <div class="he-market-summary">
            <strong>{{ market.label }} · {{ market.line }}</strong
            ><small>{{ market.scope }}</small>
          </div>
          <template v-if="panel === 'quote'"
            ><p class="he-sheet-note">
              {{ market.selections[selectedSide === 'home' ? 0 : 1] }} · {{ formatName }} · 所选平台
              {{ selectedPlatform }}
            </p>
            <div
              v-for="quote in market.quotes"
              :key="quote.platform"
              class="he-quote-row"
              :class="[
                `he-quote-row--${quoteDirection(quote)}`,
                { 'is-selected': quote.platform === selectedPlatform },
              ]"
            >
              <PlatformBadge :platform="quote.platform" /><span
                v-if="quote.status === 'active' && quote[selectedSide] !== null"
                ><small v-if="selectedSide === 'home' && quote.previousHome !== undefined"
                  >{{ formatOdds(quote.previousHome, format) }} → </small
                ><b>{{ formatOdds(quote[selectedSide], format) }}</b
                ><component
                  :is="
                    quoteDirection(quote) === 'up'
                      ? TrendingUp
                      : quoteDirection(quote) === 'down'
                        ? TrendingDown
                        : Minus
                  "
                  :size="16" /></span
              ><span v-else
                ><PauseCircle v-if="quote.status === 'suspended'" :size="16" />{{
                  quote.status === 'suspended' ? '暂停报价' : '报价过期'
                }}</span
              >
            </div>
            <p class="he-sheet-note">
              仅同场、同玩法、同盘口、同选项的有效报价参与推荐；没有前值时不标注涨跌。
            </p></template
          >
          <template v-else
            ><dl class="he-definitions">
              <div>
                <dt>两侧选项</dt>
                <dd>{{ market.selections.join(' / ') }}</dd>
              </div>
              <div>
                <dt>结算范围</dt>
                <dd>{{ market.scope }}</dd>
              </div>
              <div>
                <dt>分配试算</dt>
                <dd>
                  {{
                    market.calculationEligible
                      ? '支持两项完整结果试算'
                      : '此结算类型暂不支持简单两项试算'
                  }}
                </dd>
              </div>
            </dl>
            <p class="he-sheet-note">
              {{
                market.kind === 'total'
                  ? '总分/进球数高于盘口为大、低于盘口为小；以该时段结算规则为准。'
                  : market.kind === 'winner'
                    ? '按两项胜负结果结算。需确认是否包含加时，不能与另列平局的市场混排。'
                    : '让球/让分按盘口调整赛果后结算；整球、半球和四分之一盘口的走盘及部分输赢规则不同。'
              }}
            </p>
            <button class="he-back" @click="openSources">查看数据来源<Info :size="14" /></button
          ></template>
        </template>
      </div>
    </BottomDrawer>
  </section>
</template>
<style>
.he-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin: 8px 0;
  color: #526581;
}
.he-league {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
}
.he-league svg {
  flex-shrink: 0;
  color: #317bdd;
}
.he-pager {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.he-pager button {
  display: grid;
  place-items: center;
  width: 44px;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: #5379ac;
  cursor: pointer;
  border-radius: 10px;
}
.he-pager span {
  font-size: 12px;
  color: var(--ae-muted);
  white-space: nowrap;
}
.home-rich .he-teams {
  margin: 4px 0 29px;
}
.he-score {
  position: relative;
}
.he-score strong {
  font-size: 25px;
  color: #14213d;
  white-space: nowrap;
  font-weight: 700;
}
.he-score small {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  line-height: 1.6;
  white-space: nowrap;
  color: var(--ae-muted);
}
.he-score .he-live {
  color: #bd3348;
}
.he-play {
  display: block;
}
.he-field-label {
  display: block;
  font-size: 12px;
  color: var(--ae-muted);
  margin-bottom: 4px;
}
.he-play .glass-select {
  width: 100%;
}
.he-play .glass-select__trigger {
  font-size: 12px;
  min-height: 44px;
  background: #f0f6fe;
  border: 0;
  border-radius: 12px;
}
.he-quotes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 9px;
}
.he-quote {
  position: relative;
  min-width: 0;
  border: 1px solid #b9d9ff;
  border-radius: 14px;
  padding: 9px 10px;
  background: linear-gradient(125deg, #f6fbff, #eaf4ff);
  text-align: left;
  color: #14213d;
  cursor: pointer;
}
.he-quote__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3px;
}
.he-quote__head > small {
  color: #2873cd;
  font-size: 12px;
  white-space: nowrap;
}
.he-selection {
  display: block;
  margin: 7px 0 1px;
  font-size: 12px;
  color: #526581;
}
.he-quote > strong {
  font-size: 25px;
  line-height: 1.3;
  font-weight: 700;
  color: #0d61cf;
}
.he-quote__more {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 12px;
  color: var(--ae-muted);
}
.he-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  margin-top: 3px;
}
.he-foot button {
  display: flex;
  align-items: center;
  gap: 3px;
  min-height: 44px;
  border: 0;
  background: none;
  padding: 0;
  font-size: 12px;
  color: var(--ae-muted);
  cursor: pointer;
}
.he-foot .hr-link {
  color: #0864ff;
}
.he-ticker {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  min-height: 44px;
  border: 0;
  border-radius: 12px;
  padding: 8px;
  background: #fff5ea;
  color: #b13a47;
  text-align: left;
  cursor: pointer;
}
.he-ticker > span {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  flex-wrap: wrap;
}
.he-ticker small {
  font-size: 12px;
  color: #8d7452;
}
.he-ticker b {
  font-size: 12px;
  font-weight: 600;
}
.he-view-all {
  display: flex;
  align-items: center;
  gap: 3px;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: #0864ff;
  font-size: 12px;
  cursor: pointer;
}
.he-opportunity-title {
  font-size: 19px;
  font-weight: 650;
  color: #14213d;
  margin: 0 0 10px;
}
.he-opportunity-title > span {
  color: var(--ae-muted);
  font-size: 13px;
  font-weight: 400;
  margin-inline: 3px;
}
.he-market-summary {
  padding: 10px 12px;
  border-radius: 12px;
  background: #eff6ff;
  margin: 10px 0;
}
.he-market-summary strong,
.he-market-summary small {
  display: block;
  line-height: 1.5;
}
.he-market-summary strong {
  font-size: 14px;
  font-weight: 600;
}
.he-market-summary small {
  font-size: 12px;
  color: var(--ae-muted);
  margin-top: 3px;
}
.he-profit {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin: 15px 0 12px;
}
.he-profit > span:first-child {
  font-size: 12px;
  color: var(--ae-muted);
}
.he-profit > strong {
  font-size: 34px;
  line-height: 1.4;
  letter-spacing: -0.8px;
  color: #087f6b;
  font-weight: 700;
}
.he-profit > strong > small {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
}
.he-roi {
  font-size: 12px;
  color: #087f6b;
}
.he-opportunity-legs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.he-opportunity-legs > span {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  border: 1px solid #e3edf9;
  border-radius: 12px;
  padding: 9px;
  font-size: 12px;
  color: #526581;
}
.he-opportunity-legs b {
  font-size: 16px;
  color: #17355d;
}
.he-plan-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  width: 100%;
  margin: 12px 0 8px;
  border: 1px solid #6eacff;
  border-radius: 22px;
  background: linear-gradient(#3898ff, #0866ed);
  box-shadow: inset 0 1px 2px #ffffff85;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.he-qualification {
  font-size: 12px;
  line-height: 1.7;
  color: var(--ae-muted);
  margin-top: 9px;
}
.he-sheet {
  padding: 15px 16px 8px;
  color: #14213d;
}
.he-sheet h3 {
  font-size: 18px;
  line-height: 1.5;
  margin: 8px 0;
}
.he-sheet-context {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ae-muted);
  margin-bottom: 9px;
}
.he-sheet-note {
  font-size: 12px;
  line-height: 1.8;
  color: var(--ae-muted);
  margin: 10px 0;
}
.he-sheet .sp-plan > .sp-card {
  margin-inline: 0;
}
.he-detail-value {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 24px 4px;
  margin-top: 12px;
  background: #f0f6ff;
  border-radius: 14px;
  color: #3674ca;
}
.he-detail-value strong {
  font-size: 23px;
  font-weight: 700;
}
.he-detail-value--up {
  color: #087f6b;
  background: #e8f8f2;
}
.he-detail-value--down {
  color: #bd3348;
  background: #fff0f3;
}
.he-detail-value--suspended {
  color: #987132;
  background: #fff6e6;
}
.he-definitions {
  margin: 15px 0;
}
.he-definitions > div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #e5edf8;
  padding: 12px 0;
  font-size: 13px;
  line-height: 1.7;
}
.he-definitions dt {
  color: var(--ae-muted);
  flex-shrink: 0;
}
.he-definitions dd {
  text-align: right;
  margin: 0;
}
.he-quote-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 58px;
  padding: 8px;
  border-bottom: 1px solid #e7eef8;
}
.he-quote-row.is-selected {
  background: #f0f7ff;
  border-radius: 10px;
}
.he-quote-row > span:last-child {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ae-muted);
  font-size: 12px;
}
.he-quote-row b {
  font-size: 18px;
  color: #14213d;
}
.he-quote-row--up b,
.he-quote-row--up > span:last-child {
  color: #087f6b;
}
.he-quote-row--down b,
.he-quote-row--down > span:last-child {
  color: #bd3348;
}
.he-back {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  border: 0;
  padding: 0;
  background: none;
  font-size: 12px;
  color: #0864ff;
  cursor: pointer;
}
@media (max-width: 374px) {
  .he-pager button {
    width: 30px;
  }
  .he-quote {
    padding: 8px;
  }
  .he-quote__head {
    flex-wrap: wrap;
  }
  .he-quote__head > small {
    font-size: 12px;
  }
  .he-league {
    font-size: 12px;
  }
  .he-opportunity-title {
    font-size: 18px;
  }
}
</style>
