<script setup lang="ts">
const { t } = useI18n();

// need manual review keys
const errorMsg = "Network error";
const test = [
  {
    title: t('welcome', { name: 'User' }),
  },
  {
    title: t('error.message', { error: errorMsg }),
  },
  {
    title: t(errorMsg),
  }
]
</script>

<template>
  <div>
    <!-- This is a test file with keys that need manual review -->
    <h1>{{ t('welcome', { name: 'User' }) }}</h1>
    <p>{{ t("items.count", { count: 5 }) }}</p>
    <p>{{ $t('error.message', { error: errorMsg }) }}</p>
    <p>{{ t(errorMsg) }}</p>
  </div>
</template>
