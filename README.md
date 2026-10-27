# VideoCall Nhóm 13

Website gọi video thật bằng React + Vite, Firebase Authentication (Google/GitHub), Node.js/Express và LiveKit Cloud.

## Thành viên
- Nguyễn Tiến Đạt — DH52200487
- Lê Thanh Việt — DH52201750

## Yêu cầu
- Node.js LTS (khuyến nghị 20 hoặc 22)
- Tài khoản Firebase, LiveKit Cloud, GitHub và Vercel/Render để deploy
- VS Code

## 1. Cấu hình Firebase OAuth
1. Vào https://console.firebase.google.com/ tạo project.
2. Authentication → Get started → Sign-in method, bật Google.
3. Bật GitHub. Tạo OAuth App ở https://github.com/settings/developers → OAuth Apps.
   - Authorization callback URL: lấy chính xác URL Firebase hiển thị trong cấu hình GitHub provider, thường là `https://YOUR-PROJECT.firebaseapp.com/__/auth/handler`.
   - Sao chép Client ID và Client Secret từ GitHub vào Firebase provider rồi Save.
4. Authentication → Settings → Authorized domains: thêm `localhost` và domain frontend sau khi deploy.
5. Project settings → General → Your apps → Web app. Sao chép Firebase config vào `frontend/.env`.

## 2. Cấu hình LiveKit
1. Tạo project tại https://cloud.livekit.io/
2. Sao chép WebSocket URL (thường bắt đầu `wss://`), API Key và API Secret.
3. API Secret chỉ đặt trong backend `.env`, KHÔNG đặt trong frontend hoặc bất kỳ biến `VITE_*` nào.

## 3. Chạy local trên Windows/VS Code
Mở folder `videocall-nhom13` trong VS Code. Mở 2 terminal.

### Backend
```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```
Điền `backend/.env` trước khi chạy:
- `PORT=3001`
- `FRONTEND_ORIGIN=http://localhost:5173`
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` từ LiveKit
- `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON của service account Firebase Admin SDK, dạng một dòng JSON.
  Lấy tại Firebase Console → Project settings → Service accounts → Generate new private key.
  Giữ bí mật file JSON; không commit hoặc gửi vào nhóm chat công khai.

### Frontend
Mở terminal thứ hai:
```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```
Điền `frontend/.env` bằng Firebase web config và:
`VITE_API_BASE_URL=http://localhost:3001`
Mở `http://localhost:5173`.

## 4. Kiểm tra
1. Đăng nhập Google hoặc GitHub.
2. Bấm “Vào phòng chung”; trình duyệt sẽ hỏi quyền camera/micro.
3. Mở link local bằng trình duyệt thứ hai hoặc thiết bị khác và đăng nhập tài khoản thứ hai.
4. Hai người sẽ thấy video/âm thanh của nhau trong cùng phòng. Đảm bảo dùng HTTPS khi deploy (localhost được trình duyệt cho phép camera).

## 5. Deploy
### Backend lên Render
1. Push dự án lên GitHub.
2. Render → New → Web Service, chọn repo và Root Directory `backend`.
3. Build Command: `npm install`; Start Command: `npm start`.
4. Thêm Environment Variables:
   - `PORT` (Render tự cấp; có thể bỏ)
   - `FRONTEND_ORIGIN` = URL frontend Vercel, ví dụ `https://ten-du-an.vercel.app`
   - `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = toàn bộ service-account JSON trên một dòng
5. Deploy và kiểm tra `https://YOUR-BACKEND.onrender.com/health` trả về `{"ok":true}`.

### Frontend lên Vercel
1. Vercel → Add New → Project → import repo.
2. Root Directory chọn `frontend`.
3. Thêm biến môi trường `VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com`.
4. Thêm các biến Firebase `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
5. Deploy. Sao chép URL Vercel, thêm URL đó vào Firebase Authentication → Settings → Authorized domains.
6. Cập nhật `FRONTEND_ORIGIN` trên Render bằng URL Vercel chính xác rồi redeploy backend.

## 6. Lưu ý bảo mật và vận hành
- Không commit `.env`, private key Firebase hoặc LiveKit API Secret.
- Backend xác minh Firebase ID token trước khi cấp LiveKit token.
- Token LiveKit chỉ cấp quyền tham gia phòng `nhom-13-phong-chung` và có thời hạn.
- Tên hiển thị lấy từ Firebase user đã xác thực; danh sách thành viên nhóm trên trang chủ là thông tin cố định theo yêu cầu bài tập.
- Nếu OAuth báo `unauthorized-domain`, thêm domain đang dùng vào Firebase Authorized domains.
- Nếu GitHub login lỗi, kiểm tra callback URL Firebase trong GitHub OAuth App.
- Nếu camera không chạy, cho phép quyền camera/micro và dùng Chrome/Edge mới.
- Render free service có thể ngủ khi không hoạt động và mất vài chục giây để khởi động lại.
