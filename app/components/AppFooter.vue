<script setup lang="ts">
</script>

<template>
  <USeparator
    icon="i-simple-icons-nuxtdotjs"
    class="h-px"
  />

  <UFooter :ui="{ top: 'border-b border-default' }">
    <template #top>
      <UContainer>
        <div class="space-y-1 text-sm text-muted flex flex-col gap-0.5">
          <NuxtImg
            src="/logo.png"
            width="225"
            height="75"
            alt="SMP BILIE Logo"
            class="-ml-3"
          />
          <p class="text-lg font-semibold">
            SMP Bilingual Terpadu 2 (BILIE)
          </p>
          <p>Pesantren Modern Al-Amanah Junwangi</p>

          <div class="pt-2">
            <p class="text-lg font-semibold">
              Management Office
            </p>
            <p>Jl. Junwangi No. 43C, Krian, Sidoarjo</p>
            <p>WhatsApp: 0813-9995-2020</p>
            <p>Email: humas@smpbilingualterpadu2.sch.id</p>
          </div>
        </div>
      </UContainer>
    </template>

    <template #left>
      <p class="text-muted text-sm">
        Build • © {{ new Date().getFullYear() }}
      </p>
    </template>

    <template #right>
      <UButton
        to="https://www.instagram.com/smp_bilie"
        target="_blank"
        icon="i-simple-icons-instagram"
        aria-label="SMP Bilie on Instagram"
        color="neutral"
        variant="ghost"
      />
      <UButton
        to="https://www.tiktok.com/@smp_bilie"
        target="_blank"
        icon="i-simple-icons-tiktok"
        aria-label="SMP Bilie on TikTok"
        color="neutral"
        variant="ghost"
      />
      <UButton
        to="https://www.youtube.com/@smp_bilie"
        target="_blank"
        icon="i-simple-icons-youtube"
        aria-label="SMP Bilie on YouTube"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
