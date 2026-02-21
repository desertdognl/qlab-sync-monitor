const STORAGE_KEY = 'qlab-sync-monitor-settings-v1'

const ALL_VARIABLES = [
  { id: 'e_time', titlePrefix: 'Time elapsed:', settingLabel: 'Running time elapsed (`e_time`)' },
  { id: 'r_name', titlePrefix: 'Cue name:', settingLabel: 'Cue name (`r_name`)' },
  { id: 'r_left', titlePrefix: 'Time left:', settingLabel: 'Time left (`r_left`)' },
  { id: 'n_name', titlePrefix: 'Playhead:', settingLabel: 'Playhead (`n_name`)' },
]

const VARIABLE_IDS = ALL_VARIABLES.map((variable) => variable.id)

const defaultSettings = {
  companionUrl: 'http://127.0.0.1:8000',
  pollIntervalMs: 1000,
  eTimeToleranceSeconds: 0.3,
  connectionLabels: ['qlabfb', 'qlabfb-backup'],
  selectedVariables: ['e_time', 'r_name', 'r_left'],
  variableOrder: VARIABLE_IDS,
}

const ui = {
  settingsToggle: document.getElementById('settingsToggle'),
  settingsPanel: document.getElementById('settingsPanel'),
  settingsForm: document.getElementById('settingsForm'),
  pollIntervalWarning: document.getElementById('pollIntervalWarning'),
  variableOptions: document.getElementById('variableOptions'),
  summary: document.getElementById('statusSummary'),
  buttonsContainer: document.getElementById('buttonsContainer'),
}

let settings = loadSettings()
let intervalId = null
let variableOrder = normalizeVariableOrder(settings.variableOrder)

ui.variableOptions.addEventListener('click', (event) => {
  const moveBtn = event.target.closest('.move-btn')
  if (!moveBtn) return

  const variableId = moveBtn.dataset.variableId
  const direction = moveBtn.dataset.direction
  if (!variableId || !direction) return

  const currentIndex = variableOrder.indexOf(variableId)
  if (currentIndex < 0) return

  const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (nextIndex < 0 || nextIndex >= variableOrder.length) return

  const checkedState = getCheckedStateFromDom()
  ;[variableOrder[currentIndex], variableOrder[nextIndex]] = [variableOrder[nextIndex], variableOrder[currentIndex]]
  renderVariableOptions(checkedState)
})

syncFormWithSettings(settings)
renderLoadingState()
startPolling()

ui.settingsToggle.addEventListener('click', () => {
  const isHidden = ui.settingsPanel.classList.contains('hidden')
  ui.settingsPanel.classList.toggle('hidden', !isHidden)
  ui.settingsPanel.setAttribute('aria-hidden', String(!isHidden))
  ui.settingsToggle.setAttribute('aria-expanded', String(isHidden))
})

ui.settingsForm.elements.pollIntervalMs.addEventListener('input', updatePollIntervalWarningState)
ui.settingsForm.elements.pollIntervalMs.addEventListener('change', updatePollIntervalWarningState)

ui.settingsForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const formData = new FormData(ui.settingsForm)
  const labels = [
    String(formData.get('connectionLabel1') || '').trim(),
    String(formData.get('connectionLabel2') || '').trim(),
    String(formData.get('connectionLabel3') || '').trim(),
  ].filter(Boolean)

  const selectedVariables = getSelectedVariablesInOrder()

  if (labels.length < 2) {
    window.alert('Please provide at least two connection labels.')
    return
  }

  if (!selectedVariables.length) {
    window.alert('Please select at least one variable to compare.')
    return
  }

  const nextPollIntervalMs = Math.max(250, Number(formData.get('pollIntervalMs')) || defaultSettings.pollIntervalMs)
  const pollIntervalChanged = nextPollIntervalMs !== settings.pollIntervalMs

  if (pollIntervalChanged) {
    const confirmed = window.confirm(
      'Are you sure you want to change the poll interval?\n\n1000ms is highly recommended. Other values can lead to unexpected behaviour.'
    )
    if (!confirmed) {
      return
    }
  }

  settings = {
    companionUrl: String(formData.get('companionUrl') || '').trim().replace(/\/$/, ''),
    pollIntervalMs: nextPollIntervalMs,
    eTimeToleranceSeconds: Math.max(0, Number(formData.get('eTimeToleranceSeconds')) || 0),
    connectionLabels: labels,
    selectedVariables,
    variableOrder: variableOrder.slice(),
  }

  saveSettings(settings)
  setSummary('Saved')
  startPolling()
})

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultSettings }

    const parsed = JSON.parse(raw)

    const selectedVariables =
      Array.isArray(parsed.selectedVariables) && parsed.selectedVariables.length
        ? parsed.selectedVariables.filter((variable) => VARIABLE_IDS.includes(variable))
        : defaultSettings.selectedVariables

    const variableOrder =
      Array.isArray(parsed.variableOrder) && parsed.variableOrder.length
        ? normalizeVariableOrder(parsed.variableOrder)
        : normalizeVariableOrder(selectedVariables)

    return {
      companionUrl: typeof parsed.companionUrl === 'string' ? parsed.companionUrl : defaultSettings.companionUrl,
      pollIntervalMs:
        typeof parsed.pollIntervalMs === 'number' && Number.isFinite(parsed.pollIntervalMs)
          ? parsed.pollIntervalMs
          : defaultSettings.pollIntervalMs,
      eTimeToleranceSeconds:
        typeof parsed.eTimeToleranceSeconds === 'number' && Number.isFinite(parsed.eTimeToleranceSeconds)
          ? parsed.eTimeToleranceSeconds
          : defaultSettings.eTimeToleranceSeconds,
      connectionLabels:
        Array.isArray(parsed.connectionLabels) && parsed.connectionLabels.length >= 2
          ? parsed.connectionLabels.map(String)
          : defaultSettings.connectionLabels,
      selectedVariables,
      variableOrder,
    }
  } catch {
    return { ...defaultSettings }
  }
}

