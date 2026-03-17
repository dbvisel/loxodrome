import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import * as opentype from 'opentype.js'

interface GlobeProps {
  text: string
  textColor: string
  lineColor: string
  sphereColor: string
  spirals: number
  textSize: number
}

const extractAlphaFromRgba = (rgbaString: string): number => {
  const match = rgbaString.match(/rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*([\d.]+)\s*)?\)/)
  if (match && match[1]) {
    return parseFloat(match[1])
  }
  return 1
}

const rgbFromRgba = (rgbaString: string): string => {
  const match = rgbaString.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/)
  if (match) {
    return `rgb(${match[1]}, ${match[2]}, ${match[3]})`
  }
  return rgbaString
}

const RADIUS = 2
const LINE_RADIUS = 2.01
const SEGMENTS = 64

// Points per full revolution of the spiral — higher = smoother curve.
const POINTS_PER_REVOLUTION = 40

const LoxodromeCurve = (alphaDeg: number) => {
  const alpha = THREE.MathUtils.degToRad(alphaDeg)
  // spirals = alphaDeg * π / 360; scale control points so each revolution is well-sampled.
  const spirals = alphaDeg * Math.PI / 360
  const numPoints = Math.max(200, Math.ceil(spirals * POINTS_PER_REVOLUTION))
  const points: THREE.Vector3[] = []
  for (let i = 0; i <= numPoints; i++) {
    const t = Math.PI / 2 - Math.PI * (i / numPoints)
    const phi = alpha * t
    const x = Math.cos(t) * Math.cos(phi)
    const y = Math.sin(t)
    const z = Math.cos(t) * Math.sin(phi)
    points.push(new THREE.Vector3(x, y, z))
  }
  return new THREE.CatmullRomCurve3(points)
}

const latitudePoints = (latDeg: number): [number, number, number][] => {
  const lat = THREE.MathUtils.degToRad(latDeg)
  return Array.from({ length: SEGMENTS + 1 }, (_, i) => {
    const lon = (i / SEGMENTS) * Math.PI * 2
    return [
      LINE_RADIUS * Math.cos(lat) * Math.cos(lon),
      LINE_RADIUS * Math.sin(lat),
      LINE_RADIUS * Math.cos(lat) * Math.sin(lon),
    ] as [number, number, number]
  })
}

const longitudePoints = (lonDeg: number): [number, number, number][] => {
  const lon = THREE.MathUtils.degToRad(lonDeg)
  return Array.from({ length: SEGMENTS + 1 }, (_, i) => {
    const lat = -Math.PI / 2 + (i / SEGMENTS) * Math.PI
    return [
      LINE_RADIUS * Math.cos(lat) * Math.cos(lon),
      LINE_RADIUS * Math.sin(lat),
      LINE_RADIUS * Math.cos(lat) * Math.sin(lon),
    ] as [number, number, number]
  })
}

const LAT_LINES = Array.from({ length: 12 }, (_, i) => -82.5 + i * 15)
const LON_LINES = Array.from({ length: 12 }, (_, i) => i * 30)
const FONT_URL = '/fonts/noto-serif-latin-400-normal.woff'
const BASE_TRACKING_EM = 0
// Multiplied against the advance-based center-to-center gap to tighten tracking.
const SPACING_SCALE = 0.5

type FontMetrics = {
  unitsPerEm: number
  advanceForChar: (char: string) => number
  kerningForPair: (left: string, right: string) => number
}

let cachedFontMetrics: FontMetrics | null = null

