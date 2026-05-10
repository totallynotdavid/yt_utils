const { getVideoLength } = require('../src/index')

describe('getVideoLength', () => {
  it('should return the correct human-readable duration of the video with ID in8JE5E4NFI', async () => {
    const duration = await getVideoLength('in8JE5E4NFI')
    expect(duration).toBe('01:00:30') // El video dura 1 hora con 30 segundos
  })

  it('should return the correct duration in seconds of the video with ID in8JE5E4NFI', async () => {
    const duration = await getVideoLength('in8JE5E4NFI', 'seconds')
    expect(duration).toBe(3630) // 1 hora con 30 segundos en segundos
  })

  it('should return the correct duration in minutes of the video with ID in8JE5E4NFI', async () => {
    const duration = await getVideoLength('in8JE5E4NFI', 'minutes')
    expect(duration).toBeCloseTo(60.5) // 1 hora con 30 segundos en minutos
  })

  it('should return the correct duration in hours of the video with ID in8JE5E4NFI', async () => {
    const duration = await getVideoLength('in8JE5E4NFI', 'hours')
    expect(duration).toBeCloseTo(1.008333) // 1 hora con 30 segundos en horas
  })
})
