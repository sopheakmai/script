<script lang="ts" setup>
const { t } = useI18n();

// correct keys: user.name, accountSettings, orderdetails, invoice_id
const test = [
  {
    title: t('user.name'),
    description: t('user.profile'),
  }
]
// incorrect keys: Invalid Key, Title, item[0], order-details
const test2 = [
  {
    title: t('Invalid Key'),
    description: t('Title'),
  },
  {
    title: t('item[0]'),
    description: t('order-details'),
  }
]
</script>

<template>
  <div>
    <!-- This is a test file with various translation keys -->
    <p>{{ t('user.name') }}</p>
    <p>{{ t('accountSettings') }}</p>
    
    <!-- Invalid keys -->
    <p>{{ t('Invalid Key') }}</p>
    <p>{{ t('Title') }}</p>
    <p>{{ t('item[0]') }}</p>
    <p>{{ t('order-details') }}</p>
    <h1>{{ t('invoice_id') }}</h1>
  </div>
</template>
