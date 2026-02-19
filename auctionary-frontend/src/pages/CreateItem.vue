<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "../api";
import { addCreatedItem } from "../itemCache";

const router = useRouter();

const name = ref("");
const description = ref("");
const starting_bid = ref("");
const end_date = ref("");

const loading = ref(false);
const error = ref("");

async function createItem() {
  error.value = "";
  loading.value = true;

  try {
    const payload = {
      name: name.value.trim(),
      description: description.value.trim(),
      starting_bid: Number(starting_bid.value),
      end_date: new Date(end_date.value).getTime(),
    };

    if (!payload.name) throw new Error("Name is required");
    if (!Number.isFinite(payload.starting_bid)) throw new Error("Starting bid must be a number");
    if (!Number.isFinite(payload.end_date)) throw new Error("End date is required");

    const res = await api.post("/items", payload);

    const newId = res?.data?.item_id ?? res?.data?.id;
    const idNum = Number(newId);

 if (Number.isFinite(idNum)) {
  try {
    const itemRes = await api.get(`/items/${idNum}`);
    addCreatedItem(itemRes.data);
  } catch (e) {
    addCreatedItem({ item_id: idNum });
  }
  router.push(`/items/${idNum}`);
} else {
  router.push("/items");
}


  } catch (e) {
    console.error("CREATE ITEM ERROR:", e?.response?.data || e);
    error.value =
      e?.response?.data?.error_message ||
      e?.response?.data?.message ||
      e?.message ||
      "Failed to create item";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="page">
    <h1>Create Item</h1>

    <div v-if="error" class="state error">{{ error }}</div>

    <div class="form">
      <label>Name</label>
      <input class="input" v-model="name" placeholder="e.g. iPhone 15 Pro" />

      <label>Description</label>
      <textarea class="input" rows="5" v-model="description" placeholder="Describe the item…"></textarea>

      <label>Starting bid (£)</label>
      <input class="input" v-model="starting_bid" placeholder="e.g. 50" inputmode="decimal" />

      <label>End date/time</label>
      <input class="input" v-model="end_date" type="datetime-local" />

      <button class="btn" :disabled="loading" @click="createItem">
        {{ loading ? "Creating…" : "Create item" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; padding: 18px; width: 100%; }
.form { margin-top: 12px; display: grid; gap: 10px; }
.input { border: 1px solid #ddd; border-radius: 12px; padding: 10px 12px; }
.btn { margin-top: 6px; border: 1px solid #ddd; background: #fff; padding: 10px 14px; border-radius: 12px; cursor: pointer; font-weight: 800; }
.state { margin-top: 12px; padding: 12px; border-radius: 12px; background: #f4f4f4; }
.state.error { background:#ffe9e9; border:1px solid #ffb8b8; }
</style>
