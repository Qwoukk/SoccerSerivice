<template>
  <div class="leagues-page">
    <div class="leagues-container">
      <!-- Поисковая строка -->
      <div class="search-section">
        <div class="search-label"></div>
        <div class="search-wrapper">
          <img 
            src="/search/Search.svg"
            alt="search" 
            class="search-icon"
          />
          <input 
            type="search"
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

      <!-- Остальной код... -->
      <div v-if="loading" class="leagues-grid">
        <div v-for="n in 16" :key="n" class="league-card-skeleton">
          <div class="skeleton-logo"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-subtitle"></div>
        </div>
      </div>

      <div v-else-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-else-if="filteredLeagues.length === 0" class="empty-state">
        <p>Ничего не найдено по запросу «{{ search }}»</p>
      </div>

      <div v-else class="leagues-grid">
        <div
          v-for="league in paginatedLeagues"
          :key="league.id"
          class="league-card"
          @click="goToLeague(league.id)"
        >
          <div class="league-logo-wrapper">
            <img 
              v-if="league.emblem" 
              :src="league.emblem" 
              :alt="league.name"
              class="league-logo"
              @error="handleImageError"
            />
            <div v-else class="league-logo-placeholder">
              <span></span>
            </div>
          </div>
          
          <div class="league-info">
            <div class="league-name">{{ league.name }}</div>
            <div class="league-country">{{ league.area.name }}</div>
          </div>
        </div>
      </div>

      <!-- Пагинация -->
      <div v-if="!loading && !error && totalPages > 1" class="pagination-wrapper">
        <button 
          class="pagination-btn"
          :disabled="page === 1"
          @click="page = 1"
        >
          <img src="/pagination/pagination.svg" alt="first" class="pagination-icon" />
        </button>
        
        <button 
          class="pagination-btn"
          :disabled="page === 1"
          @click="page--"
        >
          <img src="/pagination/pagination.svg" alt="prev" class="pagination-icon prev" />
        </button>
        
        <button 
          v-for="pageNum in visiblePages" 
          :key="pageNum"
          :class="['pagination-btn', { active: page === pageNum }]"
          @click="page = pageNum"
        >
          {{ pageNum }}
        </button>
        
        <button 
          class="pagination-btn"
          :disabled="page === totalPages"
          @click="page++"
        >
          <img src="/pagination/pagination.svg" alt="next" class="pagination-icon next" />
        </button>
        
        <button 
          class="pagination-btn"
          :disabled="page === totalPages"
          @click="page = totalPages"
        >
          <img src="/pagination/pagination.svg" alt="last" class="pagination-icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Leagues',
  data() {
    return {
      leagues: [],
      search: '',
      searchQuery: '',
      page: 1,
      itemsPerPage: 16,
      loading: false,
      error: null,
      showClearIcon: false,
      searchExecuted: false
    }
  },
  computed: {
    filteredLeagues() {
      if (!this.searchQuery.trim()) return this.leagues
      const q = this.searchQuery.toLowerCase()
      return this.leagues.filter(
        l => l.name.toLowerCase().includes(q) || 
             l.area.name.toLowerCase().includes(q)
      )
    },
    paginatedLeagues() {
      const start = (this.page - 1) * this.itemsPerPage
      return this.filteredLeagues.slice(start, start + this.itemsPerPage)
    },
    totalPages() {
      return Math.ceil(this.filteredLeagues.length / this.itemsPerPage)
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
    searchQuery() {
      this.page = 1
    }
  },
  async mounted() {
    await this.fetchLeagues()
  },
  methods: {
    handleFocus() {
      // Убираем тень при фокусе
      this.searchExecuted = false
    },
    handleBlur() {
      // Если после потери фокуса есть текст, но не было Enter, показываем крестик
      if (this.search.length > 0 && !this.searchExecuted) {
        this.showClearIcon = true
      }
    },
    handleSearch() {
      this.searchQuery = this.search
      this.searchExecuted = true
      this.showClearIcon = false
      // Убираем фокус с input элемента
      this.$nextTick(() => {
        const input = document.querySelector('.search-input')
        if (input) input.blur()
      })
    },
    clearSearch() {
      this.search = ''
      this.searchQuery = ''
      this.showClearIcon = false
      this.searchExecuted = false
      // Фокусируемся на поле ввода после очистки
      this.$nextTick(() => {
        const input = document.querySelector('.search-input')
        if (input) input.focus()
      })
    },
    async fetchLeagues() {
      this.loading = true
      this.error = null
      
      try {
        const { data } = await axios.get('/api/v4/competitions', {
          headers: { 
            'X-Auth-Token': import.meta.env.VITE_API_TOKEN 
          }
        })
        
        this.leagues = (data.competitions || []).filter(
          league => league.type === 'LEAGUE' || league.type === 'CUP'
        )
        
      } catch (err) {
        const status = err.response?.status
        if (status === 429) {
          this.error = 'Превышен лимит запросов к API. Попробуйте позже.'
        } else if (status === 403) {
          this.error = 'Неверный API-токен. Проверьте переменную VITE_API_TOKEN.'
        } else {
          this.error = 'Не удалось загрузить данные. Проверьте соединение с интернетом.'
        }
      } finally {
        this.loading = false
      }
    },
    goToLeague(id) {
      this.$router.push({ name: 'LeagueMatches', params: { id } })
    },
    handleImageError(event) {
      const imgElement = event.target
      imgElement.style.display = 'none'
      const placeholder = imgElement.nextElementSibling
      if (placeholder) {
        placeholder.style.display = 'flex'
      }
    }
  }
}
</script>