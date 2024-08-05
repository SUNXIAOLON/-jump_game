<!--
 * @Author: aaaa aaaa
 * @Date: 2024-07-23 19:51:18
 * @LastEditors: aaaa aaaa
 * @LastEditTime: 2024-08-04 11:32:11
 * @FilePath: \running_game\src\views\home\HomeView.vue
 * @Description: 
-->
<template>
  <div class="explain">
      <P>
        <span>W</span>
      </P>
      <p>
        <span>A</span>
        <span>S</span>
        <span>D</span>
      </p>
      <p>
        <span>
           空格
        </span>
      </p>
  </div>
  <canvas id="canvas" ref="main" style="width: 100%;height: 100%;"></canvas>
</template>
<script setup>
import { Main } from "./js/main.js"
import { onMounted, ref } from "vue"
const main = ref(null);
//初始化场景
onMounted(() => {
  Main.init(main.value)
})
//导入模型
//绘制地砖
//键盘事件
//地面随机掉落
//捡到钥匙或者钻石 进到下一关
//下一关 钥匙或者钻石更远 掉落更快
</script>
<style scoped>
.explain{
  position: fixed;
  top: 0;
  left: 0;
  width: 150px;
  height: auto;
}
.explain p{
  text-align: center;
  margin:10px 0;
}
.explain p:nth-child(1) span,.explain p:nth-child(2) span{
  width: 30px;
  height: 30px;
}
.explain p:nth-child(3) span{
  width: 100px;
  height: 30px;
}
.explain p span{
  display: inline-block;
  border-radius: 5px;
  padding: 5px;
  color:#fff;
  box-shadow: inset 0 0 8px 0px #999;
}
.explain p:nth-child(2){
  display: flex;
  justify-content: space-around;
  margin: 5px;
}
.explain p span{
  font-size: 20px;
  font-weight: 999;
  
}
</style>
