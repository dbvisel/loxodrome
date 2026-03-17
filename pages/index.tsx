import { useEffect, useMemo, useState } from 'react'
import Globe from '../components/Globe'

type RGBA = { r: number; g: number; b: number; a: number }

const rgbaToString = (color: RGBA) => `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`

const ColorPickerModal: React.FC<{
  id: string
  label: string
  color: RGBA
  onChange: (color: RGBA) => void
  isOpen: boolean
  onOpen: (id: string) => void
  onClose: () => void
}> = ({ id, label, color, onChange, isOpen, onOpen, onClose }) => {
  const rgbHex = `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`

  const handleColorChange = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    onChange({ r, g, b, a: color.a })
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{label}</span>
      <div
        onClick={() => onOpen(id)}
        style={{
          width: '32px',
          height: '32px',
          background: rgbaToString(color),
          border: '2px solid #666',
          borderRadius: '4px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
        title={label}
      />
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: 0,
            background: '#222',
            border: '1px solid #666',
            borderRadius: '4px',
            padding: '12px',
            zIndex: 1000,
            minWidth: '280px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>{label}</div>
          <input
            type="color"
            value={rgbHex}
            onChange={(e) => handleColorChange(e.target.value)}
            style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', borderRadius: '2px' }}
          />
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px' }}>Alpha:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(color.a * 100)}
              onChange={(e) => onChange({ ...color, a: Number(e.target.value) / 100 })}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '12px', minWidth: '30px' }}>{Math.round(color.a * 100)}%</span>
          </div>
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '6px',
                cursor: 'pointer',
                background: '#444',
                border: '1px solid #666',
                borderRadius: '2px',
                color: '#fff',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


const TEXT_RADIUS = 2.05
const PREFERRED_SPIRALS = 12
const MIN_SPIRALS = 0.25
const MAX_SPIRALS = 40
const SPIRAL_STEP = 0.25
const CURVE_SAMPLES = 400
const MIN_TEXT_SIZE = 0.12
const MAX_TEXT_SIZE = 0.8
const TEXT_SIZE_STEP = 0.01
// Approximate per-glyph arc footprint as a multiple of Text3D size.
const GLYPH_SPACING_FACTOR = 0.72

const estimateCurveLength = (spirals: number) => {
  const alpha = spirals * 2 // alpha in radians for phi = alpha * t
  let total = 0

  const pointAt = (u: number) => {
    const t = Math.PI / 2 - Math.PI * u
    const phi = alpha * t
    return {
      x: TEXT_RADIUS * Math.cos(t) * Math.cos(phi),
      y: TEXT_RADIUS * Math.sin(t),
      z: TEXT_RADIUS * Math.cos(t) * Math.sin(phi),
    }
  }

  let prev = pointAt(0)
  for (let i = 1; i <= CURVE_SAMPLES; i++) {
    const curr = pointAt(i / CURVE_SAMPLES)
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    const dz = curr.z - prev.z
    total += Math.hypot(dx, dy, dz)
    prev = curr
  }

  return total
}

const estimateEffectiveCharCount = (text: string) => {
  if (!text.length) return 1
  return text.split('').reduce((sum, ch) => sum + (ch === ' ' ? 0.45 : 1), 0)
}

const roundToStep = (value: number, step: number) => Math.round(value / step) * step

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const estimateRequiredSpiralsForLength = (requiredLength: number) => {
  if (requiredLength <= 0) return MIN_SPIRALS

  for (let spirals = MIN_SPIRALS; spirals <= MAX_SPIRALS; spirals += SPIRAL_STEP) {
    if (estimateCurveLength(spirals) >= requiredLength) {
      return roundToStep(spirals, SPIRAL_STEP)
    }
  }

  return MAX_SPIRALS
}

export default function Home() {
  const [text, setText] = useState<string>('Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! Hello, world! ')
  const [openPicker, setOpenPicker] = useState<string | null>(null)
  const [textColor, setTextColor] = useState<RGBA>({ r: 255, g: 255, b: 255, a: 1 })
  const [lineColor, setLineColor] = useState<RGBA>({ r: 68, g: 136, b: 255, a: 1 })
  const [sphereColor, setSphereColor] = useState<RGBA>({ r: 21, g: 101, b: 192, a: 1 })
  const [spirals, setSpirals] = useState<number>(PREFERRED_SPIRALS)
  const [textSizeSlider, setTextSizeSlider] = useState<number>(0.12)

  const effectiveChars = useMemo(() => estimateEffectiveCharCount(text), [text])
  const charGaps = Math.max(1, effectiveChars - 1)

  const textSize = useMemo(() => {
    return clamp(roundToStep(textSizeSlider, TEXT_SIZE_STEP), MIN_TEXT_SIZE, MAX_TEXT_SIZE)
  }, [textSizeSlider])

  const minReadableSpirals = useMemo(() => {
    const requiredLength = charGaps * textSize * GLYPH_SPACING_FACTOR
    return estimateRequiredSpiralsForLength(requiredLength)
  }, [charGaps, textSize])

  const minSpiralsForLegibility = Math.max(PREFERRED_SPIRALS, minReadableSpirals)

  useEffect(() => {
    setSpirals((prev) => (prev < minSpiralsForLegibility ? minSpiralsForLegibility : prev))
  }, [minSpiralsForLegibility])

  return (
    <div style={{display:'flex', flexDirection:'column', flex:1, minHeight:0}}>
      <div style={{display:'flex', gap:'12px', alignItems:'center', padding:'8px 12px', flexShrink:0, flexWrap:'wrap'}}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Edit the text that will appear on the sphere"
          style={{flex:1, minWidth:'200px', resize:'none', height:'36px', padding:'6px', fontSize:'1rem'}}
        />
        <ColorPickerModal
          id="text"
          label="Text color"
          color={textColor}
          onChange={setTextColor}
          isOpen={openPicker === 'text'}
          onOpen={setOpenPicker}
          onClose={() => setOpenPicker(null)}
        />
        <ColorPickerModal
          id="grid"
          label="Grid color"
          color={lineColor}
          onChange={setLineColor}
          isOpen={openPicker === 'grid'}
          onOpen={setOpenPicker}
          onClose={() => setOpenPicker(null)}
        />
        <ColorPickerModal
          id="sphere"
          label="Sphere color"
          color={sphereColor}
          onChange={setSphereColor}
          isOpen={openPicker === 'sphere'}
          onOpen={setOpenPicker}
          onClose={() => setOpenPicker(null)}
        />
        <label style={{display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap'}}>
          Text size: {textSize.toFixed(2)}
          <input type="range" min="0.12" max="0.8" step="0.01" value={textSizeSlider} onChange={(e) => setTextSizeSlider(Number(e.target.value))} style={{width:'180px'}} />
        </label>
        <label style={{display:'flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap'}}>
          Spirals: {spirals}
          <input type="range" min={String(minSpiralsForLegibility)} max="40" step="0.25" value={spirals} onChange={(e) => setSpirals(Number(e.target.value))} style={{width:'180px'}} />
        </label>
      </div>
      <Globe text={text} textColor={rgbaToString(textColor)} lineColor={rgbaToString(lineColor)} sphereColor={rgbaToString(sphereColor)} spirals={spirals} textSize={textSize} />
    </div>
  )
}
