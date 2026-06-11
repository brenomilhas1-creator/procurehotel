import asyncio, os
from playwright.async_api import async_playwright
from pathlib import Path

URL = "https://compra-facil-hoteis.vercel.app"
EMAIL = "admin@procurehotel.pt"
PASSWORD = "admin12345"
OUT = Path("/workspace/screenshots")
OUT.mkdir(exist_ok=True)

PAGES = [
    ("01-login",          "/pt-PT/login",        False),
    ("02-dashboard",      "/pt-PT/dashboard",    True),
    ("03-products",       "/pt-PT/products",     True),
    ("04-suppliers",      "/pt-PT/suppliers",    True),
    ("05-order",          "/pt-PT/order",        True),
    ("06-orders",         "/pt-PT/orders",       True),
    ("07-imports",        "/pt-PT/imports",      True),
    ("08-analytics",      "/pt-PT/analytics",    True),
    ("09-admin",          "/pt-PT/admin",        True),
    ("10-roi",            "/pt-PT/roi",          True),
    ("11-users",          "/pt-PT/users",        True),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
            locale="pt-PT",
        )
        page = await context.new_page()

        print(f"📸 {PAGES[0][0]} (no auth)")
        await page.goto(f"{URL}/pt-PT/login", wait_until="networkidle", timeout=20000)
        await page.wait_for_timeout(1000)
        await page.screenshot(path=str(OUT / f"{PAGES[0][0]}.png"), full_page=True)
        print(f"  ✅ {PAGES[0][0]}.png")

        print("\n🔐 Fazendo login...")
        await page.fill('input[type="email"]', EMAIL)
        await page.fill('input[type="password"]', PASSWORD)
        await page.screenshot(path=str(OUT / "01b-login-preenchido.png"), full_page=True)
        await page.click('button[type="submit"]')
        try:
            await page.wait_for_url("**/dashboard", timeout=15000)
        except:
            print(f"  ⚠️  Não redirecionou. URL: {page.url}")
            await page.wait_for_timeout(3000)
        print(f"  Logado. URL: {page.url}")
        await page.wait_for_timeout(2000)

        for slug, path, _ in PAGES[1:]:
            print(f"\n📸 {slug} → {path}")
            try:
                await page.goto(f"{URL}{path}", wait_until="networkidle", timeout=20000)
            except Exception as e:
                print(f"  ⚠️  networkidle timeout, fallback: {e}")
                await page.goto(f"{URL}{path}", wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(2500)
            await page.screenshot(path=str(OUT / f"{slug}.png"), full_page=True)
            print(f"  ✅ {slug}.png")

        print("\n📱 Mobile (iPhone 12 390x844)")
        mobile = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=3,
            locale="pt-PT",
        )
        mp = await mobile.new_page()
        await mp.goto(f"{URL}/pt-PT/login", wait_until="networkidle", timeout=20000)
        await mp.fill('input[type="email"]', EMAIL)
        await mp.fill('input[type="password"]', PASSWORD)
        await mp.click('button[type="submit"]')
        try:
            await mp.wait_for_url("**/dashboard", timeout=15000)
        except:
            pass
        await mp.wait_for_timeout(2000)

        for slug, path in [
            ("M1-dashboard-mobile",  "/pt-PT/dashboard"),
            ("M2-products-mobile",   "/pt-PT/products"),
            ("M3-roi-mobile",        "/pt-PT/roi"),
            ("M4-order-mobile",      "/pt-PT/order"),
        ]:
            print(f"  📸 {slug}")
            try:
                await mp.goto(f"{URL}{path}", wait_until="domcontentloaded", timeout=20000)
            except:
                pass
            await mp.wait_for_timeout(2500)
            await mp.screenshot(path=str(OUT / f"{slug}.png"), full_page=True)
            print(f"    ✅ {slug}.png")

        await browser.close()

    print(f"\n🎉 {len(list(OUT.glob('*.png')))} screenshots em {OUT}")

asyncio.run(main())
