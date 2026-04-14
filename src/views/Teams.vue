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
            type="text"
            v-model="search"
            placeholder="Search"
            class="search-input"
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
  name: 'Teams',
  data() {
    return {
      teams: [],
      search: '',
      page: 1,
      itemsPerPage: 16,
      loading: false,
      error: null
    }
  },
  computed: {
    filteredTeams() {
      if (!this.search.trim()) return this.teams
      const q = this.search.toLowerCase()
      return this.teams.filter(team =>
        team.name.toLowerCase().includes(q)
      )
    },
    paginatedTeams() {
      const start = (this.page - 1) * this.itemsPerPage
      return this.filteredTeams.slice(start, start + this.itemsPerPage)
    },
    totalPages() {
      return Math.ceil(this.filteredTeams.length / this.itemsPerPage)
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
    search() {
      this.page = 1
    }
  },
  async mounted() {
    await this.fetchTeams()
  },
  methods: {
    async fetchTeams() {
      this.loading = true
      this.error = null
      
      try {
        const { data } = await axios.get('/api/v4/teams', {
          headers: { 
            'X-Auth-Token': import.meta.env.VITE_API_TOKEN 
          }
        })
        
        this.teams = (data.teams || []).map(team => ({
          ...team,
          crest: team.crest || null
        }))
        
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
    goToTeam(id) {
      this.$router.push({ name: 'TeamMatches', params: { id } })
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