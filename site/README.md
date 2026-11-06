# Nội dung trang chủ

Trang chủ `index.html` được sinh tự động, không sửa tay file này.

- `content.json`: toàn bộ nội dung, sửa qua `/admin.html`.
- `template.html`: khung giao diện. Muốn đổi bố cục sâu thì sửa ở đây rồi chạy `node site/build.js`.
- `render.js`: ghép `template.html` với `content.json`, dùng chung cho admin và `build.js`.

Admin lưu bằng cách commit `content.json` và `index.html` lên nhánh `main`, Cloudflare tự deploy lại.
Nếu `index.html` bị sửa tay, admin sẽ cảnh báo vì lần lưu sau sẽ ghi đè phần đó.
