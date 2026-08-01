<script setup lang="ts">
/* eslint-disable @stylistic/max-statements-per-line */
import type { TableColumn } from '@nuxt/ui'
import type { StudentTableSchema } from '~~/shared/schemas/student'

const { students, pagination, loading, search, refresh, resetFilter, changePage } = useStudents()
const dialogs = useStudentDialogs()
const { creating, updating, deleting, createStudent, updateStudent, deleteStudent } = useStudentActions()
const users = ref<{ value: string, label: string }[]>([])

const createMode = ref<'existing' | 'new'>('new')

const form = reactive<{
  userId?: string
  nis: string
  fullname?: string
  username?: string
  password?: string
}>({
  userId: '',
  nis: '',
  fullname: '',
  username: '',
  password: ''
})

const columns: TableColumn<StudentTableSchema>[] = [
  { accessorKey: 'nis', header: 'NIS' },
  { accessorKey: 'user.fullname', header: 'Nama Siswa' },
  { accessorKey: 'user.username', header: 'Username' },
  { id: 'action' }
]

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

async function loadUnassignedUsers() {
  try {
    const response = await $fetch<{ data: { id: string, fullname: string, username: string }[] }>('/api/users', {
      query: { unassignedFor: 'STUDENT', limit: 200 }
    })
    if (response?.data) {
      users.value = response.data.map(u => ({ value: u.id, label: `${u.fullname} (${u.username})` }))
    }
  } catch (err) {
    console.error('Gagal memuat list user unassigned:', err)
  }
}

watch(search, debounceRefresh)

watch(dialogs.createDialogOpen, (open) => {
  if (open) {
    Object.assign(form, { userId: '', nis: '', fullname: '', username: '', password: '' })
    loadUnassignedUsers()
  }
})

watch(dialogs.editDialogOpen, (open) => {
  if (open && dialogs.selectedStudent.value) {
    const st = dialogs.selectedStudent.value
    Object.assign(form, {
      userId: st.userId,
      nis: st.nis,
      fullname: st.user?.fullname || '',
      username: st.user?.username || ''
    })
    if (st.userId && st.user) {
      const exists = users.value.some(u => u.value === st.userId)
      if (!exists) {
        users.value.unshift({
          value: st.userId,
          label: `${st.user.fullname} (${st.user.username})`
        })
      }
    }
  }
})

onMounted(() => {
  loadUnassignedUsers()
})

async function save() {
  if (dialogs.editDialogOpen.value) {
    await updateStudent({ userId: form.userId, nis: form.nis })
  } else {
    const payload = createMode.value === 'existing'
      ? { userId: form.userId, nis: form.nis }
      : { fullname: form.fullname, nis: form.nis, username: form.username, password: form.password }
    await createStudent(payload as any)
  }
}
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-1 flex-col gap-3 md:flex-row">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari NIS atau nama siswa..."
          class="flex-1"
        />
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          :loading="loading"
          icon="i-lucide-refresh-cw"
          variant="soft"
          color="neutral"
          @click="refresh"
        >
          Refresh
        </UButton>

        <UButton
          icon="i-lucide-filter-x"
          variant="soft"
          color="neutral"
          @click="resetFilter"
        >
          Reset
        </UButton>

        <UButton
          icon="i-lucide-upload"
          color="primary"
          to="/super-admin/master/siswa/import"
        >
          Import Siswa
        </UButton>

        <UButton
          icon="i-lucide-plus"
          color="primary"
          variant="outline"
          @click="dialogs.openCreateDialog"
        >
          Tambah Siswa
        </UButton>
      </div>
    </div>
  </UCard>
  <UCard class="mt-4">
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
  <div class="flex justify-end mt-4">
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
            {{ dialogs.editDialogOpen.value ? 'Edit Data Siswa' : 'Tambah Siswa Baru' }}
          </h2>
        </template>

        <form @submit.prevent="save">
          <div class="space-y-4">
            <!-- Mode Switcher (Create Only) -->
            <div v-if="!dialogs.editDialogOpen.value" class="flex items-center gap-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-medium">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="createMode" value="new" class="text-emerald-600 focus:ring-emerald-500" />
                <span>Buat Akun & Profile Siswa Baru</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="createMode" value="existing" class="text-emerald-600 focus:ring-emerald-500" />
                <span>Pilih dari User System Unassigned ({{ users.length }})</span>
              </label>
            </div>

            <!-- Mode Edit: Display Name & Username -->
            <template v-if="dialogs.editDialogOpen.value">
              <UFormField label="Nama Lengkap Siswa">
                <UInput v-model="form.fullname" disabled class="w-full bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-80" />
              </UFormField>

              <UFormField label="Username System">
                <UInput v-model="form.username" disabled class="w-full bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-80" />
              </UFormField>
            </template>

            <!-- Mode Create Existing: Dropdown Unassigned Users -->
            <UFormField v-else-if="createMode === 'existing'" label="Akun Pengguna System" required>
              <USelect
                v-model="form.userId"
                :items="users"
                value-key="value"
                label-key="label"
                placeholder="Pilih akun pengguna yang belum terdaftar di siswa..."
                class="w-full"
              />
            </UFormField>

            <!-- Mode Create New: Full Fields -->
            <template v-if="createMode === 'new' && !dialogs.editDialogOpen.value">
              <UFormField label="Nama Lengkap Siswa" required>
                <UInput v-model="form.fullname" placeholder="Contoh: Ahmad Rizki" class="w-full" />
              </UFormField>

              <UFormField label="Username (Opsional, Default NIS)">
                <UInput v-model="form.username" placeholder="Kosongkan jika samakan dengan NIS" class="w-full" />
              </UFormField>

              <UFormField label="Password Login (Opsional)">
                <UInput v-model="form.password" type="password" placeholder="Default: Bilie#[NIS]" class="w-full" />
              </UFormField>
            </template>

            <!-- Common Field: NIS -->
            <UFormField label="NIS (Nomor Induk Siswa)" required>
              <UInput v-model="form.nis" placeholder="Contoh: 20260055" class="w-full" />
            </UFormField>
          </div>
        </form>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              @click="dialogs.editDialogOpen.value ? dialogs.closeEditDialog() : dialogs.closeCreateDialog()"
            >
              Batal
            </UButton>
            <UButton
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
