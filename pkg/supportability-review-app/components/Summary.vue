<template>
  <div class="container">
    <div class="main-heading">Executive Summary</div>
    <p class="summary-text">
      To generate a detailed report of this Supportability Review, please open a support case with SUSE via the SCC
      portal.
    </p>
  </div>
</template>

<script>
export default {
  name: 'Summary'
}
</script>

<style scoped>
.container {
  display: grid;
  padding: 20px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.main-heading {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-left: 10px;
  margin-bottom: 10px;
}

.summary-text {
  font-size: 20px;
  color: #555;
  line-height: 1.6;
  margin: 10px 10px;
  text-align: center;
}
</style>
