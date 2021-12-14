<template lang="pug">
  div.icon-cont.position-relative.d-flex.justify-content-between.align-items-center.rounded.overflow-hidden(:class="{'cursor-pointer':isBtn,'icon-cont-bg':hasBackground, 'btn-effect':isBtn}" :style="`color:${color}; height: ${size}rem; width: ${size}rem; min-width: ${size}rem;`")
    svg(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :stroke-width="strokeWidth"  class="icon" :class="{'m-1':hasBackground}" v-html="icons[name]")
</template>

<script>
import icons from '@/static/icons.js';
export default {
  name: 'Icon',
  props: {
    name: {
      type: String,
      default: '',
    },
    strokeWidth: {
      type: Number,
      default: 1.5,
    },
    size: {
      type: Number,
      default: 2,
    },
    color: {
      type: String,
      default: 'currentColor',
    },
    isBtn: {
      type: Boolean,
      default: true,
    },
    hasBackground: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      icons,
    };
  },
};
</script>

<style lang="scss" scoped>
.icon {
  stroke: currentColor;
  fill: none;
  height: 100%;
  widows: 100%;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-cont::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0.1;
}

.icon-cont-bg::before {
  background: currentColor;
}
</style>
