"""Screenshots Fase 3 — Operação Real"""
import asyncio, os
from playwright.async_api import async_playwright
from pathlib import Path

URL = "https://compra-facil-hoteis.vercel.app"
EMAIL = "admin@fourpoint.pt"
PASSWORD = "#Four1010"
OUT = Path("/workspace/screenshots/fase3")
OUT.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("01-dashboard",       "/pt-PT/dashboard"),
    ("02-pedido-rapido",   "/pt-PT/order"),
    ("03-favoritos",       "/pt-PT/favorites"),
    ("04-catalogo",        "/pt-PT/catalog"),
    ("05-historico",       "/pt-PT/orders"),
    ("06-importacoes",     "/pt-PT/imports"),
    ("07-precos",          "/pt-PT/prices"),
    ("08-excepcoes",       "/pt-PT/exceptions"),
    ("09-saude",           "/pt-PT/health"),
    ("10-economia",        "/pt-PT/roi"),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2, locale="pt-PT")
        page = await context.new_page()

        # Login
        await page.goto(f"{URL}/pt-PT/login", wait_until="networkidle", timeout=20000)
        await page.fill('input[type="email"]', EMAIL)
        await page.fill('input[type="password"]', PASSWORD)
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard", timeout=15000)
        await page.wait_for_timeout(2500)

        for slug, path in PAGES:
            print(f"📸 {slug} → {path}")
            try:
                await page.goto(f"{URL}{path}", wait_until="networkidle", timeout=15000)
            except:
                await page.goto(f"{URL}{path}", wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(2500)
            await page.screenshot(path=str(OUT / f"{slug}.png"), full_page=True)

        # Mobile
        print("\n📱 Mobile")
        m = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=3, locale="pt-PT")
        mp = await m.new_page()
        await mp.goto(f"{URL}/pt-PT/login", wait_until="networkidle", timeout=20000)
        await mp.fill('input[type="email"]', EMAIL)
        await mp.fill('input[type="password"]', PASSWORD)
        await mp.click('button[type="submit"]')
        await mp.wait_for_url("**/dashboard", timeout=15000)
        await mp.wait_for_timeout(2000)
        for slug, path in [("M1-dashboard", "/pt-PT/dashboard"), ("M2-pedido", "/pt-PT/order"), ("M3-favoritos", "/pt-PT/favorites")]:
            await mp.goto(f"{URL}{path}", wait_until="domcontentloaded", timeout=15000)
            await mp.wait_for_timeout(2000)
            await mp.screenshot(path=str(OUT / f"{slug}.png"), full_page=True)

        await browser.close()
    print(f"\n🎉 {len(list(OUT.glob('*.png')))} screenshots em {OUT}")

asyncio.run(main())
