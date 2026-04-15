<template>
  <div class="app-container">
    <nav class="soccerstat-navbar">
      <div class="navbar-container">
        <router-link to="/" class="navbar-logo">
          <img :src="logo" alt="FIFA Logo" class="logo-image" />
        </router-link>

        <div class="navbar-tabs-container">
          <div class="navbar-tabs">
            <button 
              :class="['navbar-tab', { active: isActive('Leagues') }]"
              @click="navigateTo('Leagues')"
            >
              Лиги
            </button>
            <button 
              :class="['navbar-tab', { active: isActive('Teams') }]"
              @click="navigateTo('Teams')"
            >
              Команды
            </button>
          </div>
          <div class="navbar-indicator" :style="indicatorStyle"></div>
        </div>
      </div>
    </nav>

    <main class="main-bg">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      logo: new URL('/FIFA.svg', import.meta.url).href,
      activeTab: 'Leagues',
      indicatorPosition: 0,
      indicatorWidth: 0,
    };
  },
  computed: {
    indicatorStyle() {
      return {
        transform: `translateX(${this.indicatorPosition}px)`,
        width: `${this.indicatorWidth}px`,
      };
    },
  },
  mounted() {
    this.updateIndicator();
    window.addEventListener('resize', this.updateIndicator);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateIndicator);
  },
  watch: {
    '$route.name'() {
      this.updateActiveTab();
      this.updateIndicator();
    },
  },
  methods: {
    isActive(routeName) {
      return this.$route.name === routeName;
    },
    navigateTo(routeName) {
      this.$router.push({ name: routeName });
    },
    updateActiveTab() {
      const routeName = this.$route.name;
      if (routeName === 'Leagues' || routeName === 'Teams') {
        this.activeTab = routeName;
      }
    },
    updateIndicator() {
      this.$nextTick(() => {
        const activeTabElement = document.querySelector('.navbar-tab.active');
        if (activeTabElement) {
          const parentRect = activeTabElement.parentElement.getBoundingClientRect();
          const tabRect = activeTabElement.getBoundingClientRect();
          this.indicatorPosition = tabRect.left - parentRect.left;
          this.indicatorWidth = tabRect.width;
        }
      });
    },
  },
};
</script>