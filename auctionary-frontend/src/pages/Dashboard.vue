<script setup>
import { useRouter } from "vue-router";
import { api } from "../api";

const router = useRouter();

async function logout() {
  try {
    await api.post("/logout"); 
  } catch (e) {
    console.log("LOGOUT ERROR:", e?.response?.status, e?.response?.data);
  } finally {
    localStorage.removeItem("token");
    router.push("/login");
  }
}
</script>

<template>
  <div style="max-width: 900px; margin: 0 auto;">
    <h1 class="pageTitle">Dashboard</h1>
    <p class="subtle">Manage your account and auctions.</p>

    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
      <div class="card">
        <div class="cardTitle">Account status</div>
        <p class="cardDesc">You are currently logged in.</p>

        <div class="pill">Authenticated session</div>
      </div>

      <div class="card">
        <div class="cardTitle">Quick actions</div>
        <p class="cardDesc">Create or browse auction listings.</p>

        <div class="actions">
          <router-link class="btn btnPrimary" to="/create-item">
            Create item
          </router-link>

          <router-link class="btn" to="/items">
            Browse items
          </router-link>
        </div>
      </div>

      <div class="card">
        <div class="cardTitle">Session</div>
        <p class="cardDesc">End your current session securely.</p>

        <div class="actions">
          <button class="btn" @click="logout">
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

