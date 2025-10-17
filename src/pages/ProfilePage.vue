<template>
  <div class="min-h-screen bg-slate-100">
    <AppHeader mode="dashboard" />
    <main class="mx-auto max-w-4xl px-4 py-10">
      <ProfilePanel />
    </main>
  </div>
</template>

<script setup>
import AppHeader from '../sections/AppHeader.vue';
import ProfilePanel from '../components/dashboard/ProfilePanel.vue';
</script>
