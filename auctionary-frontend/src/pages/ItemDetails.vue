<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { api } from "../api";

const route = useRoute();
const router = useRouter();

const itemId = computed(() => {
  const raw = route.params.item_id;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : NaN;
});

const loading = ref(false);
const error = ref("");

const item = ref(null);
const bids = ref([]);
const questions = ref([]);

const bidAmount = ref("");
const questionText = ref("");
const answerTextById = ref({});

function fmtDate(ms) {
  const d = new Date(Number(ms));
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

async function loadAll() {
  if (!Number.isFinite(itemId.value)) {
    error.value = "Invalid item id";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
const itemRes = await api.get(`/items/${itemId.value}`);
item.value = itemRes.data;

const bidsRes = await api.get(`/items/${itemId.value}/bids`);
bids.value = Array.isArray(bidsRes.data) ? bidsRes.data : (bidsRes.data?.bids ?? []);

const qRes = await api.get(`/items/${itemId.value}/questions`);
questions.value = Array.isArray(qRes.data)? qRes.data: (qRes.data?.questions ?? []);


  } catch (e) {
    console.error("LOAD ITEM ERROR:", e);
    error.value = e?.response
      ? `Failed to load item (${e.response.status})`
      : "Failed to load item (network error)";
  } finally {
    loading.value = false;
  }
}

async function placeBid() {
  const amount = Number(bidAmount.value);
  if (!Number.isFinite(amount) || amount <= 0) return;

  try {
  await api.post(`/items/${itemId.value}/bids`, { amount });
    bidAmount.value = "";
    await loadAll();
  } catch (e) {
    console.error("PLACE BID ERROR:", e);
    alert(e?.response?.data?.message ?? "Failed to place bid");
  }
}

async function askQuestion() {
  const text = questionText.value.trim();
  if (!text) return;

  const bodies = [
    { question: text },
    { question_text: text },
  ];

  try {
    let lastErr;
    for (const body of bodies) {
      try {
        await api.post(`/items/${itemId.value}/questions`, body);
        questionText.value = "";
        await loadAll();
        return;
      } catch (e) {
        lastErr = e;
        if (e?.response?.status !== 400) throw e;
      }
    }
    throw lastErr;
  } catch (e) {
    console.error("ASK QUESTION ERROR:", e);
    alert(e?.response?.data?.error_message ?? e?.response?.data?.message ?? "Failed to ask question");
  }
}

async function answerQuestion(question_id) {
  const text = (answerTextById.value[question_id] || "").trim();
  if (!text) return;

  const bodies = [
    { answer: text },
    { answer_text: text },
  ];

  try {
    let lastErr;
    for (const body of bodies) {
      try {
        await api.post(`/questions/${question_id}/answer`, body);
        answerTextById.value[question_id] = "";
        await loadAll();
        return;
      } catch (e) {
        lastErr = e;
        if (e?.response?.status !== 400) throw e;
      }
    }
    throw lastErr;
  } catch (e) {
    console.error("ANSWER ERROR:", e);
    alert(e?.response?.data?.error_message ?? e?.response?.data?.message ?? "Failed to answer question");
  }
}
onMounted(loadAll);
watch(() => route.params.item_id, loadAll);
</script>

<template>
  <div class="page">
    <button class="back" @click="router.push('/items')">← Back to items</button>

    <div v-if="loading" class="state">Loading…</div>
    <div v-else-if="error" class="state error">{{ error }}</div>

    <div v-else-if="item" class="card">
      <h1 class="title">{{ item.name || item.title || `Item #${item.item_id}` }}</h1>
      <p class="desc">{{ item.description || "No description yet." }}</p>

      <div class="meta">
        <div><b>Item ID:</b> {{ item.item_id }}</div>
        <div><b>Starting bid:</b> £{{ Number(item.starting_bid ?? 0).toFixed(2) }}</div>
        <div><b>Ends:</b> {{ fmtDate(item.end_date) }}</div>
      </div>

      <hr class="hr" />

      <section>
        <h2>Bids</h2>

        <div class="row">
          <input class="input" v-model="bidAmount" placeholder="Enter bid amount" inputmode="decimal" />
          <button type="button" class="btn" @click="placeBid">Place bid</button>

        </div>

        <ul class="list" v-if="bids.length">
          <li v-for="(b, idx) in bids" :key="idx">
            £{{ Number(b.amount ?? b.bid_amount ?? 0).toFixed(2) }}
          </li>
        </ul>
        <p v-else class="muted">No bids yet.</p>
      </section>

      <hr class="hr" />

      <section>
        <h2>Questions</h2>

        <div class="row">
          <input class="input" v-model="questionText" placeholder="Ask a question…" />
          <button type="button" class="btn" @click="askQuestion">Ask</button>

        </div>

        <div v-if="questions.length" class="qwrap">
          <div v-for="q in questions" :key="q.question_id" class="qcard">
            <div class="qtext"><b>Q:</b> {{ q.question_text || q.question }}</div>
            <div class="atext" v-if="q.answer_text"><b>A:</b> {{ q.answer_text }}</div>
            <div class="atext muted" v-else><b>A:</b> Not answered yet.</div>

            <div class="row" style="margin-top:10px;">
              <input
                class="input"
                :value="answerTextById[q.question_id] || ''"
                @input="answerTextById[q.question_id] = $event.target.value"
                placeholder="Write an answer…"
              />
              <button class="btn" @click="answerQuestion(q.question_id)">Answer</button>
            </div>
          </div>
        </div>

        <p v-else class="muted">No questions yet.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; padding: 18px; width: 100%; }
.back { border: 1px solid #ddd; background:#fff; padding:8px 12px; border-radius: 10px; cursor: pointer; }
.card { margin-top: 12px; border:1px solid #eee; border-radius: 18px; padding: 18px; background:#fff; }
.title { margin: 0 0 8px; font-weight: 900; }
.desc { margin: 0 0 14px; color:#333; line-height: 1.5; }
.meta { display: grid; gap: 6px; }
.hr { border: none; border-top: 1px solid #eee; margin: 18px 0; }
.row { display:flex; gap: 10px; align-items:center; }
.input { flex: 1; border:1px solid #ddd; border-radius: 12px; padding: 10px 12px; }
.btn { border:1px solid #ddd; background:#fff; padding: 10px 14px; border-radius: 12px; cursor: pointer; font-weight: 700; }
.list { margin: 10px 0 0; }
.muted { opacity: 0.7; }
.state { margin-top: 12px; padding: 12px; border-radius: 12px; background: #f4f4f4; }
.state.error { background:#ffe9e9; border:1px solid #ffb8b8; }
.qwrap { display: grid; gap: 12px; margin-top: 12px; }
.qcard { border: 1px solid #eee; border-radius: 14px; padding: 12px; }
.qtext, .atext { margin-top: 4px; }
</style>
