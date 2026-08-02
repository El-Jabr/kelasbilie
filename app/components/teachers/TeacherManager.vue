<script setup lang="ts">
/* eslint-disable @stylistic/max-statements-per-line */
import type { TableColumn } from '@nuxt/ui'
import type { TeacherTableSchema } from '~~/shared/schemas/teacher'

const { teachers, pagination, loading, search, refresh, resetFilter, changePage } = useTeachers()
const dialogs = useTeacherDialogs()
const { creating, updating, deleting, createTeacher, updateTeacher, deleteTeacher } = useTeacherActions()
const users = ref<{ value: string, label: string }[]>([])

const createMode = ref<'existing' | 'new'>('new')

const form = reactive<{
  userId?: string
  nip: string
  fullname?: string
  username?: string
  password?: string
  role?: string
}>({
  userId: '',
  nip: '',
  fullname: '',
  username: '',
  password: '',
  role: 'TEACHER'
})

const columns: TableColumn<TeacherTableSchema>[] = [
  { accessorKey: 'nip', header: 'NIP' },
  { accessorKey: 'user.fullname', header: 'Nama Guru' },
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
      query: { unassignedFor: 'TEACHER', limit: 200 }
    })
    if (response?.data) {
      users.value = response.data.map(u => ({ value: u.id, label: `${u.fullname} (${u.username})` }))
    }
  } catch (err) {
    console.error('Gagal memuat list user unassigned guru:', err)
  }
}

watch(search, debounceRefresh)

watch(dialogs.createDialogOpen, (open) => {
  if (open) {
    Object.assign(form, { userId: '', nip: '', fullname: '', username: '', password: '', role: 'TEACHER' })
    loadUnassignedUsers()
  }
})

watch(dialogs.editDialogOpen, (open) => {
  if (open && dialogs.selectedTeacher.value) {
    const t = dialogs.selectedTeacher.value
    Object.assign(form, {
      userId: t.userId,
      nip: t.nip,
      fullname: t.user?.fullname || '',
      username: t.user?.username || ''
    })
    if (t.userId && t.user) {
      const exists = users.value.some(u => u.value === t.userId)
      if (!exists) {
        users.value.unshift({
          value: t.userId,
          label: `${t.user.fullname} (${t.user.username})`
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
    await updateTeacher({ userId: form.userId, nip: form.nip })
  } else {
    const payload = createMode.value === 'existing'
      ? { userId: form.userId, nip: form.nip }
      : { fullname: form.fullname, nip: form.nip, username: form.username, password: form.password, role: form.role }
    await createTeacher(payload as any)
  }
}
</script>

<template>
  <UCard :ui="{ body: 'p-4 sm:p-5' }">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <!-- Left Side: Search Input -->
      <div class="w-full lg:w-80">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari NIP atau nama guru..."
          class="w-full"
          size="md"
        />
      </div>

      <!-- Right Side: Action Buttons -->
      <div class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto justify-end">
        <!-- 50:50 Row on mobile for Refresh & Reset -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-refresh-cw"
            size="md"
            :loading="loading"
            class="flex-1 sm:flex-initial justify-center"
            @click="refresh"
          >
            Refresh
          </UButton>

          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-filter-x"
            size="md"
            class="flex-1 sm:flex-initial justify-center"
            @click="resetFilter"
          >
            Reset
          </UButton>
        </div>

        <!-- Full width on mobile for Import Guru -->
        <UButton
          color="primary"
          icon="i-lucide-upload"
          size="md"
          to="/super-admin/master/guru/import"
          class="w-full sm:w-auto justify-center font-semibold"
        >
          Import Guru
        </UButton>

        <!-- Full width on mobile for Tambah Guru -->
        <UButton
          color="primary"
          icon="i-lucide-plus"
          size="md"
          class="w-full sm:w-auto justify-center font-semibold"
          @click="dialogs.openCreateDialog"
        >
          Tambah Guru
        </UButton>
      </div>
    </div>
  </UCard>

  <UCard class="mt-4">
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
            {{ dialogs.editDialogOpen.value ? 'Edit Data Guru' : 'Tambah Guru Baru' }}
          </h2>
        </template>

        <form @submit.prevent="save">
          <div class="space-y-4">
            <!-- Mode Switcher (Create Only) -->
            <div v-if="!dialogs.editDialogOpen.value" class="flex items-center gap-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-medium">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="createMode" value="new" class="text-emerald-600 focus:ring-emerald-500" />
                <span>Buat Akun & Profile Guru Baru</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="createMode" value="existing" class="text-emerald-600 focus:ring-emerald-500" />
                <span>Pilih dari User System Unassigned ({{ users.length }})</span>
              </label>
            </div>

            <!-- Mode Edit: Display Name & Username -->
            <template v-if="dialogs.editDialogOpen.value">
              <UFormField label="Nama Lengkap Guru">
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
                placeholder="Pilih akun pengguna yang belum terdaftar di guru..."
                class="w-full"
              />
            </UFormField>

            <!-- Mode New: Full Fields -->
            <template v-if="createMode === 'new' && !dialogs.editDialogOpen.value">
              <UFormField label="Nama Lengkap Guru" required>
                <UInput v-model="form.fullname" placeholder="Contoh: Drs. Bambang" class="w-full" />
              </UFormField>

              <UFormField label="Username (Opsional, Default NIP)">
                <UInput v-model="form.username" placeholder="Kosongkan jika samakan dengan NIP" class="w-full" />
              </UFormField>

              <UFormField label="Password Login (Opsional)">
                <UInput v-model="form.password" type="password" placeholder="Default: Bilie#[NIP]" class="w-full" />
              </UFormField>
            </template>

            <!-- Common Field: NIP -->
            <UFormField label="NIP (Nomor Induk Pegawai)" required>
              <UInput v-model="form.nip" placeholder="Contoh: 198001012005011001" class="w-full" />
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
