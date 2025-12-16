import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { usePreferencesStore } from './store/preferences.js';
import './styles/index.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const preferencesStore = usePreferencesStore(pinia);
preferencesStore.initialize();

app.mount('#app');