const fallbackAdvanceEm = (char: string) => {
  if (char === ' ') return 0.38
  if (/[ilI1\.,'`:;]/.test(char)) return 0.42
  if (/[mwMW@#%&]/.test(char)) return 1.15
  if (/[A-Z]/.test(char)) return 0.95
  if (/[0-9]/.test(char)) return 0.85
  return 0.8
}

const Globe: React.FC<GlobeProps> = ({ text, textColor, lineColor, sphereColor, spirals, textSize }) => {
  // Total longitude change = alpha * π, so spirals = alpha/2 → alphaDeg = spirals * 360/π
  const alphaDeg = spirals * 360 / Math.PI
  const curve = useMemo(() => LoxodromeCurve(alphaDeg), [alphaDeg])
  const [fontMetrics, setFontMetrics] = useState<FontMetrics | null>(cachedFontMetrics)

  useEffect(() => {
    if (cachedFontMetrics) {
      setFontMetrics(cachedFontMetrics)
      return
    }

    let cancelled = false
    fetch(FONT_URL)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        if (cancelled) return
        const parsed = opentype.parse(buffer)
        const unitsPerEm = parsed.unitsPerEm || 1000

        const nextMetrics: FontMetrics = {
          unitsPerEm,
          advanceForChar: (char) => {
            if (char === ' ') {
              const spaceGlyph = parsed.charToGlyph(' ')
              if (spaceGlyph && spaceGlyph.advanceWidth) {
                return spaceGlyph.advanceWidth / unitsPerEm
              }
            }

            const glyph = parsed.charToGlyph(char)
            if (glyph && glyph.advanceWidth) {
              return glyph.advanceWidth / unitsPerEm
            }

            return fallbackAdvanceEm(char)
          },
          kerningForPair: (left, right) => {
            const leftGlyph = parsed.charToGlyph(left)
            const rightGlyph = parsed.charToGlyph(right)
            if (!leftGlyph || !rightGlyph) return 0

            const raw = parsed.getKerningValue(leftGlyph, rightGlyph)
            if (!raw) return 0
            return raw / unitsPerEm
          },
        }
        cachedFontMetrics = nextMetrics
        setFontMetrics(nextMetrics)
      })
      .catch(() => {
        if (!cancelled) setFontMetrics(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const chars = useMemo(() => text.split(''), [text])
  const charTValues = useMemo(() => {
    if (chars.length <= 1) return [0.5]

    const advances = chars.map((char) => fontMetrics?.advanceForChar(char) ?? fallbackAdvanceEm(char))

    const centerGaps = Array<number>(Math.max(0, chars.length - 1)).fill(0)

    for (let i = 1; i < chars.length; i++) {
      const kernAdjust = fontMetrics?.kerningForPair(chars[i - 1], chars[i]) ?? 0
      const rawGap = ((advances[i - 1] + advances[i]) / 2 + BASE_TRACKING_EM + kernAdjust) * SPACING_SCALE
      const minGap = Math.min(advances[i - 1], advances[i]) * 0.08
      const gap = Math.max(minGap, rawGap)
      centerGaps[i - 1] = gap
    }

    const totalGap = centerGaps.reduce((sum, gap) => sum + gap, 0)
    if (!Number.isFinite(totalGap) || totalGap <= 0) {
      return chars.map((_, idx) => (chars.length === 1 ? 0.5 : idx / (chars.length - 1)))
    }

    const tValues = Array<number>(chars.length).fill(0)
    tValues[0] = 0
    let accum = 0
    for (let i = 1; i < chars.length; i++) {
      accum += centerGaps[i - 1]
      tValues[i] = accum / totalGap
    }

    // Ensure exact pole anchoring on both ends.
    tValues[0] = 0
    tValues[tValues.length - 1] = 1
    return tValues
  }, [chars, fontMetrics])

  return (
    <Canvas style={{ width: '100%', height: '100%', background: '#111' }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <mesh>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshStandardMaterial 
          color={rgbFromRgba(sphereColor)} 
          metalness={0.1} 
          roughness={0.7}
          transparent={true}
          opacity={extractAlphaFromRgba(sphereColor)}
        />
      </mesh>
      {LAT_LINES.map(lat => (
        <Line key={`lat-${lat}`} points={latitudePoints(lat)} color={lineColor} lineWidth={1} />
      ))}
      {LON_LINES.map(lon => (
        <Line key={`lon-${lon}`} points={longitudePoints(lon)} color={lineColor} lineWidth={1} />
      ))}
      {chars.map((char, idx) => {
        const t = charTValues[idx] ?? 0.5
        // Normalize to get the unit direction, then scale to just above the sphere surface
        const unitDir = curve.getPointAt(t).normalize()
        const pos = unitDir.clone().multiplyScalar(RADIUS + 0.05)

        // Build a rotation so the text face (+Z) points radially outward,
        // textRight (+X) follows the curve tangent, and textUp (+Y) is perpendicular
        // to both — so each glyph is oriented 90° to the path direction.
        const tangent = curve.getTangentAt(t)
        // Project tangent onto the sphere's tangent plane (remove radial component).
        const projected = tangent.clone().sub(unitDir.clone().multiplyScalar(unitDir.dot(tangent)))
        const tangentDir = projected.lengthSq() > 1e-10 ? projected.normalize() : new THREE.Vector3(1, 0, 0)
        const textRight = tangentDir
        const textUp = new THREE.Vector3().crossVectors(unitDir, textRight).normalize()
        const matrix = new THREE.Matrix4().makeBasis(textRight, textUp, unitDir)
        const euler = new THREE.Euler().setFromRotationMatrix(matrix)

        return (
          <Text
            key={idx}
            font={FONT_URL}
            fontSize={textSize}
            anchorX="center"
            anchorY="middle"
            color={textColor}
            position={pos.toArray() as [number, number, number]}
            rotation={euler}
          >
            {char}
          </Text>
        )
      })}
      <OrbitControls enablePan={false} enableZoom={true} enableRotate={true} />
    </Canvas>
  )
}

export default Globe
