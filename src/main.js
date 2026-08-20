import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { createI18n } from './i18n';
import { purgePersistedGuestHistory } from './utils/guestHistoryStorage';
import './styles/index.css';

purgePersistedGuestHistory();

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(createI18n());

app.mount('#app');
