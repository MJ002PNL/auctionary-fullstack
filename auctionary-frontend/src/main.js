import { createApp } from "vue";
import App from "./App.vue";
import { createRouter, createWebHistory } from "vue-router";
import "./style.css";
import Home from "./pages/Home.vue";
import Login from "./pages/Login.vue";
import Register from "./pages/Register.vue";
import Dashboard from "./pages/Dashboard.vue";
import Items from "./pages/Items.vue";
import ItemDetails from "./pages/ItemDetails.vue";
import CreateItem from "./pages/CreateItem.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/register", component: Register },
  { path: "/dashboard", component: Dashboard, meta: { requiresAuth: true } },

  { path: "/items", component: Items },
  { path: "/items/:item_id", component: ItemDetails },

  { path: "/create-item", component: CreateItem },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) return "/login";
});

createApp(App).use(router).mount("#app");
