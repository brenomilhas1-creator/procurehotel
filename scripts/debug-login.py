"""Debug: tentar login e ver o que acontece"""
import asyncio
from playwright.async_api import async_playwright

URL = "https://compra-facil-hoteis.vercel.app"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = await browser.new_page()

        # Capturar logs
        page.on("console", lambda msg: print(f"[CONSOLE] {msg.type}: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"[PAGEERR] {exc}"))
        page.on("response", lambda r: print(f"[RESP] {r.status} {r.url[:80]}") if r.status >= 400 else None)

        print("=== Abrir login ===")
        await page.goto(f"{URL}/pt-PT/login", wait_until="networkidle", timeout=20000)
        await page.wait_for_timeout(500)

        print("=== Preencher credenciais ===")
        await page.fill('input[type="email"]', "admin@procurehotel.pt")
        await page.fill('input[type="password"]', "admin12345")

        print("=== Submit ===")
        await page.click('button[type="submit"]')
        await page.wait_for_timeout(8000)

        print(f"\n=== URL final: {page.url} ===")
        print(f"=== Title: {await page.title()} ===")
        # Ver localStorage
        storage = await page.evaluate("""() => {
            const auth = localStorage.getItem('procurehotel.auth');
            const sb = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
            return { auth, sb_keys: sb };
        }""")
        print(f"=== localStorage procurehotel.auth: {storage['auth'][:200] if storage['auth'] else 'NULL'}")
        print(f"=== sb- keys: {storage['sb_keys']}")

        # Tirar screenshot do estado final
        await page.screenshot(path="/workspace/screenshots/DEBUG-login-result.png", full_page=True)
        print("📸 /workspace/screenshots/DEBUG-login-result.png")

        await browser.close()

asyncio.run(main())
