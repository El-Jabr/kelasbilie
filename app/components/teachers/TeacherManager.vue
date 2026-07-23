<script setup lang="ts">
/* eslint-disable @stylistic/max-statements-per-line */
import type { TableColumn } from '@nuxt/ui'
import { createTeacherSchema, type CreateTeacherSchema, type TeacherTableSchema } from '~~/shared/schemas/teacher'

const { teachers, pagination, loading, search, refresh, resetFilter, changePage } = useTeachers()
const dialogs = useTeacherDialogs()
const { creating, updating, deleting, createTeacher, updateTeacher, deleteTeacher } = useTeacherActions()
const users = ref<{ value: string, label: string }[]>([])
const form = reactive<CreateTeacherSchema>({ userId: '', nip: '' })
const columns: TableColumn<TeacherTableSchema>[] = [{ accessorKey: 'nip', header: 'NIP' }, { accessorKey: 'user.fullname', header: 'Nama Guru' }, { accessorKey: 'user.username', header: 'Username' }, { id: 'action' }]
const debounceRefresh = useDebounceFn(refresh, 500)
const formDialogOpen = computed({
  get: () => dialogs.createDialogOpen.value || dialogs.editDialogOpen.value,
  set: (open) => {
    if (!open) {
      if (dialogs.editDialogOpen.value) dialogs.closeEditDialog()
      else dialogs.closeCreateDialog()
    }
  }
})

watch(search, debounceRefresh)
watch(dialogs.createDialogOpen, (open) => { if (open) Object.assign(form, { userId: '', nip: '' }) })
watch(dialogs.editDialogOpen, (open) => { if (open && dialogs.selectedTeacher.value) Object.assign(form, { userId: dialogs.selectedTeacher.value.userId, nip: dialogs.selectedTeacher.value.nip }) })

onMounted(async () => {
  const response = await $fetch<{ data: { id: string, fullname: string, username: string }[] }>('/api/users', { query: { limit: 100 } })
  users.value = response.data.map(user => ({ value: user.id, label: `${user.fullname} (${user.username})` }))
})

async function save() { if (dialogs.editDialogOpen.value) await updateTeacher(form); else await createTeacher(form) }
</script>

<template>
  <UCard>
    <div class="flex gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari NIP atau nama guru..."
        class="flex-1"
      /><UButton
        :loading="loading"
        icon="i-lucide-refresh-cw"
        variant="soft"
        color="neutral"
        @click="refresh"
      >
        Refresh
      </UButton><UButton
        icon="i-lucide-filter-x"
        variant="soft"
        color="neutral"
        @click="resetFilter"
      >
        Reset
      </UButton><UButton
        icon="i-lucide-plus"
        @click="dialogs.openCreateDialog"
      >
        Tambah Guru
      </UButton>
      <UButton
        icon="i-lucide-upload"
        variant="outline"
        to="/super-admin/master/guru/import"
      >
        Import Guru
      </UButton>
    </div>
  </UCard>
  <UCard>
    <UTable
      :data="teachers"
      :columns="columns"
      :loading="loading"
    >
      <template #action-cell="{ row }">
        <UDropdownMenu :items="[[{ label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => dialogs.openEditDialog(row.original) }], [{ label: 'Hapus', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => dialogs.openDeleteDialog(row.original) }]]">
          <UButton
            icon="i-lucide-ellipsis"
            variant="ghost"
            color="neutral"
          />
        </UDropdownMenu>
      </template>
    </UTable>
  </UCard>
  <div class="flex justify-end">
    <UPagination
      :page="pagination.page"
      :items-per-page="pagination.limit"
      :total="pagination.total"
      @update:page="changePage"
    />
  </div>
  <UModal v-model:open="formDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold">
            {{ dialogs.editDialogOpen.value ? 'Edit Guru' : 'Tambah Guru' }}
          </h2>
        </template><UForm
          :schema="createTeacherSchema"
          :state="form"
          @submit="save"
        >
          <div class="space-y-4">
            <UFormField
              label="Akun Pengguna"
              required
            >
              <USelect
                v-model="form.userId"
                :items="users"
                value-key="value"
                label-key="label"
                placeholder="Pilih akun"
                class="w-full"
              />
            </UFormField><UFormField
              label="NIP"
              required
            >
              <UInput
                v-model="form.nip"
                class="w-full"
              />
            </UFormField>
          </div>
        </UForm><template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              @click="dialogs.editDialogOpen.value ? dialogs.closeEditDialog() : dialogs.closeCreateDialog()"
            >
              Batal
            </UButton><UButton
              :loading="creating || updating"
              @click="save"
            >
              Simpan
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
  <UModal v-model:open="dialogs.deleteDialogOpen.value">
    <template #content>
      <UCard v-if="dialogs.selectedTeacher.value">
        <template #header>
          <h2 class="text-lg font-semibold text-error">
            Hapus Guru
          </h2>
        </template><p>Hapus guru <strong>{{ dialogs.selectedTeacher.value.user.fullname }}</strong>?</p><template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              @click="dialogs.closeDeleteDialog"
            >
              Batal
            </UButton><UButton
              color="error"
              :loading="deleting"
              @click="deleteTeacher"
            >
              Hapus
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
