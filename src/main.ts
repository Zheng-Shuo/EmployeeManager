import { createApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "element-plus/dist/index.css";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { setupResponseInterceptors } from "./utils/request";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(ElementPlus, { locale: zhCn });
app.use(router);

setupResponseInterceptors();

app.mount("#app");
