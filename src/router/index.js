// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Leagues from '../views/Leagues.vue'
import Teams from '../views/Teams.vue'
import LeagueMatches from '../views/LeagueMatches.vue'
import TeamMatches from '../views/TeamMatches.vue'

const routes = [
  {
    path: '/',
    name: 'Leagues',
    component: Leagues
  },
  {
    path: '/teams',
    name: 'Teams',
    component: Teams
  },
  {
    path: '/league/:id/matches',
    name: 'LeagueMatches',
    component: LeagueMatches
  },
  {
    path: '/team/:id/matches',
    name: 'TeamMatches',
    component: TeamMatches
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router