# Huong Dan Su Dung API GMGN

Tai lieu nay mo ta cach goi cac endpoint GMGN dang duoc su dung trong project nay. Luu y: day la cach dung thuc te (reverse-engineered), khong phai tai lieu chinh thuc tu GMGN, nen endpoint va field co the thay doi theo thoi gian.

## 1. Tong quan

- Base URL:
  - `https://gmgn.ai/defi/quotation/v1`
- Endpoint chinh:
  - `GET /rank/{chain}/swaps/{time_range}`

## 2. Tham so quan trong

### Path params

- `chain`: ma chain
  - Thuong dung: `sol`, `eth`, `bsc`, `base`, `tron`
- `time_range`: khung thoi gian
  - Thuong dung: `5m`, `1h`, `6h`, `24h`
  - Mot so truong hop co the dung `15m` (khong dam bao chain nao cung ho tro)

### Query params

- `orderby`: cot sap xep
  - `volume`: theo khoi luong
  - `created_at`: token moi
  - `price_change_percent`: top tang gia
  - `smart_money`: dong tien smart money
- `direction`: `desc` hoac `asc` (thuong dung `desc`)
- `limit`: so luong ket qua (vi du `100`)
- `filters[]`: bo loc bo sung
  - Vi du: `not_honeypot`

## 3. Vi du goi API bang curl

### 3.1 Top token theo volume (Solana, 1h)

```bash
curl 'https://gmgn.ai/defi/quotation/v1/rank/sol/swaps/1h?orderby=volume&direction=desc&limit=100&filters%5B%5D=not_honeypot' \
  -H 'Accept: application/json' \
  -H 'Accept-Language: en-US,en;q=0.9' \
  -H 'User-Agent: Mozilla/5.0' \
  -H 'Referer: https://gmgn.ai/?chain=sol'
```

### 3.2 Token moi nhat

```bash
curl 'https://gmgn.ai/defi/quotation/v1/rank/sol/swaps/1h?orderby=created_at&direction=desc&limit=100' \
  -H 'Accept: application/json' \
  -H 'Referer: https://gmgn.ai/?chain=sol'
```

### 3.3 Top gainers

```bash
curl 'https://gmgn.ai/defi/quotation/v1/rank/sol/swaps/1h?orderby=price_change_percent&direction=desc&limit=100' \
  -H 'Accept: application/json' \
  -H 'Referer: https://gmgn.ai/?chain=sol'
```

## 4. Vi du Python (requests)

```python
import requests

BASE_API = "https://gmgn.ai/defi/quotation/v1"

session = requests.Session()
session.headers.update(
    {
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://gmgn.ai/?chain=sol",
    }
)

url = f"{BASE_API}/rank/sol/swaps/1h"
params = {
    "orderby": "volume",
    "direction": "desc",
    "limit": 100,
    "filters[]": "not_honeypot",
}

resp = session.get(url, params=params, timeout=30)
resp.raise_for_status()
payload = resp.json()

data = payload.get("data", {})
if isinstance(data, dict):
    tokens = data.get("rank") or data.get("tokens") or data.get("data") or []
elif isinstance(data, list):
    tokens = data
else:
    tokens = []

print(f"So token: {len(tokens)}")
if tokens:
    first = tokens[0]
    print(first.get("symbol"), first.get("address"), first.get("volume"))
```

## 5. Cau truc response (thuc te)

Field response co the thay doi theo endpoint/thoi diem. Trong project nay, de doc du lieu an toan, uu tien thu tu:

- `payload["data"]["rank"]`
- `payload["data"]["tokens"]`
- `payload["data"]["data"]`
- Hoac truc tiep `payload["data"]` neu la list

Moi token thuong co cac field huu ich:

- `symbol`, `name`, `address`
- `price`, `price_change_percent`
- `volume`, `liquidity`, `market_cap`
- `pair` (co the co `dex`, `address`)
- `creation_timestamp`

## 6. Mapping cach dung nhanh

- Lay token trend: `orderby=volume`
- Lay token moi: `orderby=created_at`
- Lay token tang manh: `orderby=price_change_percent`
- Lay token co dong tien smart money: `orderby=smart_money`

## 7. Luu y van hanh

- Dat `timeout` (vi du 30s) de tranh treo request.
- Bat exception HTTP (`raise_for_status`) va retry nhe neu can.
- Khong hard-code schema response, vi field co the doi.
- Han che tan suat goi (poll theo chu ky hop ly) de giam nguy co bi chan.
- Neu du lieu rong, nen fallback ve truy van trend `1h` + `orderby=volume`.

## 8. Tham chieu trong code hien tai

- Client GMGN: `src/getdata/gmgn/main.py`
- Ham lay va enrich du lieu: `src/getdata/gmgn/main.py`
- File output mac dinh: `res/data/gmgn_100_coins.json`


