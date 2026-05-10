export type DurationFormat = 'seconds' | 'minutes' | 'hours' | 'clock'

export type DurationResult = {
  seconds: number
  minutes: number
  hours: number
  clock: string
}
