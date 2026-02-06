import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import "./style.css";
import { preloadThreeModulesInBackground } from "@utils/lazyLoading";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount("#app");

// Preload Three.js modules in the background for better performance
preloadThreeModulesInBackground();
