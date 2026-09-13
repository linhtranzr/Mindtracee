import { useEffect, useRef, useState, type PointerEvent } from 'react'

export type InkPoint = { x: number; y: number }
export type InkStroke = { color: string; width: number; points: InkPoint[] }

type Props = {
  active: boolean
  color: string
  width: number
  saved: InkStroke[]
  draft: InkStroke[]
  onDraftChange: (strokes: InkStroke[]) => void
}

export function InkCanvas({ active, color, width, saved, draft, onDraftChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef<InkStroke | null>(null)
  const [size, setSize] = useState({ width: 1, height: 1 })

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    const observer = new ResizeObserver(() => setSize({ width: parent.clientWidth, height: parent.clientHeight }))
    observer.observe(parent)
    setSize({ width: parent.clientWidth, height: parent.clientHeight })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = size.width * ratio
    canvas.height = size.height * ratio
    canvas.style.width = `${size.width}px`
    canvas.style.height = `${size.height}px`
    const context = canvas.getContext('2d')
    if (!context) return
    context.scale(ratio, ratio)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    for (const stroke of [...saved, ...draft]) {
      if (stroke.points.length < 2) continue
      context.beginPath()
      context.strokeStyle = stroke.color
      context.lineWidth = stroke.width
      context.moveTo(stroke.points[0].x * size.width, stroke.points[0].y * size.height)
      for (const point of stroke.points.slice(1)) context.lineTo(point.x * size.width, point.y * size.height)
      context.stroke()
    }
  }, [draft, saved, size])

  function point(event: PointerEvent<HTMLCanvasElement>): InkPoint {
    const box = event.currentTarget.getBoundingClientRect()
    return { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height }
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (!active) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drawing.current = { color, width, points: [point(event)] }
    onDraftChange([...draft, drawing.current])
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    drawing.current = { ...drawing.current, points: [...drawing.current.points, point(event)] }
    onDraftChange([...draft.slice(0, -1), drawing.current])
  }

  function end() {
    if (!drawing.current) return
    drawing.current = null
  }

  return <canvas ref={canvasRef} className={`ink-canvas ${active ? 'active' : ''}`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
}
