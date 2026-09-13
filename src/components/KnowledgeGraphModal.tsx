import { useState } from 'react'
import { BookOpen, Brain, CheckCircle2, Clock, Sparkles, X, ZoomIn, ZoomOut } from 'lucide-react'

export type GraphNode = {
  id: string
  label: string
  category: 'book' | 'concept' | 'author'
  status: 'mastered' | 'forming' | 'review'
  x: number
  y: number
  bookTitle?: string
  pageNumber?: number
  excerpt?: string
}

export type GraphEdge = {
  source: string
  target: string
  label?: string
}

const initialNodes: GraphNode[] = [
  { id: 'n1', label: 'Tư Duy Nhanh Và Chậm', category: 'book', status: 'mastered', x: 220, y: 150, bookTitle: 'Tư Duy Nhanh Và Chậm', pageNumber: 24, excerpt: 'Hệ thống 1 vận hành tự động và nhanh chóng, trong khi Hệ thống 2 tập trung sự chú ý nỗ lực.' },
  { id: 'n2', label: 'Hệ thống 1 & 2', category: 'concept', status: 'mastered', x: 420, y: 100, bookTitle: 'Tư Duy Nhanh Và Chậm', pageNumber: 28, excerpt: 'Quy luật nỗ lực tối thiểu chi phối tư duy.' },
  { id: 'n3', label: 'Daniel Kahneman', category: 'author', status: 'mastered', x: 120, y: 260, bookTitle: 'Tư Duy Nhanh Và Chậm', pageNumber: 1, excerpt: 'Tác giả đoạt giải Nobel Kinh tế học.' },
  { id: 'n4', label: 'Deep Work', category: 'book', status: 'forming', x: 340, y: 280, bookTitle: 'Deep Work', pageNumber: 15, excerpt: 'Làm việc sâu là khả năng tập trung không xao nhãng vào nhiệm vụ đòi hỏi tư duy cao.' },
  { id: 'n5', label: 'Giao trình Content AI', category: 'book', status: 'mastered', x: 540, y: 220, bookTitle: 'Giao trình Content AI Facebook TikTok', pageNumber: 2, excerpt: 'Loại bỏ câu chung chung và tính từ phô trương không minh chứng.' },
  { id: 'n6', label: 'Authentic Voice', category: 'concept', status: 'forming', x: 680, y: 140, bookTitle: 'Giao trình Content AI Facebook TikTok', pageNumber: 4, excerpt: 'Giọng văn tự nhiên chân thật giúp giữ chân độc giả.' },
  { id: 'n7', label: 'Law of Least Effort', category: 'concept', status: 'review', x: 480, y: 360, bookTitle: 'Tư Duy Nhanh Và Chậm', pageNumber: 72, excerpt: 'Bộ não ưu tiên con đường tiết kiệm năng lượng nhất.' }
]

const initialEdges: GraphEdge[] = [
  { source: 'n3', target: 'n1', label: 'Tác giả' },
  { source: 'n1', target: 'n2', label: 'Chương 1' },
  { source: 'n2', target: 'n7', label: 'Liên kết nhận thức' },
  { source: 'n1', target: 'n4', label: 'So sánh tư duy' },
  { source: 'n5', target: 'n6', label: 'Chương 2' },
  { source: 'n4', target: 'n7', label: 'Sức bền chú ý' }
]

