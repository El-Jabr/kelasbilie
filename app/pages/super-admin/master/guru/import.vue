<script setup lang="ts">
useSeoMeta({ title: 'Import Guru' })
</script>

<template>
  <UContainer class="space-y-6 py-6">
    <div>
      <h1 class="text-2xl font-bold">
        Import Guru
      </h1><p class="text-muted">
        Preview data sebelum mengimport guru.
      </p>
    </div>
    <BulkProfileImport
      resource="teachers"
      label="Guru"
      identifier="nip"
    />
  </UContainer>
</template>
