<script setup>
import { ref } from "vue";
import { api } from "../api";

const first_name = ref("");
const last_name = ref("");
const email = ref("");
const password = ref("");

const loading = ref(false);
const message = ref("");
const error = ref("");

function isValidPassword(pw) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);
}

const passwordHint =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.";

async function register() {
  error.value = "";
  message.value = "";

  if (!isValidPassword(password.value)) {
    error.value = passwordHint;
    return;
  }

  loading.value = true;
  try {
    await api.post("/users", {
      first_name: first_name.value,
      last_name: last_name.value,
      email: email.value,
      password: password.value,
    });

    message.value = "Registered successfully! You can now log in ";

    first_name.value = "";
    last_name.value = "";
    email.value = "";
    password.value = "";
  } catch (e) {
    error.value =
      e?.response?.data?.message ||
      JSON.stringify(e?.response?.data) ||
      `Register failed (${e?.response?.status || "no status"})`;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="formCenter">
    <div class="form">
      <h1 class="pageTitle">Register</h1>
      <p class="subtle">Create an account to list items and bid.</p>

      <div v-if="message" class="state success">{{ message }}</div>
      <div v-if="error" class="state error">{{ error }}</div>

      <form @submit.prevent="register">
        <div class="field">
          <label>First name</label>
          <input class="input" v-model="first_name" placeholder="Jane" required />
        </div>

        <div class="field">
          <label>Last name</label>
          <input class="input" v-model="last_name" placeholder="Doe" required />
        </div>

        <div class="field">
          <label>Email</label>
          <input class="input" v-model="email" type="email" placeholder="you@example.com" required />
        </div>

        <div class="field">
          <label>Password</label>
          <input class="input" v-model="password" type="password" placeholder="••••••••" required />
          <small class="muted">{{ passwordHint }}</small>
        </div>

        <div class="actions">
          <button class="btn btnPrimary" :disabled="loading">
            {{ loading ? "Creating…" : "Create account" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.card { max-width: 520px; border: 1px solid #eee; border-radius: 16px; padding: 18px; }
.form { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
input { padding: 10px 12px; border: 1px solid #ddd; border-radius: 12px; }
button { padding: 10px 12px; border-radius: 12px; border: 1px solid #111; background: #111; color: white; cursor: pointer; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.ok { background: #eaffea; border: 1px solid #9be59b; padding: 10px 12px; border-radius: 12px; }
.bad { background: #ffe9e9; border: 1px solid #ffb8b8; padding: 10px 12px; border-radius: 12px; }
.hint { font-size: 12px; opacity: 0.7; margin-top: 4px; }
</style>
