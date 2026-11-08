import JSZip from 'jszip';

// Load source code files as raw strings at build time
const rawModules = import.meta.glob(
  [
    '/src/**/*.{ts,tsx,css}',
    '/index.html',
    '/package.json',
    '/tsconfig.json',
    '/vite.config.ts',
    '/metadata.json',
    '/.gitignore',
    '/.env.example'
  ],
  {
    query: '?raw',
    import: 'default',
    eager: true
  }
) as Record<string, string>;

export async function downloadProjectZip(filename: string = 'optiload-3d-source.zip'): Promise<void> {
  const zip = new JSZip();

  // Add all source files to zip
  for (const [filepath, content] of Object.entries(rawModules)) {
    // Strip leading slash
    const relativePath = filepath.startsWith('/') ? filepath.slice(1) : filepath;
    zip.file(relativePath, content);
  }

  // Add README.md with clear git setup & installation instructions
  const readmeContent = `# OptiLoad 3D - Ứng Dụng Tối Ưu Đóng Hàng Pallet & Cân Bằng Container

Phần mềm mô phỏng không gian 3D (Three.js) tính toán đóng hàng pallet, tự động tính CBM, số kg, tải trọng và phân bổ trọng tâm CoG container theo quy chuẩn an toàn hàng hải & vận tải đường bộ IMO/CTU.

## 🚀 Hướng Dẫn Cài Đặt & Chạy Trên Máy Tính:

1. Cài đặt các gói phụ thuộc:
\`\`\`bash
npm install
\`\`\`

2. Khởi động môi trường phát triển:
\`\`\`bash
npm run dev
\`\`\`
Mở trình duyệt tại: \`http://localhost:3000\`

3. Đóng gói bản phát hành production:
\`\`\`bash
npm run build
\`\`\`

## 📦 Hướng Dẫn Đẩy Lên GitHub / GitLab:

\`\`\`bash
git init
git add .
git commit -m "feat: initial commit"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/<ten-repository>.git
git push -u origin main
\`\`\`
`;
  zip.file('README.md', readmeContent);

  // Generate zip blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
