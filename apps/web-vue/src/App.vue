<script setup lang="ts">
import config from '../../../configs/app.config.json';

const { project, options, performance, accuracy, pipeline } = config;
</script>

<template>
  <main class="shell">
    <header class="head">
      <div class="mark">VF</div>
      <div>
        <h1>{{ project.name }}</h1>
        <p>Vue 옵션 · v{{ project.version }} · 모듈형 파이프라인 스튜디오</p>
      </div>
    </header>

    <section class="grid">
      <article class="card">
        <h2>선택된 모듈 옵션</h2>
        <ul>
          <li>프론트엔드 <b>{{ options.frontend.value }}</b></li>
          <li>분석 엔진 <b>{{ options.analysisEngine.value }}</b></li>
          <li>백엔드 <b>{{ options.backend.value }}</b></li>
          <li>디자인 <b>{{ options.design.value }}</b></li>
        </ul>
      </article>
      <article class="card">
        <h2>성능 / 정확도</h2>
        <ul>
          <li>해상도 <b>{{ performance.resolution.value }}</b> · FPS <b>{{ performance.fps.value }}</b></li>
          <li>신뢰도 임계값 <b>{{ accuracy.confidenceThreshold.value }}</b></li>
          <li>행동 모델 <b>{{ accuracy.behaviorModel.value }}</b></li>
        </ul>
      </article>
    </section>

    <section class="card">
      <h2>파이프라인 노드 (자동 업데이트 {{ pipeline.autoUpdate.value ? 'ON' : 'OFF' }})</h2>
      <div class="flow">
        <span v-for="n in pipeline.nodes" :key="n.id" class="node" :class="{ off: !n.enabled }">{{ n.label }}</span>
      </div>
    </section>

    <footer class="foot">
      전체 기능이 구현된 기준 앱은 <code>npm run dev</code> (React · http://localhost:53710) 에서 실행됩니다.
    </footer>
  </main>
</template>
