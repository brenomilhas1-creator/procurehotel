"""
Seed inicial: 1 ADMIN, 2 fornecedores, ~20 produtos de demonstração.

Executar: `python -m app.scripts.seed`
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models import (
    Product, ProductAlias, ProductStatus, UnitOfMeasure,
    Supplier, SupplierPrice, PriceSource, User, UserRole,
)


PRODUCTS = [
    ("Coca Cola Original 33cl", "Coca Cola", "Bebidas", UnitOfMeasure.UN, 1, UnitOfMeasure.UN, ["coca", "coca cola", "coca-cola 33cl", "cc 33"]),
    ("Coca Cola Zero 33cl", "Coca Cola", "Bebidas", UnitOfMeasure.UN, 1, UnitOfMeasure.UN, ["coca zero", "cc zero"]),
    ("Água Mineral 50cl", "Luso", "Bebidas", UnitOfMeasure.UN, 1, UnitOfMeasure.UN, ["agua", "água", "agua 50"]),
    ("Cerveja Super Bock 33cl", "Super Bock", "Bebidas", UnitOfMeasure.UN, 1, UnitOfMeasure.UN, ["superbock", "sb"]),
    ("Café Grão 1kg", "Delta", "Café", UnitOfMeasure.KG, 1, UnitOfMeasure.KG, ["cafe", "café"]),
    ("Leite UHT Meio Gordo 1L", "Mimosa", "Laticínios", UnitOfMeasure.L, 1, UnitOfMeasure.L, ["leite", "mimosa"]),
    ("Queijo Flamengo 5kg", "Presid", "Laticínios", UnitOfMeasure.KG, 5, UnitOfMeasure.KG, ["queijo flamengo", "flamengo"]),
    ("Manteiga sem Sal 250g", "President", "Laticínios", UnitOfMeasure.G, 250, UnitOfMeasure.G, ["manteiga"]),
    ("Farinha Nacional Tipo 65 25kg", "nacional", "Mercearia", UnitOfMeasure.KG, 25, UnitOfMeasure.KG, ["farinha", "farinha 25"]),
    ("Açúcar Branco 1kg", "Sidul", "Mercearia", UnitOfMeasure.KG, 1, UnitOfMeasure.KG, ["acucar", "açúcar"]),
    ("Sal Marinho 1kg", "Salina", "Mercearia", UnitOfMeasure.KG, 1, UnitOfMeasure.KG, ["sal"]),
    ("Óleo Girassol 5L", "Fula", "Mercearia", UnitOfMeasure.L, 5, UnitOfMeasure.L, ["oleo", "óleo"]),
    ("Arroz Agulha 5kg", "Pingo Doce", "Mercearia", UnitOfMeasure.KG, 5, UnitOfMeasure.KG, ["arroz"]),
    ("Massa Esparguete 500g", "Gallo", "Mercearia", UnitOfMeasure.G, 500, UnitOfMeasure.G, ["massa", "esparguete"]),
    ("Atum em Lata 120g", "Bom Petisco", "Conservas", UnitOfMeasure.G, 120, UnitOfMeasure.G, ["atum"]),
    ("Tomate Pelado 400g", "Favorit", "Conservas", UnitOfMeasure.G, 400, UnitOfMeasure.G, ["tomate"]),
    ("Frango Inteiro 2kg", "Campoaves", "Carnes", UnitOfMeasure.KG, 2, UnitOfMeasure.KG, ["frango"]),
    ("Lombo Porco 1kg", "PorcoNobre", "Carnes", UnitOfMeasure.KG, 1, UnitOfMeasure.KG, ["lombo", "porco"]),
    ("Batata 25kg", "nacional", "Hortifruti", UnitOfMeasure.KG, 25, UnitOfMeasure.KG, ["batata"]),
    ("Cebola 10kg", "nacional", "Hortifruti", UnitOfMeasure.KG, 10, UnitOfMeasure.KG, ["cebola"]),
    ("Detergente Loiça 5L", "Fairy", "Higiene", UnitOfMeasure.L, 5, UnitOfMeasure.L, ["detergente"]),
    ("Papel Higiénico 12 rolos", "Renova", "Higiene", UnitOfMeasure.UN, 12, UnitOfMeasure.UN, ["papel"]),
]

SUPPLIERS = [
    ("Distribuidora Norte, Lda", "5000123456", True),
    ("Horeca Sul, S.A.", "5000654321", False),
]


async def main():
    async with AsyncSessionLocal() as db:
        # Admin
        admin = (await db.execute(select(User).where(User.email == "admin@procurehotel.pt"))).scalar_one_or_none()
        if not admin:
            admin = User(
                email="admin@procurehotel.pt",
                full_name="Administrador",
                hashed_password=hash_password("admin12345"),
                role=UserRole.ADMIN,
            )
            db.add(admin)

        # Demo user
        user = (await db.execute(select(User).where(User.email == "user@procurehotel.pt"))).scalar_one_or_none()
        if not user:
            user = User(
                email="user@procurehotel.pt",
                full_name="Utilizador Demo",
                hashed_password=hash_password("user12345"),
                role=UserRole.USER,
            )
            db.add(user)

        # Suppliers
        suppliers = []
        for name, tax, pref in SUPPLIERS:
            s = (await db.execute(select(Supplier).where(Supplier.name == name))).scalar_one_or_none()
            if not s:
                s = Supplier(name=name, tax_id=tax, is_preferred=pref, contact_email=f"comercial@{name.split()[0].lower()}.pt")
                db.add(s)
                await db.flush()
            suppliers.append(s)

        # Products
        for (name, brand, cat, unit, pkg_size, pkg_unit, aliases) in PRODUCTS:
            p = (await db.execute(select(Product).where(Product.master_name == name))).scalar_one_or_none()
            if not p:
                p = Product(
                    master_name=name, brand=brand, category=cat,
                    unit=unit, package_size=pkg_size, package_unit=pkg_unit,
                    status=ProductStatus.ACTIVE, substitution_allowed=True,
                )
                db.add(p)
                await db.flush()
                for a in aliases:
                    db.add(ProductAlias(product_id=p.id, alias=a))
            # preços por fornecedor
            for idx, sup in enumerate(suppliers):
                # 25% diferença para haver comparação
                base = 1.0 + idx * 0.15
                unit_price = (hash((name, sup.id)) % 500) / 100 + 1
                final = round(unit_price * base, 4)
                db.add(SupplierPrice(
                    supplier_id=sup.id,
                    product_id=p.id,
                    price=round(final * (pkg_size or 1), 4),
                    currency="EUR",
                    unit_price=final,
                    package_qty=pkg_size or 1,
                    source=PriceSource.MANUAL,
                ))

        await db.commit()
        print("Seed concluído:")
        print("  - admin@procurehotel.pt / admin12345")
        print("  - user@procurehotel.pt  / user12345")
        print(f"  - {len(SUPPLIERS)} fornecedores, {len(PRODUCTS)} produtos")


if __name__ == "__main__":
    asyncio.run(main())
