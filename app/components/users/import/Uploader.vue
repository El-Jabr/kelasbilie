<script setup lang="ts">
const {
  file,
  loadingPreview,
  previewFile,
  reset
} = useUserImport()

const input = ref<HTMLInputElement>()

function selectFile() {
  input.value?.click()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement

  if (!target.files?.length)
    return
  file.value = target.files[0] ?? null
  target.value = ''
}

const dragOver = ref(false)

function onDrop(event: DragEvent) {
  event.preventDefault()

  dragOver.value = false

  if (!event.dataTransfer?.files.length)
    return
  file.value = event.dataTransfer.files[0] ?? null
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">
            Upload File
          </h2>

          <p class="text-sm text-muted">
            Upload file Excel atau CSV untuk dipreview.
          </p>
        </div>

        <UButton
          to="/api/users/template"
          target="_blank"
          icon="i-lucide-download"
          color="neutral"
        >
          Download Template
        </UButton>
      </div>
    </template>

    <div
      class="rounded-lg border-2 border-dashed p-10 transition cursor-pointer"
      :class="[
        dragOver
          ? 'border-primary bg-primary/5'
          : 'border-default'
      ]"
      @click="selectFile"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <div class="flex flex-col items-center gap-4">
        <UIcon
          name="i-lucide-file-spreadsheet"
          class="text-primary size-14"
        />

        <div class="text-center">
          <p class="font-medium">
            Drag & Drop Excel disini
          </p>

          <p class="text-sm text-muted">
            atau klik untuk memilih file
          </p>
        </div>

        <UButton
          color="primary"
          variant="soft"
        >
          Pilih File
        </UButton>
      </div>

      <input
        ref="input"
        type="file"
        class="hidden"
        accept=".xlsx,.xls,.csv"
        @change="onFileChange"
      >
    </div>

    <div
      v-if="file"
      class="mt-6 rounded-lg border p-4 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-file"
          class="size-5"
        />

        <div>
          <p class="font-medium">
            {{ file.name }}
          </p>

          <p class="text-sm text-muted">
            {{ (file.size / 1024).toFixed(1) }} KB
          </p>
        </div>
      </div>

      <UButton
        color="error"
        variant="ghost"
        icon="i-lucide-trash"
        @click="reset"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          @click="reset"
        >
          Reset
        </UButton>

        <UButton
          icon="i-lucide-search-check"
          :loading="loadingPreview"
          :disabled="!file"
          @click="previewFile"
        >
          Preview
        </UButton>
      </div>
    </template>
  </UCard>
</template>
