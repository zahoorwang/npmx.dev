<script setup lang="ts">
import type { JsrPackageInfo } from '#shared/types/jsr'
import type { PackageManagerId } from '~/utils/install-command'

const props = defineProps<{
  packageName: string
  requestedVersion?: string | null
  jsrInfo?: JsrPackageInfo | null
  typesPackageName?: string | null
  executableInfo?: { hasExecutable: boolean; primaryCommand?: string } | null
  createPackageInfo?: { packageName: string } | null
  /** If true, show only execute command (for binary-only packages like create-vite) */
  isBinaryOnly?: boolean
  /** If true, package uses create-* naming convention */
  isCreatePackage?: boolean
}>()

const { selectedPM, showTypesInInstall, copied, copyInstallCommand } = useInstallCommand(
  () => props.packageName,
  () => props.requestedVersion ?? null,
  () => props.jsrInfo ?? null,
  () => props.typesPackageName ?? null,
)

// Command row configuration
interface CommandRow {
  id: string
  getParts: (pmId: PackageManagerId) => string[]
  onCopy: () => void
  copied: Ref<boolean>
  comment?: string
  link?: { to: string; title: string; srText: string }
}

// Generate install command parts for a specific package manager
function getInstallPartsForPM(pmId: PackageManagerId) {
  return getInstallCommandParts({
    packageName: props.packageName,
    packageManager: pmId,
    version: props.requestedVersion,
    jsrInfo: props.jsrInfo,
  })
}

// Generate execute command parts for a specific package manager (binary-only packages)
function getExecutePartsForPM(pmId: PackageManagerId) {
  return getExecuteCommandParts({
    packageName: props.packageName,
    packageManager: pmId,
    jsrInfo: props.jsrInfo,
    isBinaryOnly: true,
    isCreatePackage: props.isCreatePackage,
  })
}

// Generate @types install command parts for a specific package manager
function getTypesInstallPartsForPM(pmId: PackageManagerId) {
  if (!props.typesPackageName) return []
  const pm = packageManagers.find(p => p.id === pmId)
  if (!pm) return []

  const devFlag = pmId === 'bun' ? '-d' : '-D'
  const pkgSpec = pmId === 'deno' ? `npm:${props.typesPackageName}` : props.typesPackageName

  return [pm.label, pm.action, devFlag, pkgSpec]
}

// Generate run command parts for a specific package manager
function getRunPartsForPM(pmId: PackageManagerId) {
  return getRunCommandParts({
    packageName: props.packageName,
    packageManager: pmId,
    jsrInfo: props.jsrInfo,
    command: props.executableInfo?.primaryCommand,
    isBinaryOnly: false,
  })
}

const { t } = useI18n()

// Generate create command parts for a specific package manager
function getCreatePartsForPM(pmId: PackageManagerId) {
  if (!props.createPackageInfo) return []
  const pm = packageManagers.find(p => p.id === pmId)
  if (!pm) return []

  const createPkgName = props.createPackageInfo.packageName
  let shortName: string
  if (createPkgName.startsWith('@')) {
    const slashIndex = createPkgName.indexOf('/')
    const name = createPkgName.slice(slashIndex + 1)
    shortName = name.startsWith('create-') ? name.slice('create-'.length) : name
  } else {
    shortName = createPkgName.startsWith('create-')
      ? createPkgName.slice('create-'.length)
      : createPkgName
  }

  return [...pm.create.split(' '), shortName]
}

// Copy handlers
const { copied: executeCopied, copy: copyExecute } = useClipboard({ copiedDuring: 2000 })
const { copied: runCopied, copy: copyRun } = useClipboard({ copiedDuring: 2000 })
const { copied: createCopied, copy: copyCreate } = useClipboard({ copiedDuring: 2000 })

function copyExecuteCommand() {
  copyExecute(
    getExecuteCommand({
      packageName: props.packageName,
      packageManager: selectedPM.value,
      jsrInfo: props.jsrInfo,
      isBinaryOnly: true,
      isCreatePackage: props.isCreatePackage,
    }),
  )
}

function copyRunCommand() {
  copyRun(
    getRunCommand({
      packageName: props.packageName,
      packageManager: selectedPM.value,
      jsrInfo: props.jsrInfo,
      command: props.executableInfo?.primaryCommand,
    }),
  )
}

function copyCreateCommand() {
  copyCreate(getCreatePartsForPM(selectedPM.value).join(' '))
}

// Build command rows based on package type

