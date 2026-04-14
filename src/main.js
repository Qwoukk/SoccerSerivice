import { createApp } from 'vue';
import './css/app.css';
import './css/league.css';
import './css/responsive.css';
import App from './App.vue';
import vuetify from './plugins/vuetify';
import router from './router';

createApp(App).use(vuetify).use(router).mount('#app');
