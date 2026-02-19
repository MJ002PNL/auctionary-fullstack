<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api";

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function login() {
  error.value = "";
  loading.value = true;

  try {
    const res = await api.post("/login", {
      email: email.value.trim(),
      password: password.value,
    });
    const token = res?.data?.token || res?.data?.session_token;
    if (!token) throw new Error("No token returned from backend");
    localStorage.setItem("token", token);
    window.location.href = "/dashboard";
  } catch (e) {
    console.error("LOGIN ERROR:", e?.response?.data || e);
    error.value =
      e?.response?.data?.message ||
      e?.response?.data?.error_message ||
      e?.message ||
      `Login failed (${e?.response?.status || "no status"})`;
    loading.value = false;
  }
}
</script>

<template>
  <div class="formCenter">
    <div class="form">
      <h1 class="pageTitle">Login</h1>
      <p class="subtle">Access your Auctionary account</p>

      <div v-if="error" class="state error">{{ error }}</div>

      <form @submit.prevent="login">
        <div class="field">
          <label>Email</label>
          <input
            class="input"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div class="field">
          <label>Password</label>
          <input
            class="input"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <div class="actions">
          <button class="btn btnPrimary" :disabled="loading">
            {{ loading ? "Logging in…" : "Login" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>