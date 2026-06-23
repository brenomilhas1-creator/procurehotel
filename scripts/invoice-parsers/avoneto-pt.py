#!/usr/bin/env python3
"""
Parser de faturas Avoneto Hortefruti (PT)
Suporta: faturas com 2+ páginas, items com LOTE partido em 2 linhas
Output: JSON com items parseados (code, name, quantity, unit, unit_price, tax_rate, line_total)

Uso:
    pdftotext -layout fatura.pdf - | python3 avoneto-pt.py > items.json
"""
import re
import json
import sys

def parse(text):
    """Parser principal."""
    # Encontrar início e fim da lista de items
    start = text.find('AbaFru001')  # primeiro código conhecido
    if start == -1:
        # Tentar com códigos diferentes
        m = re.search(r'(AbaFru|MamFru|LarFru|MelFru)\d{2,3}', text)
        start = m.start() if m else 0
    
    dup_start = text.find('Duplicado', start)
    if dup_start == -1:
        # Se não há "Duplicado", usar final do texto
        text = text[start:]
    else:
        text = text[start:dup_start]
    
    # Remover headers
    patterns = [
        r'(?m)^.*REFERÊNCIA.*$', r'(?m)^.*Fatura FT.*$', r'(?m)^.*Página \d+/\d+.*$',
        r'(?m)^.*Encomenda de Cliente.*$', r'(?m)^.*Valor a Transportar.*$',
        r'(?m)^.*Valor Transportado.*$', r'(?m)^.*1/2\s*$', r'(?m)^.*Original\s*$',
        r'(?m)^.*Duplicado\s*$', r'(?m)^SÉRIE:.*$', r'(?m)^DATA:.*$', r'(?m)^Avoneto.*$',
        r'(?m)^Oceansesimbra.*$', r'(?m)^NIF:.*$', r'(?m)^Rua.*$', r'(?m)^\d{4}-\d{3}.*$',
        r'(?m)^Charneca.*$', r'(?m)^Capital.*$', r'(?m)^Telefone.*$', r'(?m)^E-mail:.*$',
        r'(?m)^IBAN:.*$', r'(?m)^Software.*$', r'(?m)^Data e Hora.*$', r'(?m)^Contribuinte.*$',
        r'(?m)^REFERÊNCIA\s+ORIGEM.*$', r'(?m)^Cliente\s+Estab.*$', r'(?m)^Vendedor.*$',
        r'(?m)^Vencimento.*$', r'(?m)^Saldo em Aberto.*$', r'(?m)^Moeda:.*$',
    ]
    for p in patterns:
        text = re.sub(p, '', text)
    
    # Items: código (letras + numeros) + origem (2-4 letras) + body
    # Aceita "MelFruoo8" (com "oo" minusculo) também
    item_pattern = re.compile(
        r'^([A-Z][a-zA-Z]{2,}\d{1,3})\s+([A-Z]{2,4})\s+(.+?)(?=^[A-Z][a-zA-Z]{2,}\d{1,3}\s+[A-Z]{2,4}|\Z)',
        re.MULTILINE | re.DOTALL
    )
    items = []
    for m in item_pattern.finditer(text):
        items.append({'code': m.group(1), 'origin': m.group(2), 'body': m.group(3).strip()})
    
    # Parsear cada item
    parsed = []
    for it in items:
        lines = [l.strip() for l in it['body'].split('\n') if l.strip()]
        full = ' '.join(lines)
        full = re.sub(r'\s+', ' ', full).strip()
        
        # Regex principal: QTD  UNI  PREÇO  XX%  [DESC]  TOTAL
        # XX% tem boundary \d{1,2} para não apanhar números de 2 dígitos em "91,26"
        m = re.search(
            r'(\d+(?:[,\.]\d+)?)\s+(Kg|Uni|Molh|Bald|kg|KG|MOLH|UNI|BALD)\s+'
            r'(\d+(?:[,\.]\d+)?)\s+(\d{1,2})\s*%(?:\s+([\d]+[,\.][\d]+))?\s+'
            r'([\d]+[,\.][\d]+)',
            full
        )
        if not m:
            continue
        
        qty, unit, price, tax, disc, total = m.groups()
        
        # LOTE: procurar antes do QTD, pode estar partido
        before_qty = full[:full.find(qty)].strip()
        parts = before_qty.split()
        lot = None
        name_parts = list(parts)
        
        # LOTE partido: 2 últimos tokens (alfanumérico + dígitos)
        if len(name_parts) >= 2:
            a, b = name_parts[-2], name_parts[-1]
            if re.match(r'^[A-ZÃÇ][A-Z0-9ÃÇ]+$', a) and re.match(r'^\d{2,6}$', b):
                lot = a + b
                name_parts = name_parts[:-2]
        if lot is None:
            if name_parts and re.match(r'^[A-ZÃÇ][A-Z0-9ÃÇ]{3,}$', name_parts[-1]):
                lot = name_parts[-1]
                name_parts = name_parts[:-1]
        if lot is None:
            if len(name_parts) >= 2 and re.match(r'^[A-ZÃÇ][A-Z0-9ÃÇ]{3,}$', name_parts[-2]):
                lot = name_parts[-2]
                name_parts = name_parts[:-2] + name_parts[-1:]
        if lot is None:
            continue
        
        name = ' '.join(name_parts).strip()
        
        parsed.append({
            'code': it['code'],
            'origin': it['origin'],
            'name': name,
            'lot': lot,
            'quantity': float(qty.replace(',', '.')),
            'unit': unit,
            'unit_price': float(price.replace(',', '.')),
            'tax_rate': int(tax),
            'line_total': float(total.replace(',', '.')),
        })
    
    return parsed

if __name__ == '__main__':
    text = sys.stdin.read()
    items = parse(text)
    print(json.dumps(items, ensure_ascii=False, indent=2))
    
    # Verificação
    subtotal = sum(it['line_total'] for it in items)
    by_tax = {}
    for it in items:
        by_tax.setdefault(it['tax_rate'], 0)
        by_tax[it['tax_rate']] += it['line_total']
    print(f'\n# Total: {len(items)} items', file=sys.stderr)
    print(f'# Subtotal: €{subtotal:.2f}', file=sys.stderr)
    for tax, total in sorted(by_tax.items()):
        print(f'# Tax {tax}%: €{total:.2f}', file=sys.stderr)