export function KnowledgeGraphModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(initialNodes[0])
  const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'forming' | 'review'>('all')
  const [zoomLevel, setZoomLevel] = useState(1)

  if (!isOpen) return null

  const filteredNodes = initialNodes.filter((node) => filterStatus === 'all' || node.status === filterStatus)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0, 21, 60, 0.55)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          height: '680px',
          background: '#F9F9F7',
          border: '1px solid var(--border-solid)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ background: '#FFFFFF', borderBottom: '1px solid var(--border-solid)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#00153C', color: '#FAE100', display: 'grid', placeItems: 'center' }}>
              <Brain size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 800, color: '#00153C', margin: 0 }}>
                Đồ thị Ý niệm & Mạng lưới Tri thức (Semantic Mind Graph)
              </h3>
              <span style={{ fontSize: '11px', color: '#747781' }}>Trực quan hóa mối liên hệ giữa các tác phẩm & khái niệm trong thư viện</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', background: '#F4F4F2', padding: '3px', borderRadius: '8px', fontSize: '12px' }}>
              <button
                style={{ border: 0, background: filterStatus === 'all' ? '#00153C' : 'transparent', color: filterStatus === 'all' ? '#FFF' : '#444650', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setFilterStatus('all')}
              >
                Tất cả ({initialNodes.length})
              </button>
              <button
                style={{ border: 0, background: filterStatus === 'mastered' ? '#185E48' : 'transparent', color: filterStatus === 'mastered' ? '#FFF' : '#444650', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setFilterStatus('mastered')}
              >
                Nắm chắc
              </button>
              <button
                style={{ border: 0, background: filterStatus === 'forming' ? '#D39E00' : 'transparent', color: filterStatus === 'forming' ? '#FFF' : '#444650', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => setFilterStatus('forming')}
              >
                Đang hình thành
              </button>
            </div>

            <button
              style={{ border: 0, background: 'transparent', color: '#747781', cursor: 'pointer' }}
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body Canvas & Side Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: '100%', overflow: 'hidden' }}>
          {/* SVG Graph Canvas */}
          <div style={{ position: 'relative', background: '#F9F9F7', overflow: 'hidden' }}>
            {/* Zoom Controls */}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10, display: 'flex', gap: '6px', background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '8px', padding: '4px' }}>
              <button style={{ border: 0, background: 'transparent', padding: '4px', cursor: 'pointer' }} onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}>
                <ZoomIn size={16} />
              </button>
              <span style={{ fontSize: '12px', fontWeight: 600, display: 'grid', placeItems: 'center', padding: '0 6px' }}>{Math.round(zoomLevel * 100)}%</span>
              <button style={{ border: 0, background: 'transparent', padding: '4px', cursor: 'pointer' }} onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}>
                <ZoomOut size={16} />
              </button>
            </div>

            <svg
              width="100%"
              height="100%"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}
            >
              {/* Grid dots */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="15" cy="15" r="1.2" fill="#E2E3E1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Render Edges */}
              {initialEdges.map((edge, idx) => {
                const sourceNode = initialNodes.find((n) => n.id === edge.source)
                const targetNode = initialNodes.find((n) => n.id === edge.target)
                if (!sourceNode || !targetNode) return null

                return (
                  <g key={idx}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke="#CBD5E1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </g>
                )
              })}

              {/* Render Nodes */}
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id
                const color =
                  node.status === 'mastered' ? '#185E48' : node.status === 'forming' ? '#D39E00' : '#8A671F'
                const bgColor =
                  node.status === 'mastered' ? '#ADF1D4' : node.status === 'forming' ? '#FFFDF0' : '#F8E9E6'

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      r={isSelected ? 26 : 22}
                      fill={bgColor}
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                      style={{ transition: 'all 0.15s ease' }}
                    />
                    {node.category === 'book' ? (
                      <BookOpen size={16} x={-8} y={-8} color={color} />
                    ) : node.category === 'author' ? (
                      <Brain size={16} x={-8} y={-8} color={color} />
                    ) : (
                      <Sparkles size={16} x={-8} y={-8} color={color} />
                    )}
                    <text
                      y={36}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight={isSelected ? 800 : 600}
                      fill="#00153C"
                      fontFamily="var(--font-sans)"
                    >
                      {node.label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Side Details Drawer */}
          <div style={{ background: '#FFFFFF', borderLeft: '1px solid var(--border-solid)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {selectedNode ? (
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: selectedNode.status === 'mastered' ? '#ADF1D4' : '#FFFDF0',
                    color: selectedNode.status === 'mastered' ? '#185E48' : '#8A671F',
                    display: 'inline-block',
                    marginBottom: '12px'
                  }}
                >
                  ● {selectedNode.status === 'mastered' ? 'Nắm chắc 83.3%' : 'Đang hình thành'}
                </span>

                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 800, color: '#00153C', margin: '0 0 10px' }}>
                  {selectedNode.label}
                </h3>

                <p style={{ fontSize: '13px', color: '#747781', margin: '0 0 16px' }}>
                  Tác phẩm: <strong>{selectedNode.bookTitle}</strong> • Trang {selectedNode.pageNumber}
                </p>

                <div style={{ background: '#F9F9F7', border: '1px solid var(--border-solid)', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#8A671F', display: 'block', marginBottom: '6px' }}>
                    Nội dung trích dẫn khảo chứng:
                  </span>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', lineHeight: 1.6, color: '#1A1C1B', margin: 0 }}>
                    “{selectedNode.excerpt}”
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#444650' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={14} style={{ color: '#185E48' }} /> Đồng hóa 3 kết nối tri thức
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={14} style={{ color: '#8A671F' }} /> Lần hồi tưởng gần nhất: 2 ngày trước
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#747781', fontSize: '13px', textAlign: 'center', paddingTop: '40px' }}>
                Nhấp vào một nút trên đồ thị để xem thông tin trích dẫn chi tiết
              </div>
            )}

            <button
              className="primary-button"
              style={{ width: '100%', minHeight: '42px', fontSize: '13px', justifyContent: 'center' }}
              onClick={onClose}
            >
              Đóng không gian đồ thị
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
