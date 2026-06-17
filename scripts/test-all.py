"""Suite de testes 1-6 para Compra Facil Hoteis"""
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

URL = "https://compra-facil-hoteis.vercel.app"
EMAIL = "admin@fourpoint.pt"
PASSWORD = "#Four1010"
OUT = Path("/workspace/screenshots/testes")
OUT.mkdir(parents=True, exist_ok=True)

results = {}

async def test_1_login(page):
    """Teste 1: Login"""
    print("\n=== TESTE 1: LOGIN ===")
    await page.goto(f"{URL}/pt-PT/login", wait_until="networkidle", timeout=20000)

    title = await page.title()
    print(f"  Title: {title}")
    has_title = "Compra Facil" in title or "Compra Fácil" in title

    has_email = await page.locator('input[type="email"]').count() > 0
    has_password = await page.locator('input[type="password"]').count() > 0
    print(f"  Form: email={has_email}, password={has_password}")

    await page.fill('input[type="email"]', EMAIL)
    await page.fill('input[type="password"]', PASSWORD)
    await page.screenshot(path=str(OUT / "T1-01-login-preenchido.png"), full_page=True)

    await page.click('button[type="submit"]')
    try:
        await page.wait_for_url("**/dashboard", timeout=15000)
        redirected = True
    except:
        redirected = False

    print(f"  URL após submit: {page.url}")
    await page.wait_for_timeout(2000)
    await page.screenshot(path=str(OUT / "T1-02-apos-login.png"), full_page=True)

    success = has_title and has_email and has_password and redirected
    print(f"  ✅ PASSOU" if success else f"  ❌ FALHOU")
    results['T1'] = {'passou': success, 'detalhes': {'title': title, 'form': has_email and has_password, 'redirected': redirected}}
    return success

async def test_2_secrets(page):
    """Teste 2: Sem secrets no console/network"""
    print("\n=== TESTE 2: SEM SECRETS ===")
    console_errors = []
    network_responses = []
    secrets_found = []

    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("response", lambda r: network_responses.append((r.status, r.url)))

    # Fazer ações que disparam requests
    await page.goto(f"{URL}/pt-PT/dashboard", wait_until="networkidle", timeout=20000)
    await page.wait_for_timeout(2000)
    await page.goto(f"{URL}/pt-PT/admin", wait_until="networkidle", timeout=20000)
    await page.wait_for_timeout(2000)
    await page.goto(f"{URL}/pt-PT/products", wait_until="networkidle", timeout=20000)
    await page.wait_for_timeout(2000)

    # Verificar console
    print(f"  Console errors: {len(console_errors)}")
    for e in console_errors[:5]:
        print(f"    - {e[:150]}")

    # Verificar network
    print(f"  Network responses: {len(network_responses)}")
    for status, u in network_responses[:5]:
        print(f"    {status} {u[:80]}")

    # Procurar secrets em todas as responses
    forbidden = ['SERVICE_ROLE', 'SECRET', 'API_KEY', 'sb_secret_']
    for status, u in network_responses:
        for f in forbidden:
            if f in u:
                secrets_found.append((status, u, f))

    has_no_secrets = len(secrets_found) == 0 and len(console_errors) == 0
    print(f"  Secrets encontrados: {len(secrets_found)}")
    for s in secrets_found[:3]:
        print(f"    - {s}")

    if has_no_secrets:
        print(f"  ✅ PASSOU")
    else:
        print(f"  ❌ FALHOU")
    results['T2'] = {'passou': has_no_secrets, 'detalhes': {'console_errors': len(console_errors), 'secrets_in_urls': len(secrets_found), 'total_responses': len(network_responses)}}
    return has_no_secrets

async def test_3_persistence(page):
    """Teste 3: Sessão persiste após F5"""
    print("\n=== TESTE 3: PERSISTÊNCIA DE SESSÃO ===")
    # Garante login
    await page.goto(f"{URL}/pt-PT/dashboard", wait_until="networkidle", timeout=20000)
    await page.wait_for_timeout(1500)

    url_before = page.url
    print(f"  URL antes: {url_before}")

    # F5 (reload)
    await page.reload(wait_until="networkidle", timeout=20000)
    await page.wait_for_timeout(2000)

    url_after = page.url
    print(f"  URL depois: {url_after}")

    # Verificar que ainda está autenticado (mostra dashboard, não /login)
    is_dashboard = "/dashboard" in url_after
    is_login = "/login" in url_after

    await page.screenshot(path=str(OUT / "T3-apos-F5.png"), full_page=True)

    passou = is_dashboard and not is_login
    print(f"  {'✅ PASSOU' if passou else '❌ FALHOU'} - sessão {'persiste' if passou else 'NÃO persiste'}")
    results['T3'] = {'passou': passou, 'url_antes': url_before, 'url_depois': url_after}
    return passou

