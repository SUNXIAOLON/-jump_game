/*
 * @Author: aaaa aaaa
 * @Date: 2024-07-23 19:51:18
 * @LastEditors: aaaa aaaa
 * @LastEditTime: 2024-07-29 20:53:08
 * @FilePath: \running_game\src\main.js
 * @Description: 
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')
