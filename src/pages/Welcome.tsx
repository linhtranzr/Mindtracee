import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Brain,
  Database,
  Feather,
  FileText,
  Lock,
  Sparkles,
  Zap
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'

export function Welcome() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleEnterApp = () => {
    if (user) {
      navigate('/today')
    } else {
      navigate('/sign-in')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9F9F7', color: '#1A1C1B', fontFamily: 'var(--font-sans)' }}>
      {/* 1. Header Tĩnh Lặng (Top Navigation Bar) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(249, 249, 247, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-solid)',
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(20px, 5vw, 60px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#00153C', color: '#FAE100', display: 'grid', placeItems: 'center' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 800, color: '#00153C', letterSpacing: '-0.02em', display: 'block', lineHeight: 1 }}>
              MindTrace
            </span>
            <span style={{ fontSize: '10px', color: '#747781', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Sổ tay tri thức & Bản đồ nhận thức
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!user && (
            <button
              style={{ border: 0, background: 'transparent', color: '#8A671F', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              onClick={() => navigate('/sign-up')}
            >
              Đăng ký
            </button>
          )}
          <button
            style={{ border: 0, background: 'transparent', color: '#00153C', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
            onClick={() => navigate(user ? '/today' : '/sign-in')}
          >
            {user ? 'Bàn làm việc' : 'Đăng nhập'}
          </button>
          <button
            style={{
              background: '#FAE100',
              color: '#504700',
              border: '1px solid #DEC800',
              borderRadius: '9px',
              padding: '9px 18px',
              fontWeight: 800,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(250, 225, 0, 0.25)'
            }}
            onClick={handleEnterApp}
          >
            <Sparkles size={15} /> {user ? 'Vào ứng dụng' : 'Vào ứng dụng'}
          </button>
        </div>
      </header>

      {/* 2. Hero Section (Khối Hero Điểm Tựa Nhận Thức) */}
      <section style={{ maxWidth: '1080px', margin: '0 auto', padding: '72px 24px 60px', textAlign: 'center' }}>
        <span
          className="badge-tag"
          style={{
            background: '#F4F4F2',
            color: '#8A671F',
            border: '1px solid #DEC800',
            padding: '6px 14px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            marginBottom: '24px',
            display: 'inline-block'
          }}
        >
          PHƯƠNG PHÁP ĐỌC SÂU DỰA TRÊN BẰNG CHỨNG (EVIDENCE-BASED COGNITION)
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(36px, 5.5vw, 56px)',
            fontWeight: 800,
            color: '#00153C',
            lineHeight: 1.12,
            letterSpacing: '-0.03em',
            margin: '0 auto 24px',
            maxWidth: '900px'
          }}
        >
          Từ trang sách lật qua, thành nhận thức ở lại.
        </h1>

        <p style={{ fontSize: '18px', lineHeight: 1.7, color: '#444650', maxWidth: '720px', margin: '0 auto 36px' }}>
          MindTrace giúp bạn vượt qua ảo tưởng hiểu biết (<em>Illusion of Explanatory Depth</em>). Tuyệt đối không dùng streak ảo hay điểm số hào nhoáng — chỉ tập trung vào sự tĩnh lặng, trung thực và bằng chứng nhận thức thực sự.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            style={{
              background: '#00153C',
              color: '#FFFFFF',
              border: 0,
              borderRadius: '10px',
              padding: '16px 32px',
              fontWeight: 700,
              fontSize: '15px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(0, 21, 60, 0.18)'
            }}
            onClick={handleEnterApp}
          >
            Khám phá không gian tri thức <ArrowRight size={18} />
          </button>
          <button
            className="secondary-button"
            style={{ minHeight: '50px', padding: '0 26px', fontSize: '15px' }}
            onClick={() => navigate(user ? '/today' : '/sign-up')}
          >
            {user ? 'Vào ứng dụng' : 'Đăng ký tài khoản'}
          </button>
        </div>
      </section>

      {/* 3. Visual Comparison Matrix (Bảng Đối Chiếu Thực Chứng Trực Quan) */}
      <section style={{ maxWidth: '1080px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', fontWeight: 800, color: '#00153C', margin: 0 }}>
            Khảo chứng sự chuyển hóa nhận thức
          </h2>
          <p style={{ fontSize: '14px', color: '#747781', margin: '6px 0 0' }}>
            Đối chiếu giữa thói quen đọc thụ động truyền thống và quy trình Active Retrieval của MindTrace
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Card A: Traditional Passive Reading */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '16px', padding: '32px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A4433F' }}>
              Đọc thụ động (Truyền thống)
            </span>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: '#1A1C1B', margin: '10px 0 16px' }}>
              Bẫy Quen Mắt Giả Tạo
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: 1.7, color: '#444650', margin: '0 0 24px' }}>
              <li style={{ marginBottom: '10px' }}>Tô sáng (highlight) tràn lan nhưng không tự diễn đạt lại.</li>
              <li style={{ marginBottom: '10px' }}>Cảm giác “đã hiểu” khi đọc trôi chảy (Fluency Illusion).</li>
              <li>Suy giảm liên kết tự nhiên, phai nhạt kiến thức nhanh chóng.</li>
            </ul>
            <div style={{ background: '#F8E9E6', border: '1px solid #E0B2AA', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#A4433F' }}>
                Tỷ lệ bảo toàn sau 7 ngày: <strong style={{ fontSize: '18px' }}>&lt; 15%</strong>
              </span>
            </div>
          </div>

          {/* Card B: MindTrace Active Retrieval */}
          <div style={{ background: '#FFFFFF', border: '1px solid #00153C', borderTop: '4px solid #00153C', borderRadius: '16px', padding: '32px', boxShadow: '0 8px 30px rgba(0,21,60,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#185E48' }}>
                Quy trình MindTrace
              </span>
              <span className="badge-mastered">Standard Protocol</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: '#00153C', margin: '10px 0 16px' }}>
              Active Recall & Evidence
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#1A1C1B', margin: '0 0 24px' }}>
              <div style={{ background: '#F9F9F7', border: '1px solid var(--border-solid)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Feather size={15} style={{ color: '#8A671F' }} /> 1. Nghỉ một nhịp & Lắng đọng
              </div>
              <div style={{ background: '#F9F9F7', border: '1px solid var(--border-solid)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={15} style={{ color: '#00153C' }} /> 2. Tự hồi tưởng tích cực (Free Recall)
              </div>
              <div style={{ background: '#F9F9F7', border: '1px solid var(--border-solid)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} style={{ color: '#D39E00' }} /> 3. Phản chiếu & Phân tích lệch góc nhìn
              </div>
            </div>
            <div style={{ background: 'rgba(173,241,212,0.35)', border: '1px solid #185E48', borderRadius: '10px', padding: '12px 16px', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#185E48' }}>
                Tỷ lệ đồng hóa chuẩn chứng: <strong style={{ fontSize: '18px' }}>&gt; 83.3%</strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 3 Core Pillars (3 Cột Trụ Triết Lý) */}
      <section style={{ background: '#F4F4F2', borderTop: '1px solid var(--border-solid)', borderBottom: '1px solid var(--border-solid)', padding: '72px 24px' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p className="eyebrow">TRIẾT LÝ SẢN PHẨM MINH BẠCH</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 800, color: '#00153C', margin: 0 }}>
              Ba Cột Trụ Của MindTrace
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FFFDF0', color: '#8A671F', display: 'grid', placeItems: 'center', marginBottom: '18px' }}>
                <Lock size={22} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: '#00153C', margin: '0 0 10px' }}>
                1. Không Gamification Ảo
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#444650', margin: 0 }}>
                Tuyệt đối loại bỏ điểm số ảo, streak áp lực và huy hiệu hào nhoáng. MindTrace dành cho những độc giả coi việc đọc là hành trình tĩnh lặng, chân thực.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F4F4F2', color: '#00153C', display: 'grid', placeItems: 'center', marginBottom: '18px' }}>
                <Database size={22} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: '#00153C', margin: '0 0 10px' }}>
                2. Nhật Ký Khảo Chứng Bất Biến
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#444650', margin: 0 }}>
                Nhật ký khảo chứng (Append-Only Evidence Ledger) lưu giữ nguyên vẹn mọi dấu vết tự hồi tưởng, giúp bạn theo dõi lộ trình thẩm thấu tri thức theo thời gian.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-solid)', borderRadius: '14px', padding: '28px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(173,241,212,0.35)', color: '#185E48', display: 'grid', placeItems: 'center', marginBottom: '18px' }}>
                <FileText size={22} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 700, color: '#00153C', margin: '0 0 10px' }}>
                3. Tàu Giấy Tĩnh Lặng (Paper Vessel)
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#444650', margin: 0 }}>
                Không gian đọc nguyên tác tối đa 720px chuẩn khổ sách in cổ điển, giảm thiểu phân tâm thị giác để nhịp thở tâm trí luôn đồng điệu cùng trang sách.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Literary Quote Section (Trích Đoạn Cổ Điển) */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <Feather size={28} style={{ color: '#8A671F', marginBottom: '20px' }} />
        <blockquote style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '22px', lineHeight: 1.65, color: '#00153C', margin: '0 0 20px' }}>
          “Đọc sách thực sự là quá trình tự thách thức tư duy và tái cấu trúc hiểu biết của chính bạn. Không có cuốn sách tốt nào mang lại sự hiểu biết sâu sắc mà không đòi hỏi nỗ lực hồi tưởng chủ động từ người đọc.”
        </blockquote>
        <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#747781' }}>
           Mortimer J. Adler — Tác giả cuốn "How to Read a Book"
        </span>
      </section>

      {/* 6. Bottom CTA Card */}
      <section style={{ maxWidth: '1080px', margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ background: '#00153C', color: '#FFFFFF', borderRadius: '20px', padding: '56px 40px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,21,60,0.2)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 800, margin: '0 0 16px' }}>
            Sẵn sàng bắt đầu phiên đọc tĩnh lặng?
          </h2>
          <p style={{ fontSize: '16px', color: '#DCE6E0', maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Khám phá ngay không gian học thuật Quiet Luxury và xây dựng Bản đồ hiểu biết chủ động cho riêng bạn.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              style={{
                background: '#FAE100',
                color: '#504700',
                border: '1px solid #DEC800',
                borderRadius: '10px',
                padding: '14px 28px',
                fontWeight: 800,
                fontSize: '15px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={handleEnterApp}
            >
              <Zap size={18} /> 1-Chạm trải nghiệm tức thì
            </button>
            <button
              style={{
                background: 'transparent',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '10px',
                padding: '14px 24px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
              onClick={handleEnterApp}
            >
              {user ? 'Vào ứng dụng' : 'Đăng nhập độc giả'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-solid)', padding: '24px 0', textAlign: 'center', fontSize: '12px', color: '#747781' }}>
        <p style={{ margin: 0 }}>MindTrace v2 • Sổ tay tri thức & Bản đồ nhận thức chủ động • Quiet Luxury Editorial Standard</p>
      </footer>
    </div>
  )
}