function saveSettings(nextSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings))
  syncFormWithSettings(nextSettings)
}

function syncFormWithSettings(source) {
  ui.settingsForm.elements.companionUrl.value = source.companionUrl
  ui.settingsForm.elements.pollIntervalMs.value = source.pollIntervalMs
  ui.settingsForm.elements.eTimeToleranceSeconds.value = source.eTimeToleranceSeconds
  ui.settingsForm.elements.connectionLabel1.value = source.connectionLabels[0] || ''
  ui.settingsForm.elements.connectionLabel2.value = source.connectionLabels[1] || ''
  ui.settingsForm.elements.connectionLabel3.value = source.connectionLabels[2] || ''
  updatePollIntervalWarningState()

  variableOrder = normalizeVariableOrder(source.variableOrder || source.selectedVariables)
  const selectedSet = new Set(source.selectedVariables)
  const checkedState = new Map(VARIABLE_IDS.map((variableId) => [variableId, selectedSet.has(variableId)]))
  renderVariableOptions(checkedState)
}

function updatePollIntervalWarningState() {
  const pollIntervalInput = ui.settingsForm.elements.pollIntervalMs
  const pollIntervalLabel = pollIntervalInput.closest('label')

  const value = Number(pollIntervalInput.value)
  const isWarning = Number.isFinite(value) && value !== 1000

  pollIntervalInput.classList.toggle('warning', isWarning)
  if (pollIntervalLabel) {
    pollIntervalLabel.classList.toggle('warning', isWarning)
  }
  if (ui.pollIntervalWarning) {
    ui.pollIntervalWarning.classList.toggle('hidden', !isWarning)
  }
}

function renderVariableOptions(checkedState = null) {
  ui.variableOptions.innerHTML = ''

  variableOrder.forEach((variableId, index) => {
    const variable = ALL_VARIABLES.find((entry) => entry.id === variableId)
    if (!variable) return

    const row = document.createElement('div')
    row.className = 'variable-option-row'

    const checked = checkedState ? Boolean(checkedState.get(variableId)) : settings.selectedVariables.includes(variableId)

    row.innerHTML = `
      <input type="checkbox" name="selectedVariables" value="${variableId}" ${checked ? 'checked' : ''} />
      <span class="variable-option-label">${escapeHtml(variable.settingLabel)}</span>
      <span class="move-controls">
        <button type="button" class="move-btn" data-variable-id="${variableId}" data-direction="up" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="move-btn" data-variable-id="${variableId}" data-direction="down" ${index === variableOrder.length - 1 ? 'disabled' : ''}>↓</button>
      </span>
    `

    ui.variableOptions.appendChild(row)
  })
}

function getCheckedStateFromDom() {
  const state = new Map()
  ui.variableOptions.querySelectorAll('input[name="selectedVariables"]').forEach((checkbox) => {
    state.set(checkbox.value, checkbox.checked)
  })
  return state
}

function getSelectedVariablesInOrder() {
  const selected = []
  ui.variableOptions.querySelectorAll('input[name="selectedVariables"]').forEach((checkbox) => {
    if (checkbox.checked) selected.push(checkbox.value)
  })
  return selected
}

function normalizeVariableOrder(order) {
  const input = Array.isArray(order) ? order.map(String) : []
  const uniqueValid = [...new Set(input.filter((variableId) => VARIABLE_IDS.includes(variableId)))]
  const missing = VARIABLE_IDS.filter((variableId) => !uniqueValid.includes(variableId))
  return [...uniqueValid, ...missing]
}

