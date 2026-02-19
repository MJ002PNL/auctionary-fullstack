<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
import { ref, onMounted } from "vue";

const token = ref(null);

onMounted(() => {
  token.value = localStorage.getItem("token");
});

function logout() {
  localStorage.removeItem("token");
  token.value = null;
  router.push("/login");
}

</script>

<template>
  <header class="topbar">
    <div class="navwrap">
      <div class="brand">
        Auctionary <small>curated auctions</small>
      </div>

      <nav class="navlinks">
        <router-link to="/">Home</router-link>
        <router-link to="/items">Items</router-link>

        <template v-if="token">
          <router-link to="/create-item">Create Item</router-link>
          <router-link to="/dashboard">Dashboard</router-link>
          <a href="#" @click.prevent="logout">Logout</a>
        </template>

        <template v-else>
          <router-link to="/register">Register</router-link>
          <router-link to="/login">Login</router-link>
        </template>
      </nav>
    </div>
  </header>

  <main class="container">
    <router-view />
  </main>
</template>
