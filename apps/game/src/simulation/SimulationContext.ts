import { storePerformanceAnalytics } from '@market-tycoon/analytics'
import { StoreScene } from '../phaser/StoreScene'

export type WeatherKind = 'sunny' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'heatwave' | 'cold'

export interface SimulationDate {
  day: number
  date: Date
  weekday: string
  dayOfMonth: number
  month: string
  year: number
  season: 'winter' | 'spring' | 'summer' | 'autumn'
  periodLabel?: string
  periodMultiplier: number
}

export interface SimulationWeather {
  kind: WeatherKind
  label: string
  icon: string
  temperature: number
  trafficMultiplier: number
  demandMultiplier: number
  detail: string
}

export interface SimulationContextSnapshot {
  calendar: SimulationDate
  weather: SimulationWeather
}

const START_DATE = new Date(2026, 0, 5)
let installed = false
let activeScene: StoreScene | null = null
let currentDay = 1
let dayStart = { cash: 0, shelfStock: 0, reserveStock: 0 }
let timer: number | undefined

export function installSimulationContext() {
  if (installed) return
  installed = true

  const originalCreate = StoreScene.prototype.create
  StoreScene.prototype.create = function createWithSimulationContext() {
    originalCreate.call(this)
    activeScene = this
    currentDay = this.day
    captureDayStart(this)
    scheduleDomRefresh()
  }

  const originalStartNextDay = StoreScene.prototype.startNextDay
  StoreScene.prototype.startNextDay = function startDayWithSimulationContext() {
    const previousDay = this.day
    originalStartNextDay.call(this)
    if (this.day === previousDay) return
    activeScene = this
    currentDay = this.day
    captureDayStart(this)
    refreshHudContext()
  }

  window.addEventListener('market-tycoon:influence-updated', refreshHudContext)
  scheduleDomRefresh()
}

export function getSimulationContext(day = currentDay): SimulationContextSnapshot {
  const calendar = getSimulationDate(day)
  return { calendar, weather: getSimulationWeather(day, calendar.season) }
}

export function getSimulationDate(day: number): SimulationDate {
  const normalizedDay = Math.max(1, Math.floor(day))
  const date = new Date(START_DATE)
  date.setDate(date.getDate() + normalizedDay - 1)
  const monthIndex = date.getMonth()
  const season = monthIndex <= 1 || monthIndex === 11 ? 'winter' : monthIndex <= 4 ? 'spring' : monthIndex <= 7 ? 'summer' : 'autumn'
  const period = getCommercialPeriod(date)
  return {
    day: normalizedDay,
    date,
    weekday: new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date),
    dayOfMonth: date.getDate(),
    month: new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date),
    year: date.getFullYear(),
    season,
    periodLabel: period?.label,
    periodMultiplier: period?.multiplier ?? 1,
  }
}

export function getSimulationWeather(day: number, season = getSimulationDate(day).season): SimulationWeather {
  const random = seededRandom(day * 97 + 41)
  const temperatureNoise = Math.round((seededRandom(day * 131 + 7) - .5) * 10)
  const definitions = season === 'winter'
    ? [weather('cloudy', 'Couvert', '☁️', 5 + temperatureNoise, .96, 1, 'Une journée grise limite légèrement les déplacements.'), weather('rain', 'Pluie', '🌧️', 7 + temperatureNoise, .88, 1.05, 'Moins de visiteurs, mais davantage d’achats de dépannage.'), weather('snow', 'Neige', '🌨️', -1 + temperatureNoise, .72, 1.14, 'La neige réduit fortement le trafic et augmente les achats de précaution.'), weather('cold', 'Grand froid', '🥶', -4 + temperatureNoise, .82, 1.1, 'Le froid favorise les paniers plus importants.'), weather('sunny', 'Éclaircies', '🌤️', 8 + temperatureNoise, 1.04, 1, 'Des éclaircies favorisent les déplacements.')]
    : season === 'summer'
      ? [weather('sunny', 'Ensoleillé', '☀️', 25 + temperatureNoise, 1.08, 1.03, 'Le beau temps soutient la fréquentation.'), weather('heatwave', 'Canicule', '🌡️', 34 + Math.abs(temperatureNoise), .94, 1.18, 'La chaleur réduit les déplacements mais stimule les produits frais et boissons.'), weather('storm', 'Orages', '⛈️', 24 + temperatureNoise, .78, 1.08, 'Les orages réduisent nettement les visites.'), weather('cloudy', 'Nuageux', '⛅', 21 + temperatureNoise, 1, 1, 'Conditions neutres pour le commerce.'), weather('rain', 'Averses', '🌦️', 19 + temperatureNoise, .9, 1.04, 'Les averses limitent les visites spontanées.')]
      : [weather('sunny', 'Ensoleillé', '☀️', 17 + temperatureNoise, 1.07, 1.01, 'Le beau temps favorise les déplacements.'), weather('cloudy', 'Nuageux', '⛅', 14 + temperatureNoise, 1, 1, 'Conditions neutres pour le commerce.'), weather('rain', 'Pluie', '🌧️', 12 + temperatureNoise, .88, 1.06, 'La pluie réduit le trafic mais renforce les achats utiles.'), weather('storm', 'Orages', '⛈️', 15 + temperatureNoise, .8, 1.08, 'Les orages pénalisent fortement la fréquentation.'), weather('cold', 'Frais', '🌬️', 8 + temperatureNoise, .95, 1.04, 'Le temps frais favorise légèrement les paniers.')]
  return definitions[Math.min(definitions.length - 1, Math.floor(random * definitions.length))]
}