function renderLoadingState() {
  ui.buttonsContainer.innerHTML = ''
  const primaryLabel = settings.connectionLabels[0] || ''

  settings.selectedVariables.forEach((variableId) => {
    const variable = ALL_VARIABLES.find((entry) => entry.id === variableId)
    if (!variable) return

    const card = document.createElement('button')
    card.type = 'button'
    card.disabled = true
    card.className = 'status-btn drift'
    card.innerHTML = `<span class="status-badges">${buildLabelBadgesHtml(settings.connectionLabels, primaryLabel)}</span><span class="status-title">${escapeHtml(variable.titlePrefix)} —</span><span class="status-meta">Waiting for data…</span>`
    ui.buttonsContainer.appendChild(card)
  })
}

function startPolling() {
  if (intervalId) {
    clearInterval(intervalId)
  }

  renderLoadingState()
  pollOnce()
  intervalId = setInterval(pollOnce, settings.pollIntervalMs)
}

async function pollOnce() {
  const labels = settings.connectionLabels
  const variables = settings.selectedVariables

  const requests = []
  for (const label of labels) {
    for (const variable of variables) {
      requests.push(fetchVariable(settings.companionUrl, label, variable))
    }
  }

  const settled = await Promise.all(requests)

  const valuesByVariable = Object.fromEntries(variables.map((variableId) => [variableId, []]))

  for (const item of settled) {
    valuesByVariable[item.variableId].push(item)
  }

  renderStatuses(valuesByVariable)
}

async function fetchVariable(baseUrl, label, variableId) {
  const endpoint = `${baseUrl}/api/variable/${encodeURIComponent(label)}/${encodeURIComponent(variableId)}/value`

  try {
    const response = await fetch(endpoint, { method: 'GET' })

    if (!response.ok) {
      return {
        label,
        variableId,
        ok: false,
        value: null,
        reason: `HTTP ${response.status}`,
      }
    }

    const value = (await response.text()).trim()
    return {
      label,
      variableId,
      ok: true,
      value,
      reason: '',
    }
  } catch (error) {
    return {
      label,
      variableId,
      ok: false,
      value: null,
      reason: error instanceof Error ? error.message : 'Network error',
    }
  }
}

function renderStatuses(valuesByVariable) {
  ui.buttonsContainer.innerHTML = ''
  const primaryLabel = settings.connectionLabels[0] || ''

  let allSync = true
  let anyLost = false

  for (const variableId of settings.selectedVariables) {
    const variableMeta = ALL_VARIABLES.find((variable) => variable.id === variableId)
    if (!variableMeta) continue

    const records = valuesByVariable[variableId] || []
    const lostItems = records.filter((record) => !record.ok)

    let state = 'sync'
    const valueByLabel = new Map(records.map((record) => [record.label, record]))
    const primaryRecord = valueByLabel.get(primaryLabel)

    let titleValue = primaryRecord && primaryRecord.ok ? String(primaryRecord.value) : '—'
    let detailText = settings.connectionLabels
      .map((label) => {
        const record = valueByLabel.get(label)
        if (!record || !record.ok) return `${label}: lost`
        return `${label}: ${record.value}`
      })
      .join('  |  ')

    if (lostItems.length) {
      state = 'lost'
      anyLost = true
      allSync = false
    } else {
      const values = records.map((record) => record.value)
      const inSync = checkValuesInSync(variableId, values)

      if (!inSync) {
        state = 'drift'
        allSync = false
      }
    }

    const card = document.createElement('button')
    card.type = 'button'
    card.className = `status-btn ${state}`
    card.innerHTML = `<span class="status-badges">${buildLabelBadgesHtml(settings.connectionLabels, primaryLabel)}</span><span class="status-title">${escapeHtml(variableMeta.titlePrefix)} ${escapeHtml(titleValue)}</span><span class="status-meta">${escapeHtml(detailText)}</span>`
    ui.buttonsContainer.appendChild(card)
  }

  if (anyLost) {
    setSummary('Connection lost', 'lost')
  } else if (allSync) {
    setSummary('In sync', 'sync')
  } else {
    setSummary('Out of sync', 'drift')
  }
}

function setSummary(text, state = 'neutral') {
  ui.summary.textContent = text
  ui.summary.classList.remove('neutral', 'sync', 'drift', 'lost')
  ui.summary.classList.add(state)
}

function buildLabelBadgesHtml(labels, primaryLabel) {
  return labels
    .map((label) => {
      const classes = label === primaryLabel ? 'status-badge primary' : 'status-badge'
      return `<span class="${classes}">${escapeHtml(label)}</span>`
    })
    .join('')
}

function checkValuesInSync(variableId, values) {
  if (values.length <= 1) return true

  if (variableId === 'e_time') {
    const numericValues = values.map((value) => Number(value))
    if (numericValues.every((value) => Number.isFinite(value))) {
      const min = Math.min(...numericValues)
      const max = Math.max(...numericValues)
      return max - min <= settings.eTimeToleranceSeconds
    }
  }

  if (variableId === 'r_left') {
    const numericValues = values.map((value) => Number(value))
    if (numericValues.every((value) => Number.isFinite(value))) {
      return Math.max(...numericValues) === Math.min(...numericValues)
    }
  }

  return values.every((value) => value === values[0])
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
