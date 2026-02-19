<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { api } from "../api";
import { readCreatedItemsCache } from "../itemCache";

const route = useRoute();

const items = ref([]);
const loading = ref(false);
const error = ref("");

function normalizeItems(data) {
  const list =
    Array.isArray(data) ? data :
    data && Array.isArray(data.items) ? data.items :
    [];

  return list
    .map((it) => ({
      ...it,
      item_id: it.item_id ?? it.id ?? it.itemId,
      name: it.name ?? it.item_name ?? it.title ?? it.itemTitle ?? "",
      description: it.description ?? it.item_description ?? it.details ?? it.itemDesc ?? "",
      starting_bid: it.starting_bid ?? it.startingBid ?? 0,
      end_date: it.end_date ?? it.endDate ?? null,
    }))
    .filter((it) => it.item_id != null)
    .sort((a, b) => Number(b.item_id) - Number(a.item_id));
}

function fmtDate(ms) {
  const d = new Date(Number(ms));
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

async function patchFromCache(serverList) {
  const createdItemsCache = readCreatedItemsCache();
  const byId = new Map(serverList.map((x) => [Number(x.item_id), x]));
  for (const cached of createdItemsCache) {
    const id = Number(cached.item_id);
    const existing = byId.get(id);
    if (!existing) continue;

    byId.set(id, {
      ...existing,
      name: cached.name ?? existing.name,
      description: cached.description ?? existing.description,
      starting_bid: cached.starting_bid ?? existing.starting_bid,
      end_date: cached.end_date ?? existing.end_date,
    });
  }
  const missingIds = createdItemsCache
    .map((x) => Number(x.item_id))
    .filter((id) => Number.isFinite(id) && !byId.has(id));

  await Promise.all(
    missingIds.slice(0, 25).map(async (id) => {
      try {
        const res = await api.get(`/items/${id}`);
        const it = res.data;
        if (!it) return;

        byId.set(Number(it.item_id ?? id), {
          ...it,
          item_id: it.item_id ?? id,
          name: it.name ?? it.item_name ?? it.title ?? "",
          description: it.description ?? it.item_description ?? it.details ?? "",
          starting_bid: it.starting_bid ?? it.startingBid ?? 0,
          end_date: it.end_date ?? it.endDate ?? null,
        });
      } catch {
      }
    })
  );

  return Array.from(byId.values()).sort((a, b) => Number(b.item_id) - Number(a.item_id));
}

async function loadItems() {
  loading.value = true;
  error.value = "";

  try {
    const res = await api.get("/search", {
      params: { q: "", start_index: 0, count: 100, _ts: Date.now() },
      headers: { "Cache-Control": "no-store" },
    });

    const serverList = normalizeItems(res.data);
    items.value = await patchFromCache(serverList);
  } catch (e) {
    console.error("LOAD ITEMS ERROR:", e);
    error.value = e?.response
      ? `Failed to load items (${e.response.status})`
      : "Failed to load items (network error)";
  } finally {
    loading.value = false;
  }
}

onMounted(loadItems);
watch(() => route.fullPath, loadItems);
</script>

<template>
  <div class="wrap">
    <h1>Items</h1>

    <p v-if="loading">Loading…</p>
    <p v-else-if="error" class="bad">{{ error }}</p>

    <div v-else class="grid">
      <router-link
        v-for="i in items"
        :key="i.item_id"
        class="card"
        :to="`/items/${i.item_id}`"
      >
        <h3 class="title">{{ i.name || `Item #${i.item_id}` }}</h3>
        <p class="desc">{{ i.description || "—" }}</p>

        <div class="row">
          <span class="label">Starting bid</span>
          <span class="value">£{{ Number(i.starting_bid ?? 0).toFixed(2) }}</span>
        </div>

        <div class="row">
          <span class="label">Ends</span>
          <span class="value">{{ fmtDate(i.end_date) }}</span>
        </div>

        <div class="view">View details →</div>
      </router-link>

      <p v-if="items.length === 0" class="muted">No items yet.</p>
    </div>
  </div>
</template>

<style scoped>
.wrap { max-width: 1100px; margin: 0 auto; padding: 18px; width: 100%; }
.grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.card {
  display: block;
  text-decoration: none;
  color: inherit;
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 14px;
  background: #fff;
}
.card:hover { border-color: #ccc; }
.title { margin: 0 0 8px; font-size: 18px; font-weight: 800; }
.desc { margin: 0 0 12px; opacity: 0.85; }
.row { display:flex; justify-content: space-between; gap: 10px; margin-top: 6px; }
.label { opacity: 0.7; }
.value { font-weight: 700; }
.view { margin-top: 10px; font-weight: 800; opacity: 0.9; }
.bad { background:#ffe9e9; border:1px solid #ffb8b8; padding:10px 12px; border-radius:12px; margin-top:10px; }
.muted { opacity: 0.7; }
</style>
