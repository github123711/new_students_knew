import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 路由配置
 * meta.requiresAuth  = true  → 需要登录才能访问
 * meta.requiresAdmin = true  → 需要管理员权限
 * meta.title                 → 页面标题（用于 document.title）
 */
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '云游三中 · 首页' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录 · 云游三中' },
  },
  {
    path: '/tour',
    name: 'Tour',
    component: () => import('@/views/TourView.vue'),
    meta: { title: '3D 漫游 · 云游三中', requiresAuth: true },
  },
  {
    path: '/clubs',
    name: 'Clubs',
    component: () => import('@/views/ClubsView.vue'),
    meta: { title: '社团风采 · 云游三中' },
  },
  {
    path: '/departments',
    name: 'Departments',
    component: () => import('@/views/DepartmentsView.vue'),
    meta: { title: '部门介绍 · 云游三中' },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/AdminView.vue'),
    meta: { title: '管理后台 · 云游三中', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/content',
    name: 'AdminContent',
    component: () => import('@/views/admin/ContentManageView.vue'),
    meta: { title: '内容管理 · 云游三中', requiresAuth: true, requiresAdmin: true },
  },
  // 404 兜底路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面不存在 · 云游三中' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 浏览器回退时恢复滚动位置，否则滚到顶部
    return savedPosition || { top: 0 }
  },
})

// 全局前置守卫：鉴权拦截
router.beforeEach((to, from) => {
  // 更新页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  const auth = useAuthStore()

  // 需要登录但未登录 → 跳转到登录页，并记录来源路由
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  // 需要管理员权限但当前用户不是管理员
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: 'Home' }
  }
})

export default router
