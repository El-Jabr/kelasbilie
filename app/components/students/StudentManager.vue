<script setup lang="ts">
/* eslint-disable @stylistic/max-statements-per-line */
import type { TableColumn } from '@nuxt/ui'
import { createStudentSchema, type CreateStudentSchema, type StudentTableSchema } from '~~/shared/schemas/student'

const { students, pagination, loading, search, refresh, resetFilter, changePage } = useStudents()
const dialogs = useStudentDialogs()
const { creating, updating, deleting, createStudent, updateStudent, deleteStudent } = useStudentActions()
const users = ref<{ value: string, label: string }[]>([])
const form = reactive<CreateStudentSchema>({ userId: '', nis: '' })
const columns: TableColumn<StudentTableSchema>[] = [{ accessorKey: 'nis', header: 'NIS' }, { accessorKey: 'user.fullname', header: 'Nama Siswa' }, { accessorKey: 'user.username', header: 'Username' }, { id: 'action' }]
const debounceRefresh = useDebounceFn(refresh, 500)
const formDialogOpen = computed({ get: () => dialogs.createDialogOpen.value || dialogs.editDialogOpen.value, set: (open) => { if (!open) { if (dialogs.editDialogOpen.value) dialogs.closeEditDialog(); else dialogs.closeCreateDialog() } } })

watch(search, debounceRefresh)
watch(dialogs.createDialogOpen, (open) => { if (open) Object.assign(form, { userId: '', nis: '' }) })
watch(dialogs.editDialogOpen, (open) => { if (open && dialogs.selectedStudent.value) Object.assign(form, { userId: dialogs.selectedStudent.value.userId, nis: dialogs.selectedStudent.value.nis }) })
onMounted(async () => {
  const response = await $fetch<{ data: { id: string, fullname: string, username: string }[] }>('/api/users', { query: { limit: 100 } })
  users.value = response.data.map(user => ({ value: user.id, label: `${user.fullname} (${user.username})` }))
})
async function save() { if (dialogs.editDialogOpen.value) await updateStudent(form); else await createStudent(form) }
</script>

<template>
  <UCard>
    <div class="flex gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari NIS atau nama siswa..."
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
        Tambah Siswa
      </UButton>
      <UButton
        icon="i-lucide-upload"
        variant="outline"
        to="/super-admin/master/siswa/import"
      >
        Import Siswa
      </UButton>
    </div>
  </UCard>
  <UCard>
    <UTable
      :data="students"
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
            {{ dialogs.editDialogOpen.value ? 'Edit Siswa' : 'Tambah Siswa' }}
          </h2>
        </template><UForm
          :schema="createStudentSchema"
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
              label="NIS"
              required
            >
              <UInput
                v-model="form.nis"
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
      <UCard v-if="dialogs.selectedStudent.value">
        <template #header>
          <h2 class="text-lg font-semibold text-error">
            Hapus Siswa
          </h2>
        </template><p>Hapus siswa <strong>{{ dialogs.selectedStudent.value.user.fullname }}</strong>?</p><template #footer>
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
              @click="deleteStudent"
            >
              Hapus
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
