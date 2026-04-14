<template>
  <div class="leagues-page">
    <div class="leagues-container">
      <!-- Поисковая строка -->
      <div class="search-section">
        <div class="search-label"></div>
        <div class="search-wrapper">
          <img src="/search/Search.svg" alt="search" class="search-icon" />
          <input
            type="text"
            v-model="search"
            placeholder="Search"
            class="search-input"
            :class="{ 'search-executed': searchExecuted }"
            @focus="handleFocus"
            @blur="handleBlur"
            @keyup.enter="handleSearch"
            @input="showClearIcon = search.length > 0"
          />
          <img
            v-if="search.length > 0"
            src="/search/clear.svg"
            alt="clear"
            class="clear-icon"
            :class="{ visible: showClearIcon }"
            @click="clearSearch"
          />
        </div>
      </div>

      <div v-if="loading" class="leagues-grid">
        <div v-for="n in 16" :key="n" class="league-card-skeleton">
          <div class="skeleton-logo"></div>
          <div class="skeleton-title"></div>
        </div>
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="filteredTeams.length === 0" class="empty-state">
        <p>Ничего не найдено по запросу «{{ search }}»</p>
      </div>

      <div v-else class="leagues-grid">
        <div
          v-for="team in paginatedTeams"
          :key="team.id"
          class="league-card teams-card"
          @click="goToTeam(team.id)"
        >
          <div class="league-logo-wrapper">
            <img
              v-if="team.crest"
              :src="team.crest"
              :alt="team.name"
              class="league-logo"
              @error="handleImageError"
            />
            <div v-else class="league-logo-placeholder">
              <span></span>
            </div>
          </div>

          <div class="team-info">
            <div class="team-name">{{ team.name }}</div>
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
              d="M0.75 8.25L4.5 5L0.75 1.75"
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
  name: 'Teams',
  data() {
    return {
      teams: [],
      search: '',
      searchQuery: '',
      page: 1,
      itemsPerPage: 16,
      loading: false,
      error: null,
      showClearIcon: false,
      searchExecuted: false,
    };
  },
  computed: {
    filteredTeams() {
      if (!this.searchQuery.trim()) return this.teams;
      const q = this.searchQuery.toLowerCase();
      return this.teams.filter((team) => team.name.toLowerCase().includes(q));
    },
    paginatedTeams() {
      const start = (this.page - 1) * this.itemsPerPage;
      return this.filteredTeams.slice(start, start + this.itemsPerPage);
    },
    totalPages() {
      return Math.ceil(this.filteredTeams.length / this.itemsPerPage);
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
    searchQuery() {
      this.page = 1;
    },
  },
  async mounted() {
    await this.fetchTeams();
  },
  methods: {
    async fetchTeams() {
      this.loading = true;
      this.error = null;

      try {
        const { data } = await axios.get('/api/v4/teams', {
          headers: {
            'X-Auth-Token': import.meta.env.VITE_API_TOKEN,
          },
        });

        this.teams = (data.teams || []).map((team) => ({
          ...team,
          crest: team.crest || null,
        }));
      } catch (err) {
        const status = err.response?.status;
        if (status === 429) {
          this.error = 'Превышен лимит запросов к API. Попробуйте позже.';
        } else if (status === 403) {
          this.error = 'Неверный API-токен. Проверьте переменную VITE_API_TOKEN.';
        } else {
          this.error = 'Не удалось загрузить данные. Проверьте соединение с интернетом.';
        }
      } finally {
        this.loading = false;
      }
    },
    handleFocus() {
      // Убираем тень при фокусе
      this.searchExecuted = false;
    },
    handleBlur() {
      // Если после потери фокуса есть текст, но не было Enter, показываем крестик
      if (this.search.length > 0 && !this.searchExecuted) {
        this.showClearIcon = true;
      }
    },
    handleSearch() {
      this.searchQuery = this.search;
      this.searchExecuted = true;
      this.showClearIcon = false;
      // Убираем фокус с input элемента
      this.$nextTick(() => {
        const input = document.querySelector('.search-input');
        if (input) input.blur();
      });
    },
    clearSearch() {
      this.search = '';
      this.searchQuery = '';
      this.showClearIcon = false;
      this.searchExecuted = false;
      // Фокусируемся на поле ввода после очистки
      this.$nextTick(() => {
        const input = document.querySelector('.search-input');
        if (input) input.focus();
      });
    },
    goToTeam(id) {
      this.$router.push({ name: 'TeamMatches', params: { id } });
    },
    handleImageError(event) {
      const imgElement = event.target;
      imgElement.style.display = 'none';
      const placeholder = imgElement.nextElementSibling;
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    },
  },
};
</script>
