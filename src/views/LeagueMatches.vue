<template>
  <div class="leagues-page">
    <div class="leagues-container">
      <!-- Хлебные крошки -->
      <div class="breadcrumbs-wrapper">
        <span class="breadcrumb-link" @click="goToLeagues">Лиги</span>
        <span class="breadcrumb-separator">></span>
        <span class="breadcrumb-current">{{ leagueName }}</span>
      </div>

    <!-- Блок фильтрации по дате с кастомной иконкой календаря -->
<div class="filter-section">
  <div class="filter-label">Матчи с</div>
  <div class="date-input-wrapper">
    <input 
      type="date" 
      v-model="dateFrom" 
      class="date-input"
      :max="dateTo || undefined"
    />
    <img src="/Calendarpicker.svg" alt="calendar" class="calendar-icon" />
  </div>
  
  <div class="filter-label">По</div>
  <div class="date-input-wrapper">
    <input 
      type="date" 
      v-model="dateTo" 
      class="date-input"
      :min="dateFrom || undefined"
    />
    <img src="/Calendarpicker.svg" alt="calendar" class="calendar-icon" />
  </div>
</div>

      <!-- Таблица матчей -->
      <div v-if="loading" class="matches-table">
        <div v-for="n in 5" :key="n" class="match-row-skeleton">
          <div class="skeleton-cell"></div>
        </div>
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="filteredMatches.length === 0" class="empty-state">
        <p>Нет матчей за выбранный период</p>
      </div>

      <div v-else class="matches-table">
        <div
          v-for="match in paginatedMatches"
          :key="match.id"
          class="match-row"
        >
          <div class="match-date">{{ formatDate(match.utcDate) }}</div>
          <div class="match-time">{{ formatTime(match.utcDate) }}</div>
          
          <div class="match-status">
            <span :class="getStatusClass(match.status)">
              {{ getStatusText(match.status) }}
            </span>
          </div>
          
          <div class="match-teams">
            {{ match.homeTeam.name }} - {{ match.awayTeam.name }}
          </div>
          
          <div class="match-score">
            {{ formatScore(match) }}
          </div>
        </div>
      </div>

      <!-- Пагинация -->
      <div v-if="!loading && !error && totalPages > 1" class="pagination-wrapper">
        <button 
          v-for="pageNum in visiblePages" 
          :key="pageNum"
          :class="['pagination-btn', { active: page === pageNum }]"
          @click="page = pageNum"
        >
          {{ pageNum }}
        </button>
        <button v-if="totalPages > 5 && visiblePages[visiblePages.length - 1] < totalPages" class="pagination-btn" @click="page = totalPages">
          {{ totalPages }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'LeagueMatches',
  data() {
    return {
      matches: [],
      leagueName: '',
      leagueId: null,
      dateFrom: '',
      dateTo: '',
      page: 1,
      itemsPerPage: 10,
      loading: false,
      error: null
    }
  },
  computed: {
    filteredMatches() {
      let filtered = [...this.matches]
      
      if (this.dateFrom) {
        const fromDate = new Date(this.dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        filtered = filtered.filter(match => {
          const matchDate = new Date(match.utcDate)
          return matchDate >= fromDate
        })
      }
      
      if (this.dateTo) {
        const toDate = new Date(this.dateTo)
        toDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter(match => {
          const matchDate = new Date(match.utcDate)
          return matchDate <= toDate
        })
      }
      
      return filtered
    },
    paginatedMatches() {
      const start = (this.page - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredMatches.slice(start, end)
    },
    totalPages() {
      return Math.ceil(this.filteredMatches.length / this.itemsPerPage)
    },
    visiblePages() {
      let start = Math.max(1, this.page - 2)
      let end = Math.min(this.totalPages, start + 4)
      if (end - start < 4) {
        start = Math.max(1, end - 4)
      }
      const pages = []
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    }
  },
  watch: {
    dateFrom() {
      this.page = 1
      this.loadMatches()
    },
    dateTo() {
      this.page = 1
      this.loadMatches()
    }
  },
  async mounted() {
    this.leagueId = this.$route.params.id
    await this.loadMatches()
  },
  methods: {
    async loadMatches() {
      this.loading = true
      this.error = null
      
      try {
        let url = `/api/v4/competitions/${this.leagueId}/matches`
        const params = {}
        
        if (this.dateFrom && this.dateTo) {
          params.dateFrom = this.dateFrom
          params.dateTo = this.dateTo
        }
        
        const response = await axios.get(url, {
          headers: {
            'X-Auth-Token': import.meta.env.VITE_API_TOKEN
          },
          params
        })
        
        this.matches = response.data.matches || []
        this.leagueName = response.data.competition?.name || 'Лига'
        
      } catch (err) {
        const status = err.response?.status
        if (status === 429) {
          this.error = 'Превышен лимит запросов к API. Попробуйте позже.'
        } else if (status === 403) {
          this.error = 'Неверный API-токен. Проверьте переменную VITE_API_TOKEN.'
        } else {
          this.error = 'Не удалось загрузить матчи. Проверьте соединение с интернетом.'
        }
      } finally {
        this.loading = false
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    formatTime(dateString) {
      const date = new Date(dateString)
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      })
    },
    getStatusText(status) {
      const statuses = {
        SCHEDULED: 'Запланирован',
        LIVE: 'В прямом эфире',
        IN_PLAY: 'В игре',
        PAUSED: 'Пауза',
        FINISHED: 'Завершен',
        POSTPONED: 'Отложен',
        SUSPENDED: 'Приостановлен',
        CANCELLED: 'Отменен'
      }
      return statuses[status] || status
    },
    getStatusClass(status) {
      const classes = {
        SCHEDULED: 'status-scheduled',
        LIVE: 'status-live',
        IN_PLAY: 'status-live',
        PAUSED: 'status-paused',
        FINISHED: 'status-finished',
        POSTPONED: 'status-postponed',
        SUSPENDED: 'status-suspended',
        CANCELLED: 'status-cancelled'
      }
      return classes[status] || ''
    },
    formatScore(match) {
      const parts = []
      
      const homeFull = match.score?.fullTime?.home
      const awayFull = match.score?.fullTime?.away
      if (homeFull !== null && homeFull !== undefined && awayFull !== null && awayFull !== undefined) {
        parts.push(`${homeFull}:${awayFull}`)
      }
      
      const homeExtra = match.score?.extraTime?.home
      const awayExtra = match.score?.extraTime?.away
      if (homeExtra !== null && homeExtra !== undefined && awayExtra !== null && awayExtra !== undefined) {
        parts.push(`(${homeExtra}:${awayExtra})`)
      }
      
      const homePenalties = match.score?.penalties?.home
      const awayPenalties = match.score?.penalties?.away
      if (homePenalties !== null && homePenalties !== undefined && awayPenalties !== null && awayPenalties !== undefined) {
        parts.push(`(${homePenalties}:${awayPenalties})`)
      }
      
      return parts.length > 0 ? parts.join(' ') : '- : -'
    },
    goToLeagues() {
      this.$router.push({ name: 'Leagues' })
    }
  }
}
</script>