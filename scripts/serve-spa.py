"""SPA 静态服务器(开发辅助)

策略:
- /assets/* 和其它含 . 的路径 → 走 SimpleHTTPRequestHandler 原逻辑
- 其它路径(Vue Router 路由)→ fallback 到 index.html
- ⚠️ 但是!如果路径前缀是已知"外部系统"(/touch/ /oa/ /platform/ 等)→ 返回 404
  避免误以为这些是消保系统功能(实际是独立系统,见旅程文档中"跨系统/外部依赖")

使用:
  python3 scripts/serve-spa.py [port]   (默认 4001)

需要先 npm run build 生成 dist/
"""
import http.server
import socketserver
import os
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4001
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "dist")
ROOT = os.path.abspath(ROOT)

# 这些是"外部系统"路径前缀,在消保 demo 中不应该出现,出现即返回 404
EXTERNAL_PREFIXES = (
    "/touch",  # 触达系统(营销/催收外呼平台)
    "/oa",  # OA 审批系统
    "/platform",  # 京东/美团/蚂蚁等外部平台
    "/12345",  # 12345 政务平台
    "/blackcat",  # 黑猫投诉平台
    "/core",  # 核心系统(堡垒机后)
    "/vpn",  # VPN/堡垒机
)


class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        # 外部系统路径 → 直接 404 + 友好说明
        if any(path.startswith(p) for p in EXTERNAL_PREFIXES):
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            msg = (
                f"<!doctype html><meta charset=utf-8>"
                f"<title>外部独立系统 · 404</title>"
                f"<style>body{{font:14px/1.6 -apple-system,Segoe UI,sans-serif;max-width:680px;margin:48px auto;color:#333;padding:0 24px}}"
                f"h1{{color:#f5222d}}code{{background:#f5f5f5;padding:2px 6px;border-radius:3px}}</style>"
                f"<h1>404 · 外部独立系统</h1>"
                f"<p>路径 <code>{path}</code> 属于<b>独立外部系统</b>,不在消保系统中。</p>"
                f"<ul>"
                f"<li>触达系统(<code>/touch</code>)— 营销/催收外呼平台</li>"
                f"<li>OA 审批系统(<code>/oa</code>)— 走 OA 公共审批流</li>"
                f"<li>12345 政务平台(<code>/12345</code>)— 政务转办件来源</li>"
                f"<li>黑猫投诉(<code>/blackcat</code>)— 投诉来源</li>"
                f"<li>核心系统(<code>/core</code>)— 通过堡垒机对接</li>"
                f"</ul>"
                f"<p>消保系统通过<b>接口/外链</b>与上述系统对接,具体操作在各自原系统完成。</p>"
                f"<p><a href='/journey'>← 返回消保系统旅程说明</a></p>"
            )
            self.wfile.write(msg.encode("utf-8"))
            return
        # 静态资源 → 原逻辑
        if "." in os.path.basename(path) or path.startswith("/assets"):
            return super().do_GET()
        # Vue Router → fallback index.html
        self.path = "/index.html"
        return super().do_GET()


class ReuseTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with ReuseTCPServer(("", PORT), SpaHandler) as httpd:
        print(f"SPA server on http://127.0.0.1:{PORT}  (root={ROOT})")
        sys.stdout.flush()
        httpd.serve_forever()