function getCommercialPeriod(date: Date) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  if (month === 12 && day >= 10) return { label: 'Fêtes de fin d’année', multiplier: 1.34 }
  if (month === 1 && day <= 7) return { label: 'Après-fêtes', multiplier: .88 }
  if (month === 2 && day >= 7 && day <= 14) return { label: 'Saint-Valentin', multiplier: 1.08 }
  if (month === 4 && day >= 1 && day <= 15) return { label: 'Période de Pâques', multiplier: 1.16 }
  if (month === 6 && day >= 15) return { label: 'Début d’été', multiplier: 1.1 }
  if (month === 8 && day >= 20) return { label: 'Pré-rentrée', multiplier: 1.12 }
  if (month === 9 && day <= 15) return { label: 'Rentrée', multiplier: 1.2 }
  if (month === 10 && day >= 20) return { label: 'Halloween', multiplier: 1.1 }
  return undefined
}

function weather(kind: WeatherKind, label: string, icon: string, temperature: number, trafficMultiplier: number, demandMultiplier: number, detail: string): SimulationWeather {
  return { kind, label, icon, temperature, trafficMultiplier, demandMultiplier, detail }
}

function seededRandom(seed: number) {
  const value = Math.sin(seed) * 10_000
  return value - Math.floor(value)
}

function captureDayStart(scene: StoreScene) {
  dayStart = {
    cash: scene.simulation.metrics.cash,
    shelfStock: scene.simulation.getTotalShelfStock(),
    reserveStock: scene.simulation.getTotalReserveStock(),
  }
}

function scheduleDomRefresh() {
  if (timer) window.clearInterval(timer)
  timer = window.setInterval(refreshHudContext, 500)
  window.setTimeout(refreshHudContext, 0)
}

function refreshHudContext() {
  const scene = activeScene
  if (!scene) return
  currentDay = scene.day
  const context = getSimulationContext(scene.day)
  renderWeather(document.querySelector('.hud'), context.weather)
  renderCalendar(document.querySelector('.day-control'), context.calendar)
  renderTrends(scene)
}

function renderWeather(hud: Element | null, weatherValue: SimulationWeather) {
  if (!hud) return
  let node = hud.querySelector<HTMLElement>('[data-simulation-weather]')
  if (!node) {
    node = document.createElement('div')
    node.dataset.simulationWeather = 'true'
    node.className = 'hud-stat weather-stat'
    const shortcuts = hud.querySelector('.management-shortcuts')
    hud.insertBefore(node, shortcuts)
  }
  node.title = weatherValue.detail
  node.innerHTML = `<span>Météo</span><strong>${weatherValue.icon} ${weatherValue.temperature} °C</strong><small>${weatherValue.label}</small>`
}

function renderCalendar(dayControl: Element | null, calendar: SimulationDate) {
  if (!dayControl) return
  let node = dayControl.querySelector<HTMLElement>('[data-simulation-calendar]')
  if (!node) {
    node = document.createElement('small')
    node.dataset.simulationCalendar = 'true'
    node.className = 'simulation-calendar'
    dayControl.appendChild(node)
  }
  const dateLabel = `${capitalize(calendar.weekday)} ${calendar.dayOfMonth} ${calendar.month} ${calendar.year}`
  node.textContent = calendar.periodLabel ? `${dateLabel} · ${calendar.periodLabel}` : dateLabel
  node.title = calendar.periodLabel ? `${calendar.periodLabel} : impact trafic ×${calendar.periodMultiplier.toFixed(2)}` : dateLabel
}

function renderTrends(scene: StoreScene) {
  const stats = Array.from(document.querySelectorAll<HTMLElement>('.hud > .hud-stat:not(.weather-stat)'))
  const previous = storePerformanceAnalytics.getRecords(2).at(-1)
  const values = [
    trend(scene.simulation.metrics.cash, dayStart.cash),
    trend(scene.customers.size, previous ? previous.servedCustomers : 0),
    trend(scene.simulation.getTotalShelfStock(), dayStart.shelfStock),
    trend(scene.simulation.getTotalReserveStock(), dayStart.reserveStock),
    trend(scene.simulation.getDayRevenue(), previous?.revenue ?? 0),
  ]
  stats.slice(0, values.length).forEach((stat, index) => renderTrend(stat, values[index]))
}

function renderTrend(stat: HTMLElement, value: number) {
  let node = stat.querySelector<HTMLElement>('[data-hud-trend]')
  if (!node) {
    node = document.createElement('small')
    node.dataset.hudTrend = 'true'
    node.className = 'hud-trend'
    stat.appendChild(node)
  }
  const neutral = Math.abs(value) < .025
  node.className = `hud-trend ${neutral ? 'neutral' : value > 0 ? 'up' : 'down'}`
  node.textContent = neutral ? '→ stable' : `${value > 0 ? '↗' : '↘'} ${Math.abs(value * 100).toFixed(0)} %`
}

function trend(current: number, reference: number) {
  if (!Number.isFinite(reference) || Math.abs(reference) < .01) return 0
  return (current - reference) / Math.abs(reference)
}

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1) }
