import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import FilesView from '../views/FilesView.vue'
import AnalyticsView from '../views/AnalyticsView.vue'
import SystemSettingsView from '../views/SystemSettings.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/files',
    name: 'files',
    component: FilesView,
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: AnalyticsView,
  },
  {
    path: '/settings',
    name: 'settings',
    component: SystemSettingsView,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
