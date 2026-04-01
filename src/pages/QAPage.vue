<template>
  <div class="min-h-screen bg-slate-50">
    <AppHeader mode="dashboard" />
    <main class="mx-auto max-w-5xl px-4 py-10">
      <QAPanel />
    </main>
  </div>
</template>

<script setup>
import AppHeader from '../sections/AppHeader.vue';
import QAPanel from '../components/dashboard/QAPanel.vue';
</script>