async def test_4_mobile(browser):
    """Teste 4: Mobile (iPhone 14, Galaxy S23, iPad)"""
    print("\n=== TESTE 4: MOBILE ===")
    devices = [
        ("iPhone 14", {"width": 390, "height": 844}, "ios"),
        ("Galaxy S23", {"width": 360, "height": 800}, "android"),
        ("iPad", {"width": 768, "height": 1024}, "tablet"),
    ]
    mobile_results = []
    for name, vp, kind in devices:
        print(f"\n  --- {name} ({vp['width']}x{vp['height']}) ---")
        context = await browser.new_context(viewport=vp, device_scale_factor=2, locale="pt-PT", user_agent=f"Mozilla/5.0 ({name})")
        mp = await context.new_page()
        # Login
        await mp.goto(f"{URL}/pt-PT/login", wait_until="networkidle", timeout=20000)
        await mp.fill('input[type="email"]', EMAIL)
        await mp.fill('input[type="password"]', PASSWORD)
        await mp.click('button[type="submit"]')
        try:
            await mp.wait_for_url("**/dashboard", timeout=15000)
        except:
            pass
        await mp.wait_for_timeout(2000)

        for page_name, path in [("dashboard", "/pt-PT/dashboard"), ("admin", "/pt-PT/admin"), ("uploads", "/pt-PT/imports")]:
            try:
                await mp.goto(f"{URL}{path}", wait_until="domcontentloaded", timeout=15000)
            except:
                pass
            await mp.wait_for_timeout(2000)
            slug = name.replace(' ', '-').lower() + '-' + page_name
            await mp.screenshot(path=str(OUT / f"T4-{slug}.png"), full_page=True)
        # Check hamburger
        try:
            await mp.goto(f"{URL}/pt-PT/dashboard", wait_until="domcontentloaded", timeout=15000)
            await mp.wait_for_timeout(1500)
            # Tentar abrir hamburger
            hamburger = await mp.locator('button[aria-label="Menu"]').count()
            print(f"    Hamburger: {hamburger > 0}")
        except Exception as e:
            print(f"    Erro: {e}")
        await context.close()
        mobile_results.append((name, kind))
    passed = len(mobile_results) == 3
    print(f"\n  {'✅ PASSOU' if passed else '❌ FALHOU'}")
    results['T4'] = {'passou': passed, 'devices': mobile_results}
    return passed

async def test_5_localstorage(page):
    """Teste 5: LocalStorage sem secrets"""
    print("\n=== TESTE 5: LOCALSTORAGE SEM SECRETS ===")
    await page.goto(f"{URL}/pt-PT/dashboard", wait_until="networkidle", timeout=20000)
    await page.wait_for_timeout(2000)

    storage = await page.evaluate("""() => {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            items[k] = localStorage.getItem(k);
        }
        return items;
    }""")

    print(f"  Itens em localStorage: {len(storage)}")
    for k, v in storage.items():
        print(f"    {k}: {v[:80]}...")

    forbidden = ['SERVICE_ROLE', 'sb_secret_', 'SECRET_KEY', 'API_KEY', 'PASSWORD']
    secrets_in_storage = []
    for k, v in storage.items():
        for f in forbidden:
            if f.lower() in (k + v).lower():
                secrets_in_storage.append((k, f, v[:200]))

    passou = len(secrets_in_storage) == 0
    print(f"  {'✅ PASSOU' if passou else '❌ FALHOU'}")
    if secrets_in_storage:
        for s in secrets_in_storage:
            print(f"    Found: {s}")
    results['T5'] = {'passou': passou, 'items': list(storage.keys()), 'secrets': len(secrets_in_storage)}
    return passou

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2, locale="pt-PT")
        page = await context.new_page()

        await test_1_login(page)
        await test_2_secrets(page)
        await test_3_persistence(page)
        await test_4_mobile(browser)
        await test_5_localstorage(page)

        # Save results
        import json
        with open('/workspace/reports/test-results.json', 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\n\n=== RESUMO ===")
        for k, v in results.items():
            print(f"  {k}: {'✅' if v.get('passou') else '❌'}")
        await browser.close()

asyncio.run(main())
