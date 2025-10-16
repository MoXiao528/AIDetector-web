<template>
  <div class="min-h-screen bg-slate-50">
    <AppHeader />
    <main>
      <HeroSection />
      <TrustIndicators />
      <CapabilitiesSection />
      <WorkflowSection />
      <ShowcaseSection />
      <TestimonialsSection />
      <PricingPreview />
      <CallToAction />
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '../sections/AppHeader.vue';
import HeroSection from '../sections/HeroSection.vue';
import TrustIndicators from '../sections/TrustIndicators.vue';
import CapabilitiesSection from '../sections/CapabilitiesSection.vue';
import WorkflowSection from '../sections/WorkflowSection.vue';
import ShowcaseSection from '../sections/ShowcaseSection.vue';
import TestimonialsSection from '../sections/TestimonialsSection.vue';
import PricingPreview from '../sections/PricingPreview.vue';
import CallToAction from '../sections/CallToAction.vue';
import AppFooter from '../sections/AppFooter.vue';
</script>