const commandRows = computed<CommandRow[]>(() => {
  const rows: CommandRow[] = []

  if (props.isBinaryOnly) {
    // Binary-only: just the execute command
    rows.push({
      id: 'execute',
      getParts: getExecutePartsForPM,
      onCopy: copyExecuteCommand,
      copied: executeCopied,
    })
  } else {
    // Regular package: install command
    rows.push({
      id: 'install',
      getParts: getInstallPartsForPM,
      onCopy: copyInstallCommand,
      copied,
    })

    // @types package (if needed)
    if (props.typesPackageName && showTypesInInstall.value) {
      rows.push({
        id: 'types',
        getParts: getTypesInstallPartsForPM,
        onCopy: copyInstallCommand, // Uses same copy as install
        copied,
        link: {
          to: `/${props.typesPackageName}`,
          title: t('package.get_started.view_types', { package: props.typesPackageName }),
          srText: `View ${props.typesPackageName}`,
        },
      })
    }

    // Run command (if package has executables)
    if (props.executableInfo?.hasExecutable) {
      rows.push({
        id: 'run',
        getParts: getRunPartsForPM,
        onCopy: copyRunCommand,
        copied: runCopied,
        comment: t('package.run.locally'),
      })
    }

    // Create command (if package has associated create-* package)
    if (props.createPackageInfo) {
      rows.push({
        id: 'create',
        getParts: getCreatePartsForPM,
        onCopy: copyCreateCommand,
        copied: createCopied,
        comment: t('package.create.title'),
        link: {
          to: `/${props.createPackageInfo.packageName}`,
          title: `View ${props.createPackageInfo.packageName}`,
          srText: `View ${props.createPackageInfo.packageName}`,
        },
      })
    }
  }

  return rows
})
</script>

<template>
  <div class="relative group">
    <!-- Terminal-style command display -->
    <div class="bg-bg-subtle border border-border rounded-lg overflow-hidden">
      <div class="flex gap-1.5 px-3 pt-2 sm:px-4 sm:pt-3">
        <span class="w-2.5 h-2.5 rounded-full bg-fg-subtle" />
        <span class="w-2.5 h-2.5 rounded-full bg-fg-subtle" />
        <span class="w-2.5 h-2.5 rounded-full bg-fg-subtle" />
      </div>
      <div class="px-3 pt-2 pb-3 sm:px-4 sm:pt-3 sm:pb-4 space-y-1 overflow-x-auto">
        <template v-for="row in commandRows" :key="row.id">
          <!-- Optional comment line (e.g., "# Run locally") -->
          <div v-if="row.comment" class="flex items-center gap-2 pt-1">
            <span class="text-fg-subtle font-mono text-sm select-none"># {{ row.comment }}</span>
          </div>

          <!-- Command for each package manager (CSS controls visibility) -->
          <div
            v-for="pm in packageManagers"
            :key="`${row.id}-${pm.id}`"
            :data-pm-cmd="pm.id"
            class="flex items-center gap-2 group/cmd min-w-0"
          >
            <span class="text-fg-subtle font-mono text-sm select-none shrink-0">$</span>
            <code class="font-mono text-sm min-w-0"
              ><span
                v-for="(part, i) in row.getParts(pm.id)"
                :key="i"
                :class="i === 0 ? 'text-fg' : 'text-fg-muted'"
                >{{ i > 0 ? ' ' : '' }}{{ part }}</span
              ></code
            >
            <!-- Copy button (hidden for @types row which has no copy) -->
            <button
              v-if="row.id !== 'types'"
              type="button"
              class="px-2 py-0.5 font-mono text-xs text-fg-muted bg-bg-subtle/80 border border-border rounded transition-colors duration-200 opacity-0 group-hover/cmd:opacity-100 hover:(text-fg border-border-hover) active:scale-95 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50"
              :aria-label="$t('package.get_started.copy_command')"
              @click.stop="row.onCopy"
            >
              <span aria-live="polite">{{
                row.copied.value ? $t('common.copied') : $t('common.copy')
              }}</span>
            </button>
            <!-- Optional link (e.g., to @types package or create-* package) -->
            <NuxtLink
              v-if="row.link"
              :to="row.link.to"
              class="text-fg-subtle hover:text-fg-muted text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/50 rounded"
              :title="row.link.title"
            >
              <span
                class="i-carbon:arrow-right rtl-flip w-3 h-3 inline-block align-middle"
                aria-hidden="true"
              />
              <span class="sr-only">{{ row.link.srText }}</span>
            </NuxtLink>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style>
/*
 * Package manager command visibility based on data-pm attribute on <html>.
 * All variants are rendered; CSS shows only the selected one.
 */

/* Hide all variants by default when preference is set */
:root[data-pm] [data-pm-cmd] {
  display: none;
}

/* Show only the matching package manager command */
:root[data-pm='npm'] [data-pm-cmd='npm'],
:root[data-pm='pnpm'] [data-pm-cmd='pnpm'],
:root[data-pm='yarn'] [data-pm-cmd='yarn'],
:root[data-pm='bun'] [data-pm-cmd='bun'],
:root[data-pm='deno'] [data-pm-cmd='deno'],
:root[data-pm='vlt'] [data-pm-cmd='vlt'] {
  display: flex;
}

/* Fallback: when no data-pm is set (SSR initial), show npm as default */
:root:not([data-pm]) [data-pm-cmd]:not([data-pm-cmd='npm']) {
  display: none;
}
</style>
