<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-title>Cuaca Jakarta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <p class="subtitle">Prakiraan suhu per jam dari Open-Meteo API</p>

      <ion-button expand="block" :disabled="loading" @click="ambilData">
        <ion-spinner v-if="loading" name="crescent" />
        <span v-else>Ambil Data</span>
      </ion-button>

      <ion-segment v-if="rows.length" v-model="mode" class="segment">
        <ion-segment-button value="10">
          <ion-label>10 Data Pertama</ion-label>
        </ion-segment-button>
        <ion-segment-button value="all">
          <ion-label>Semua ({{ rows.length }})</ion-label>
        </ion-segment-button>
      </ion-segment>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <div v-if="rows.length" class="summary">
        <div><span>Min</span><strong>{{ stats.min }} {{ unit }}</strong></div>
        <div><span>Rata-rata</span><strong>{{ stats.avg }} {{ unit }}</strong></div>
        <div><span>Max</span><strong>{{ stats.max }} {{ unit }}</strong></div>
      </div>

      <div v-if="rows.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>time<small>{{ timezone }}</small></th>
              <th>Waktu<small>WIB</small></th>
              <th>Suhu ({{ unit }})<small>temperature_2m</small></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in visibleRows" :key="row.time">
              <td>{{ row.no }}</td>
              <td>{{ row.time }}</td>
              <td>{{ row.wib }}</td>
              <td :class="tempClass(row.temperature)">{{ row.temperature.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonButton, IonContent, IonHeader, IonLabel, IonPage,
  IonSegment, IonSegmentButton, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/vue';
import EndPointAccess from '@/services/EndPointAccess';
import type { HourlyRow, WeatherResponse } from '@/services/types';

const API_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-6.2&longitude=106.8&hourly=temperature_2m';

const rows = ref<HourlyRow[]>([]);
const unit = ref('°C');
const timezone = ref('GMT');
const mode = ref<'10' | 'all'>('10');
const loading = ref(false);
const errorMsg = ref('');

const visibleRows = computed(() =>
  mode.value === '10' ? rows.value.slice(0, 10) : rows.value,
);

const stats = computed(() => {
  const temps = rows.value.map((r) => r.temperature);
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
  return { min: Math.min(...temps), max: Math.max(...temps), avg: avg.toFixed(1) };
});

// Data API memakai GMT (UTC+0), dikonversi ke WIB (UTC+7)
function toWIB(time: string, offsetSeconds: number): string {
  const utc = new Date(time + 'Z').getTime() - offsetSeconds * 1000;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  }).format(utc);
}

function tempClass(t: number): string {
  if (t >= 33) return 'hot';
  if (t <= 26) return 'cool';
  return '';
}

async function ambilData(): Promise<void> {
  loading.value = true;
  errorMsg.value = '';
  try {
    const endpoint = new EndPointAccess(API_URL);
    const { data } = await endpoint.getRes<WeatherResponse>();

    unit.value = data.hourly_units.temperature_2m;
    timezone.value = data.timezone;
    rows.value = data.hourly.time.map((time, i) => ({
      no: i + 1,
      time,
      wib: toWIB(time, data.utc_offset_seconds),
      temperature: data.hourly.temperature_2m[i],
    }));
  } catch (err) {
    errorMsg.value = 'Gagal mengambil data. Periksa koneksi internet Anda.';
    console.error(err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.subtitle {
  margin: 0 0 12px;
  color: var(--ion-color-medium);
  text-align: center;
}
.segment {
  margin: 16px 0;
}
.error {
  color: var(--ion-color-danger);
  text-align: center;
}
.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.summary div {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  background: var(--ion-color-light);
}
.summary span {
  font-size: 12px;
  color: var(--ion-color-medium);
}
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
th, td {
  padding: 8px 6px;
  text-align: center;
  border-bottom: 1px solid var(--ion-color-light-shade);
  white-space: nowrap;
}
th small {
  display: block;
  font-size: 10px;
  font-weight: 400;
  opacity: 0.85;
}
th {
  background: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
}
tbody tr:nth-child(even) {
  background: var(--ion-color-light);
}
.hot {
  color: var(--ion-color-danger);
  font-weight: 600;
}
.cool {
  color: var(--ion-color-primary);
  font-weight: 600;
}
</style>
