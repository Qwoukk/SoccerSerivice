<template>
  <div class="leagues-page">
    <div class="breadcrumbs-wrapper">
      <span class="breadcrumb-link" @click="goToTeams">Команды</span>
      <span class="breadcrumb-separator">></span>
      <span class="breadcrumb-current">{{ teamName }}</span>
    </div>
    <div class="leagues-container">
      <!-- Блок фильтрации по дате -->
      <div class="filter-section">
        <div class="filter-label">Матчи с</div>
        <div class="date-input-wrapper">
          <input type="date" v-model="dateFrom" class="date-input" :max="dateTo || undefined" />
          <img src="/Calendarpicker.svg" alt="calendar" class="calendar-icon" />
        </div>

        <div class="filter-label">По</div>
        <div class="date-input-wrapper">
          <input type="date" v-model="dateTo" class="date-input" :min="dateFrom || undefined" />
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
        <div v-for="match in paginatedMatches" :key="match.id" class="match-row">
          <div class="match-date">{{ formatDate(match.utcDate) }}</div>
          <div class="match-time">{{ formatTime(match.utcDate) }}</div>

          <div class="match-status">
            <span :class="getStatusClass(match.status)">
              {{ getStatusText(match.status) }}
            </span>
          </div>

          <div class="match-teams">{{ match.homeTeam.name }} - {{ match.awayTeam.name }}</div>

          <div class="match-score">
            {{ formatScore(match) }}
          </div>
        </div>
      </div>

      <!-- Пагинация -->

      <div v-if="!loading && !error && totalPages > 1" class="pagination-wrapper">
        <!-- Стрелка назад -->
        <button
          class="pagination-btn pagination-arrow"
          :disabled="page === 1"
          @click="page--"
          aria-label="Предыдущая страница"
        >
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path
              d="M5.25 1.75L1.5 5L5.25 8.25"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <!-- Номера страниц с троеточием -->
        <template v-for="item in paginationItems" :key="item">
          <span v-if="item === '...'" class="pagination-dots">...</span>
          <button
            v-else
            :class="['pagination-btn', { active: page === item }]"
            @click="page = item"
          >
            {{ item }}
          </button>
        </template>

        <!-- Стрелка вперёд -->
        <button
          class="pagination-btn pagination-arrow"
          :disabled="page === totalPages"
          @click="page++"
          aria-label="Следующая страница"
        >
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path
              d="M0.75 1.75L4.5 5L0.75 8.25"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'TeamMatches',
  data() {
    return {
      matches: [],
      teamName: '',
      teamId: null,
      dateFrom: '',
      dateTo: '',
      page: 1,
      itemsPerPage: 10,
      loading: false,
      error: null,
    };
  },
  computed: {
    filteredMatches() {
      let filtered = [...this.matches];

      if (this.dateFrom) {
        const fromDate = new Date(this.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter((match) => {
          const matchDate = new Date(match.utcDate);
          return matchDate >= fromDate;
        });
      }

      if (this.dateTo) {
        const toDate = new Date(this.dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter((match) => {
          const matchDate = new Date(match.utcDate);
          return matchDate <= toDate;
        });
      }

      return filtered;
    },
    paginatedMatches() {
      const start = (this.page - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredMatches.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredMatches.length / this.itemsPerPage);
    },
    paginationItems() {
      const total = this.totalPages;
      const current = this.page;
      const items = [];

      if (total <= 7) {
        // Все страницы без троеточия
        for (let i = 1; i <= total; i++) items.push(i);
        return items;
      }

      // Всегда показываем первую
      items.push(1);

      if (current > 4) {
        items.push('...');
      }

      // Окно вокруг текущей страницы
      const start = Math.max(2, current - 2);
      const end = Math.min(total - 1, current + 2);
      for (let i = start; i <= end; i++) items.push(i);

      if (current < total - 3) {
        items.push('...');
      }

      // Всегда показываем последнюю
      items.push(total);

      return items;
    },
  },
  watch: {
    dateFrom() {
      this.page = 1;
      this.loadMatches();
    },
    dateTo() {
      this.page = 1;
      this.loadMatches();
    },
  },
  async mounted() {
    this.teamId = this.$route.params.id;
    await this.loadMatches();
  },
  methods: {
    async loadMatches() {
      this.loading = true;
      this.error = null;

      try {
        let url = `/api/v4/teams/${this.teamId}/matches`;
        const params = {};

        if (this.dateFrom && this.dateTo) {
          params.dateFrom = this.dateFrom;
          params.dateTo = this.dateTo;
        }

        const response = await axios.get(url, {
          headers: {
            'X-Auth-Token': import.meta.env.VITE_API_TOKEN,
          },
          params,
        });

        this.matches = response.data.matches || [];

        // Получаем название команды отдельным запросом, если не пришло в ответе
        if (response.data.team?.name) {
          this.teamName = response.data.team.name;
        } else {
          const teamResponse = await axios.get(`/api/v4/teams/${this.teamId}`, {
            headers: {
              'X-Auth-Token': import.meta.env.VITE_API_TOKEN,
            },
          });
          this.teamName = teamResponse.data.name;
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 429) {
          this.error = 'Превышен лимит запросов к API. Попробуйте позже.';
        } else if (status === 403) {
          this.error = 'Неверный API-токен. Проверьте переменную VITE_API_TOKEN.';
        } else {
          this.error = 'Не удалось загрузить матчи. Проверьте соединение с интернетом.';
        }
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    },
    formatTime(dateString) {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
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
        CANCELLED: 'Отменен',
      };
      return statuses[status] || status;
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
        CANCELLED: 'status-cancelled',
      };
      return classes[status] || '';
    },
    formatScore(match) {
      const parts = [];

      const homeFull = match.score?.fullTime?.home;
      const awayFull = match.score?.fullTime?.away;
      if (
        homeFull !== null &&
        homeFull !== undefined &&
        awayFull !== null &&
        awayFull !== undefined
      ) {
        parts.push(`${homeFull}:${awayFull}`);
      }

      const homeExtra = match.score?.extraTime?.home;
      const awayExtra = match.score?.extraTime?.away;
      if (
        homeExtra !== null &&
        homeExtra !== undefined &&
        awayExtra !== null &&
        awayExtra !== undefined
      ) {
        parts.push(`(${homeExtra}:${awayExtra})`);
      }

      const homePenalties = match.score?.penalties?.home;
      const awayPenalties = match.score?.penalties?.away;
      if (
        homePenalties !== null &&
        homePenalties !== undefined &&
        awayPenalties !== null &&
        awayPenalties !== undefined
      ) {
        parts.push(`(${homePenalties}:${awayPenalties})`);
      }

      return parts.length > 0 ? parts.join(' ') : '- : -';
    },
    goToTeams() {
      this.$router.push({ name: 'Teams' });
    },
  },
};
</script>
