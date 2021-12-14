<template>
  <div>
    <Nuxt />
  </div>
</template>

<script>
export default {};
</script>

<style>
html {
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

.back-to-top {
  background-color: #0d6efd;
  cursor: pointer;
  border-radius: 50%;
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  display: none;
  padding: 0.7rem;
  z-index: 100000;
}

.back-to-top > .icon-cont {
  width: 100% !important;
  height: 100% !important;
}
</style>
