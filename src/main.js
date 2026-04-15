import { createApp } from 'vue';
import './css/app.css';
import './css/league.css';
import './css/responsive.css';
import App from './App.vue';
import router from './router';

createApp(App).use(router).mount('#app');
