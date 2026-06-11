"""Screenshots específicos do admin (novo)"""
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

URL = "https://compra-facil-hoteis.vercel.app"
EMAIL = "admin@fourpoint.pt"
PASSWORD = "#Four1010"
OUT = Path("/workspace/screenshots/testes")
OUT.mkdir(parents=True, exist_ok=True)

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
        await page.wait_for_timeout(2000)

        # Admin tab utilizadores
        await page.goto(f"{URL}/pt-PT/admin", wait_until="networkidle", timeout=20000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=str(OUT / "A1-admin-users.png"), full_page=True)
        print("✅ A1-admin-users.png")

        # Admin tab Novo Login
        await page.click('button:has-text("Novo Login")')
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUT / "A2-admin-novo-login.png"), full_page=True)
        print("✅ A2-admin-novo-login.png")

        # Admin tab Alterar Senha
        await page.click('button:has-text("Alterar Senha")')
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUT / "A3-admin-mudar-senha.png"), full_page=True)
        print("✅ A3-admin-mudar-senha.png")

        # Criar um user de teste
        await page.click('button:has-text("Novo Login")')
        await page.wait_for_timeout(1000)
        await page.fill('input[placeholder*="Jo"]', 'Teste User')
        await page.fill('input[type="email"]', 'teste@fourpoint.pt')
        await page.fill('input[type="password"]', 'Teste1234')
        # Selecionar role admin
        await page.select_option('select', 'admin')
        await page.screenshot(path=str(OUT / "A4-admin-criar-preenchido.png"), full_page=True)
        print("✅ A4-admin-criar-preenchido.png")

        # Submit
        await page.click('button:has-text("Criar login")')
        await page.wait_for_timeout(3000)
        await page.screenshot(path=str(OUT / "A5-admin-criado.png"), full_page=True)
        print("✅ A5-admin-criado.png")

        # Voltar a Utilizadores
        await page.click('button:has-text("Utilizadores")')
        await page.wait_for_timeout(2000)
        await page.screenshot(path=str(OUT / "A6-admin-lista-com-novo.png"), full_page=True)
        print("✅ A6-admin-lista-com-novo.png")

        # Verificar no DB
        print("\n--- Verificar no Supabase ---")
        import urllib.request, json, os
        # Em vez de hardcodar a service_role key, usar a env var
        service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
        if not service_key:
            print("  (skip - SUPABASE_SERVICE_ROLE_KEY not set)")
        else:
            url = "https://fpjhvyydavssrzrkvlbd.supabase.co/auth/v1/admin/users"
            req = urllib.request.Request(url, headers={
                "Authorization": f"Bearer {service_key}",
                "apikey": service_key,
            })
            with urllib.request.urlopen(req, timeout=10) as resp:
                users = json.loads(resp.read())
                print(f"  Users em auth.users: {len(users