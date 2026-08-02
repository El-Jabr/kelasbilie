<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({ title: 'Import Guru' })
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        Import Guru
      </h1>
      <p class="text-muted text-sm text-gray-500">
        Preview data sebelum mengimport guru.
      </p>
    </div>
    <BulkProfileImport
      resource="teachers"
      label="Guru"
      identifier="nip"
    />
  </div>
</template>
