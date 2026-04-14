<template>
  <v-app>
    <v-app-bar app flat class="soccerstat-navbar">
      <template #prepend>
        <router-link to="/" class="navbar-logo">
          <img src="/FIFA.svg" alt="FIFA Logo" class="logo-image" />
        </router-link>
      </template>

      <v-tabs class="navbar-tabs">
        <v-tab :to="{ name: 'Leagues' }" exact class="navbar-tab"> Лиги </v-tab>
        <v-tab :to="{ name: 'Teams' }" class="navbar-tab"> Команды </v-tab>
      </v-tabs>

      <v-spacer />
    </v-app-bar>

    <v-main class="main-bg">
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
};
</script>
