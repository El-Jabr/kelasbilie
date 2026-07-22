<script setup lang="ts">
useSeoMeta({ title: 'Import Siswa' })
</script>

<template>
  <UContainer class="space-y-6 py-6">
    <div>
      <h1 class="text-2xl font-bold">
        Import Siswa
      </h1><p class="text-muted">
        Preview data sebelum mengimport siswa.
      </p>
    </div>
    <BulkProfileImport
      resource="students"
      label="Siswa"
      identifier="nis"
    />
  </UContainer>
</template>
