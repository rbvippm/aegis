<script setup lang="ts">
import { computed, ref } from 'vue'
import { matchCenterData } from '@/mocks/sports-planning'
import type { Fixture } from './model'
import SportIcon from '../SportIcon.vue'
const props = defineProps<{ fixture: Fixture }>()
const data = computed(() => matchCenterData(props.fixture))
const tab = ref('stats'),
  team = ref(0)
</script>
<template>
  <div class="pw-center">
    <div class="pw-center-hero">
      <p class="pw-center-league">
        <SportIcon :sport="fixture.sport" :size="14" />{{ fixture.league }}
      </p>
      <div class="pw-center-scoreboard">
        <div class="pw-center-team">
          <i>{{ fixture.home.slice(0, 1) }}</i
          ><strong>{{ fixture.home }}</strong
          ><small>主队</small>
        </div>
        <div class="pw-center-score">
          <b>{{ fixture.score }}</b
          ><small :class="{ 'is-live': fixture.phase === 'live' }">{{ fixture.stage }}</small>
        </div>
        <div class="pw-center-team pw-center-team--away">
          <i>{{ fixture.away.slice(0, 1) }}</i
          ><strong>{{ fixture.away }}</strong
          ><small>客队</small>
        </div>
      </div>
    </div>
    <div class="pw-tabs">
      <button
        v-for="(label, id) in {
          stats: '球队统计',
          form: '近期战绩',
          injuries: `伤停 ${data.injuries.reduce((sum, row) => sum + row.players.length, 0)}`,
          standings: '积分榜',
        }"
        :key="id"
        :aria-pressed="tab === id"
        :class="{ selected: tab === id }"
        @click="tab = id"
      >
        {{ label }}
      </button>
    </div>
    <div class="pw-center-body">
      <template v-if="tab === 'stats'"
        ><div class="pw-stats-head">
          <strong>{{ fixture.home }}</strong
          ><span>近10场</span><strong>{{ fixture.away }}</strong>
        </div>
        <div v-for="row in data.stats" :key="row[0]" class="pw-stat-row">
          <b>{{ row[1] }}</b
          ><span>{{ row[0] }}</span
          ><b>{{ row[2] }}</b>
        </div></template
      >
      <template v-else-if="tab === 'form'"
        ><div class="pw-tabs pw-center-team-tabs">
          <button
            v-for="(row, i) in data.form"
            :key="row.team"
            :class="{ selected: team === i }"
            :aria-pressed="team === i"
            @click="team = i"
          >
            {{ row.team }}
          </button>
        </div>
        <div class="pw-form-summary">
          <strong>近期状态</strong
          ><small
            >最近{{ data.form[team]!.results.length }}场 ·
            {{ data.form[team]!.results.filter((r) => r.result === '胜').length }}胜
            {{ data.form[team]!.results.filter((r) => r.result === '负').length }}负</small
          >
        </div>
        <div class="pw-form-marks" aria-label="近期赛果，从近到远">
          <span
            v-for="(r, i) in data.form[team]!.results"
            :key="i"
            :class="r.result === '胜' ? 'win' : 'loss'"
            >{{ r.result }}</span
          >
        </div>
        <div v-for="r in data.form[team]!.results" :key="r.date" class="pw-result-row">
          <span class="pw-result-match"
            ><small>{{ r.date }} · {{ r.venue }}</small
            ><span>{{ r.opponent }}</span></span
          ><b>{{ r.score }}</b
          ><i :class="r.result === '胜' ? 'win' : 'loss'">{{ r.result }}</i>
        </div></template
      >
      <template v-else-if="tab === 'injuries'"
        ><div v-for="row in data.injuries" :key="row.team" class="pw-injury-group">
          <h4>
            {{ row.team }} <small>{{ row.players.length }} 人</small>
          </h4>
          <article v-for="p in row.players" :key="p.name">
            <div>
              <strong>{{ p.name }}</strong
              ><b>{{ p.status }}</b>
            </div>
            <p>{{ p.position }} · {{ p.reason }}</p>
            <small>预计回归 {{ p.returnDate }}</small>
          </article>
        </div></template
      >
      <template v-else
        ><p class="pw-muted">2026–27 赛季 · {{ fixture.league }}</p>
        <table class="pw-standings">
          <thead>
            <tr>
              <th>排名 / 球队</th>
              <th>胜</th>
              <th>{{ fixture.sport === 'football' ? '平' : '负' }}</th>
              <th>{{ fixture.sport === 'football' ? '积分' : '胜率' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in data.standings"
              :key="row.name"
              :class="{ highlight: row.name === fixture.home || row.name === fixture.away }"
            >
              <th>
                <span class="pw-standing-rank">{{ i + 1 }}</span
                >{{ row.name }}
              </th>
              <td>{{ row.win }}</td>
              <td>{{ fixture.sport === 'football' ? row.draw : row.loss }}</td>
              <td>
                {{
                  fixture.sport === 'football'
                    ? row.points
                    : `${((row.win / row.played) * 100).toFixed(1)}%`
                }}
              </td>
            </tr>
          </tbody>
        </table></template
      >
    </div>
  </div>
</template>
