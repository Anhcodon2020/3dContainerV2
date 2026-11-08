import React, { useState } from 'react';
import {
  X,
  GitBranch,
  Download,
  Terminal,
  Key,
  Copy,
  Check,
  AlertTriangle,
  ExternalLink,
  FolderArchive,
  CheckCircle2,
  FileCode2
} from 'lucide-react';
import { downloadProjectZip } from '../utils/zipExporter';

interface GitExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitExportModal: React.FC<GitExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'download' | 'token'>('guide');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadProjectZip('optiload-3d-pallet-container.zip');
    } catch (err) {
      console.error('Failed to generate zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Khắc Phục Lỗi Git & Xuất Mã Nguồn
              </h2>
              <p className="text-xs text-slate-400">
                Hướng dẫn đẩy code lên GitHub / GitLab hoặc tải trực tiếp mã nguồn về máy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 p-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Lệnh Push Lên GitHub</span>
          </button>

          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'download'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <span>Tải Mã Nguồn .ZIP (Khuyên dùng)</span>
          </button>

          <button
            onClick={() => setActiveTab('token')}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'token'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Tạo GitHub Token (PAT)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-slate-300">
          {/* TAB 1: COMMAND LINE GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              {/* Notice banner */}
              <div className="p-3.5 rounded-2xl bg-blue-950/50 border border-blue-800/70 text-blue-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Dự án đã được khởi tạo Git sẵn sàng!</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Chúng tôi đã tự động cấu hình <code className="text-cyan-300 font-mono">git init</code>, nhánh <code className="text-cyan-300 font-mono">main</code> và tạo commit chứa toàn bộ file mã nguồn trong hệ thống.
                </p>
              </div>

              {/* Step by step */}
              <div className="space-y-3">
                <div className="font-bold text-white text-sm">
                  3 Bước Để Push Lên Repository Của Bạn:
                </div>

                {/* Step 1 */}
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      Bước 1: Tạo một Repository mới trên GitHub / GitLab
                    </span>
                    <a
                      href="https://github.com/new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
                    >
                      <span>Mở GitHub.com/new</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Đặt tên repo (ví dụ: <code className="text-slate-200">optiload-3d</code>), để chế độ Public hoặc Private và <strong>KHÔNG</strong> tích chọn "Add a README file" hay ".gitignore".
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      Bước 2: Gắn Remote URL vào dự án
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard('git remote add origin https://github.com/USERNAME/REPO_NAME.git', 1)
                      }
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === 1 ? 'Đã sao chép' : 'Sao chép lệnh'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                    git remote add origin https://github.com/USERNAME/REPO_NAME.git
                  </pre>
                  <p className="text-[10px] text-slate-500 italic">
                    * Thay USERNAME và REPO_NAME bằng tài khoản và tên repo thực tế của bạn.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      Bước 3: Đẩy code lên nhánh main
                    </span>
                    <button
                      onClick={() => copyToClipboard('git branch -M main && git push -u origin main', 2)}
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === 2 ? 'Đã sao chép' : 'Sao chép lệnh'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                    git branch -M main && git push -u origin main
                  </pre>
                </div>

                {/* Common errors troubleshooting */}
                <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-2xl space-y-1.5 text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Các lỗi thường gặp và cách khắc phục:</span>
                  </div>
                  <p className="text-[11px]">
                    • <strong>Lỗi "Authentication failed"</strong>: Kể từ tháng 8/2021, GitHub không cho phép dùng mật khẩu đăng nhập khi push Git. Bạn phải dùng <strong>Personal Access Token (PAT)</strong> làm mật khẩu (Xem tab "Tạo GitHub Token").
                  </p>
                  <p className="text-[11px]">
                    • <strong>Lỗi "remote origin already exists"</strong>: Chạy lệnh <code className="text-white font-mono">git remote remove origin</code> rồi gán lại URL mới.
                  </p>
                  <p className="text-[11px]">
                    • <strong>Lỗi "Updates were rejected because the remote contains work..."</strong>: Chạy <code className="text-white font-mono">git push -u origin main --force</code> (nếu repo mới tạo) để ghi đè.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOWNLOAD ZIP */}
          {activeTab === 'download' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-xl">
                <FolderArchive className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Tải Xuất Trọn Bộ Mã Nguồn Dự Án (.ZIP)
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Cách đơn giản và nhanh nhất: Tải file zip về máy tính cá nhân của bạn, giải nén và mở bằng VS Code để push lên Git bình thường!
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl max-w-lg mx-auto text-left space-y-2">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-cyan-400" />
                  <span>Gói mã nguồn ZIP bao gồm:</span>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                  <li>• Toàn bộ thư mục /src (Three.js 3D, Components, Models, Utils)</li>
                  <li>• package.json & tsconfig.json (đã khai báo đầy đủ thư viện)</li>
                  <li>• vite.config.ts & index.html</li>
                  <li>• File README.md hướng dẫn cài đặt npm run dev</li>
                </ul>
              </div>

              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-900/40 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isZipping ? 'Đang nén file zip...' : 'Tải Xuống File ZIP Ngay (.zip)'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: CREATE TOKEN GUIDE */}
          {activeTab === 'token' && (
            <div className="space-y-3">
              <div className="font-bold text-white text-sm">
                Cách Lấy GitHub Personal Access Token (PAT) Để Push Git:
              </div>

              <ol className="space-y-3 list-decimal list-inside text-slate-300 leading-relaxed text-[11px]">
                <li className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  Đăng nhập GitHub, vào <strong>Settings</strong> → kéo xuống cuối chọn{' '}
                  <strong className="text-blue-400">Developer Settings</strong>.
                  <div className="mt-1">
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Mở trực tiếp trang Tokens (github.com/settings/tokens)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </li>

                <li className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  Chọn <strong>Personal access tokens</strong> → <strong>Tokens (classic)</strong> → Bấm <strong>Generate new token</strong>.
                </li>

                <li className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  Đặt tên ghi chú (Note) ví dụ: <code className="text-cyan-300">OptiLoad Push</code>, chọn Expiration, và tích chọn quyền <strong className="text-emerald-400 font-mono">repo</strong> (Full control of private repositories).
                </li>

                <li className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                  Cuộn xuống bấm <strong>Generate token</strong> và sao chép mã token (bắt đầu bằng <code className="text-amber-300 font-mono">ghp_...</code>).
                </li>

                <li className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                  <span>Khi chạy lệnh <code className="text-cyan-300 font-mono">git push</code> hỏi <strong>Password for 'https://github.com'</strong>:</span>
                  <div className="p-2 rounded bg-slate-950 text-emerald-400 font-mono font-semibold">
                    👉 Dán mã Token (ghp_...) vừa sao chép vào thay vì nhập mật khẩu đăng nhập thông thường!
                  </div>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Trạng thái Git repo: <span className="font-mono text-emerald-400 font-semibold">Nhánh main • Đã commit toàn bộ files</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
