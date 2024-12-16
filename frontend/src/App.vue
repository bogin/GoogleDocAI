<template>
  <div class="app">
    <nav class="nav">
      <router-link :to="{ name: 'home' }">Home</router-link> |
      <router-link :to="{ name: 'files' }">Files</router-link>
    </nav>

    <router-view />
  </div>
</template>

<style lang="scss">
.app {
  .nav {
    padding: 20px;
    background-color: #f8f9fa;

    a {
      padding: 10px;
      text-decoration: none;
      color: #2c3e50;

      &.router-link-exact-active {
        color: #42b983;
        font-weight: bold;
      }
    }
  }
}
</style>
