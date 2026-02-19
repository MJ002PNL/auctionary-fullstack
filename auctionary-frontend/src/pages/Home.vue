<script setup>
const isLoggedIn = !!localStorage.getItem("token");
</script>

<template>
  <div class="pageCenter" style="min-height: 60vh; justify-content: center;">
    <h1 class="pageTitle">Auctionary</h1>
    <p class="subtle" style="max-width: 520px;">
      Discover curated auctions for premium and everyday items.
      Bid, sell, and manage listings with ease.
    </p>

    <div class="actions" style="margin-top: 20px;">
      <router-link class="btn" to="/items">Browse items</router-link>

      <router-link
        v-if="isLoggedIn"
        class="btn btnPrimary"
        to="/create-item"
      >
        Create item
      </router-link>
    </div>
  </div>
</template>
