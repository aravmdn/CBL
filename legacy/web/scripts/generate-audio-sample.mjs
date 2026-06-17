import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const sampleRate = 44_100
const durationSeconds = 48
const channels = 2
const frameCount = sampleRate * durationSeconds
const bytesPerSample = 2
const dataSize = frameCount * channels * bytesPerSample
const buffer = Buffer.alloc(44 + dataSize)

function writeString(offset, value) {
  buffer.write(value, offset, value.length, 'ascii')
}

writeString(0, 'RIFF')
buffer.writeUInt32LE(36 + dataSize, 4)
writeString(8, 'WAVE')
writeString(12, 'fmt ')
buffer.writeUInt32LE(16, 16)
buffer.writeUInt16LE(1, 20)
buffer.writeUInt16LE(channels, 22)
buffer.writeUInt32LE(sampleRate, 24)
buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28)
buffer.writeUInt16LE(channels * bytesPerSample, 32)
buffer.writeUInt16LE(16, 34)
writeString(36, 'data')
buffer.writeUInt32LE(dataSize, 40)

function envelope(time) {
  const attack = Math.min(1, time / 2.5)
  const release = Math.min(1, (durationSeconds - time) / 4)
  return Math.max(0, Math.min(attack, release))
}

function noteFrequency(step) {
  const scale = [0, 3, 7, 10, 12, 15, 19, 22]
  return 110 * 2 ** (scale[step % scale.length] / 12)
}

for (let frame = 0; frame < frameCount; frame += 1) {
  const time = frame / sampleRate
  const beat = Math.sin(2 * Math.PI * 0.7 * time) * 0.5 + 0.5
  const phrase = Math.floor(time / 3)
  const base = noteFrequency(phrase)
  const shimmer = Math.sin(2 * Math.PI * (base * 4.02) * time) * 0.07
  const pad =
    Math.sin(2 * Math.PI * base * time) * 0.24 +
    Math.sin(2 * Math.PI * (base * 1.5) * time + 0.8) * 0.16 +
    Math.sin(2 * Math.PI * (base * 2.01) * time + 1.7) * 0.1
  const pulse = Math.sin(2 * Math.PI * 55 * time) * 0.16 * beat ** 5
  const breath = (Math.random() * 2 - 1) * 0.018 * (0.35 + beat)
  const value = (pad + shimmer + pulse + breath) * envelope(time)
  const left = Math.max(-1, Math.min(1, value * (0.94 + Math.sin(time * 0.23) * 0.06)))
  const right = Math.max(-1, Math.min(1, value * (0.94 + Math.cos(time * 0.2) * 0.06)))
  const offset = 44 + frame * channels * bytesPerSample

  buffer.writeInt16LE(Math.round(left * 32767), offset)
  buffer.writeInt16LE(Math.round(right * 32767), offset + bytesPerSample)
}

const outPath = resolve('public/audio/luminous-drift.wav')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, buffer)
console.log(`Wrote ${outPath}`)
