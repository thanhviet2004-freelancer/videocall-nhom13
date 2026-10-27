import React, { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer
} from '@livekit/components-react';
import { auth, googleProvider, githubProvider } from './firebase.js';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const members = [
  { name: 'Nguyễn Tiến Đạt', mssv: 'DH52200487' },
  { name: 'Lê Thanh Việt', mssv: 'DH52201750' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [connection, setConnection] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setAuthReady(true);
    if (!currentUser) setConnection(null);
  }), []);

  async function login(provider) {
    setError('');
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError(friendlyAuthError(e));
    }
  }

  async function joinRoom() {
    if (!user) {
      setError('Bạn cần đăng nhập trước khi vào phòng.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const idToken = await user.getIdToken(true);
      const response = await fetch(`${API_BASE}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Không thể cấp token phòng gọi.');
      setConnection(data);
    } catch (e) {
      setError(e.message || 'Không thể kết nối máy chủ.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setConnection(null);
    await signOut(auth);
  }

  if (connection && user) {
    return (
      <main className="call-page">
        <header className="call-header">
          <div>
            <p className="eyebrow">NHÓM 13 · PHÒNG CHUNG</p>
            <h1>Cuộc gọi video</h1>
            <p className="muted">Đang tham gia với tên {user.displayName || user.email}</p>
          </div>
          <button className="button secondary" onClick={() => setConnection(null)}>Thoát phòng</button>
        </header>
        <section className="conference">
          <LiveKitRoom
            serverUrl={connection.serverUrl}
            token={connection.token}
            connect={true}
            video={true}
            audio={true}
            onDisconnected={() => setConnection(null)}
            onError={(e) => setError(`LiveKit: ${e.message}`)}
            data-lk-theme="default"
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </section>
        {error && <p className="error" role="alert">{error}</p>}
      </main>
    );
  }

  return (
    <main className="page">
      <nav className="topbar">
        <a className="brand" href="#" aria-label="VideoCall Nhóm 13">
          <span className="brand-icon">▶</span> VideoCall
        </a>
        {user ? (
          <div className="account">
            {user.photoURL && <img src={user.photoURL} alt="" className="avatar" />}
            <span>{user.displayName || user.email}</span>
            <button className="button small secondary" onClick={logout}>Đăng xuất</button>
          </div>
        ) : <span className="status"><i /> Video call trực tuyến</span>}
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="pill"><span className="live-dot" /> LIVE VIDEO · NHÓM 13</span>
          <h1>Kết nối mọi người,<br /><span>chỉ bằng một cuộc gọi.</span></h1>
          <p className="lead">Đăng nhập bằng tài khoản của bạn, tham gia phòng chung và trò chuyện trực tiếp qua camera và micro.</p>
          {!authReady ? <p className="muted">Đang kiểm tra trạng thái đăng nhập…</p> : user ? (
            <div className="signed-in">
              <div className="signed-user">
                {user.photoURL ? <img src={user.photoURL} alt="" className="avatar large" /> : <div className="avatar-fallback">{(user.displayName || user.email || 'U')[0].toUpperCase()}</div>}
                <div><strong>Xin chào, {user.displayName || user.email}</strong><small>Đã xác thực tài khoản thành công</small></div>
              </div>
              <button className="button primary join-button" disabled={busy} onClick={joinRoom}>{busy ? 'Đang kết nối…' : 'Vào phòng chung'} <span>→</span></button>
            </div>
          ) : (
            <div className="login-panel">
              <p className="login-title">Đăng nhập để bắt đầu</p>
              <button className="button oauth google" onClick={() => login(googleProvider)}><GoogleIcon /> Tiếp tục với Google</button>
              <button className="button oauth github" onClick={() => login(githubProvider)}><GitHubIcon /> Tiếp tục với GitHub</button>
              <small className="muted">Bạn cần đăng nhập trước khi tham gia cuộc gọi.</small>
            </div>
          )}
          {error && <p className="error" role="alert">{error}</p>}
        </div>

        <div className="visual">
          <div className="visual-glow" />
          <div className="mock-window">
            <div className="mock-top"><div className="window-dots"><i/><i/><i/></div><span>NHOM-13 / PHONG-CHUNG</span><span className="secure">● KẾT NỐI</span></div>
            <div className="mock-grid">
              <div className="mock-person person-one"><div className="person-avatar blue">Đ</div><span>Nguyễn Tiến Đạt</span><b>●</b></div>
              <div className="mock-person person-two"><div className="person-avatar violet">V</div><span>Lê Thanh Việt</span><b>●</b></div>
              <div className="mock-person person-three"><div className="person-avatar mint">+</div><span>Thành viên</span><b>○</b></div>
              <div className="mock-person person-four"><div className="sound-wave">〰</div><span>Âm thanh rõ nét</span></div>
            </div>
            <div className="mock-controls"><span>▣</span><span>♬</span><span className="hangup">☎</span><span>▤</span></div>
          </div>
          <div className="floating-note"><span className="check">✓</span><div><strong>Phòng gọi chung</strong><small>LiveKit · WebRTC</small></div></div>
        </div>
      </section>

      <section className="group-section">
        <div className="section-heading"><div><p className="eyebrow">THÔNG TIN DỰ ÁN</p><h2>Thành viên nhóm</h2></div><span className="member-count">02 THÀNH VIÊN</span></div>
        <div className="member-list">
          {members.map((member, index) => (
            <article className="member-card" key={member.mssv}>
              <div className={`member-avatar color-${index}`}>{member.name.split(' ').slice(-1)[0][0]}</div>
              <div className="member-info"><strong>{member.name}</strong><span>MSSV: {member.mssv}</span></div>
              <span className="member-badge">Nhóm 13</span>
            </article>
          ))}
        </div>
      </section>

      <footer><span>© 2026 VideoCall Nhóm 13</span><span>React · Firebase Auth · LiveKit</span></footer>
    </main>
  );
}

function friendlyAuthError(error) {
  if (error.code === 'auth/popup-closed-by-user') return 'Bạn đã đóng cửa sổ đăng nhập trước khi hoàn tất.';
  if (error.code === 'auth/unauthorized-domain') return 'Domain hiện tại chưa được thêm vào Firebase Authorized domains.';
  if (error.code === 'auth/account-exists-with-different-credential') return 'Email này đã được đăng ký bằng một phương thức đăng nhập khác.';
  return error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
}

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="oauth-icon"><path fill="#4285F4" d="M21.6 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.44l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.88a6 6 0 0 1 0-3.76v-2.6H3.06a10 10 0 0 0 0 8.96l3.35-2.6Z"/><path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.52l3.35 2.6C7.2 7.74 9.4 5.98 12 5.98Z"/></svg>;
}
function GitHubIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="oauth-icon"><path fill="currentColor" d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.1c-3.1.68-3.75-1.32-3.75-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 .1.76 2.04 3.6 1.56.1-.72.4-1.2.72-1.48-2.47-.28-5.07-1.24-5.07-5.5 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.27-2.6 5.21-5.08 5.49.4.35.76 1.02.76 2.06v3.05c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/></svg>;
}
