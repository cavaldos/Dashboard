# Huong Dan Su Dung Strategy

Tai lieu nay huong dan cach chon, cau hinh va van hanh cac strategy cua bot theo huong thuc chien. Muc tieu la giup ban biet khi nao nen dung `FTrend`, `SlowCook`, `SuperTrend`, can chinh tham so nao truoc, va cach giam rui ro khi bat `Auto Buy`.

## 1. Strategy la gi?

Strategy la bo quy tac loc token de bot quyet dinh:

- token nao du dieu kien de vao lenh
- vao o giai doan nao (`AB` hoac `Mig`)
- co tu dong mua hay chi bao tin hieu

Bot hien co 3 strategy chinh:

- `FTrend`: bat token moi, momentum nhanh
- `SlowCook`: loc token da song lau hon, chat luong on dinh hon
- `SuperTrend`: dua tren tin hieu KOL tren X/Twitter

## 2. Chon strategy nao?

### `FTrend`

Dung khi:

- ban muon vao som
- uu tien token moi, dong tien vao nhanh
- chap nhan rui ro cao de doi lay upside lon

Phu hop voi:

- market nong
- memecoin dang pump nhanh
- trader thich scalp, vao nhanh ra nhanh

### `SlowCook`

Dung khi:

- ban muon loc token chat hon
- muon giam nguy co rug so voi token moi ra
- uu tien volume that, fee that, nguoi dung that

Phu hop voi:

- market sideway
- trader uu tien chat luong hon so luong
- nguoi moi muon bot it vao lenh rac

### `SuperTrend`

Dung khi:

- ban muon follow social signal
- ban co danh sach KOL rieng
- ban tin vao hieu ung nhieu KOL cung nhac 1 ticker

Phu hop voi:

- token dang duoc ban tan tren X
- muon dung social signal lam lop xac nhan them
- ket hop voi `FTrend` hoac `SlowCook`

## 3. Hieu 2 phase: `AB` va `Mig`

- `AB` = `Almost Bonded`: token con o bonding curve, bien dong lon, rui ro cao, upside cung cao
- `Mig` = `Migrated`: token da len PumpSwap/AMM, thanh khoan tot hon, on dinh hon

Goi y:

- nguoi moi: uu tien bat `Mig` truoc
- da co kinh nghiem: co the bat ca `AB` va `Mig`
- neu `AB` bat `Auto Buy`, can TP/SL va so tien vao lenh rat chat

## 4. Quy trinh setup dung strategy

### Buoc 1: Bat che do Simulation truoc

Truoc khi dung strategy, hay test bang `SIM`:

- reset sim balance
- dat `Buy Amount` nho
- chua bat `Auto Buy` ngay neu chua quen

Khuyen nghi:

- `Buy Amount`: `0.1 - 0.5 SOL`
- `Slippage`: `300 - 1000 bps`
- `Priority Fee`: bat dau tu muc mac dinh

### Buoc 2: Chon 1 strategy de test

Khong nen bat ca 3 strategy ngay tu dau. Nen di theo thu tu:

1. `SlowCook Mig`
2. `FTrend Mig`
3. `FTrend AB`
4. `SuperTrend`

Ly do: di tu strategy on dinh hon sang strategy nhanh va kho hon.

### Buoc 3: Bat `Enabled`, tat `Auto Buy`

O vong test dau tien:

- bat `Enabled`
- tat `Auto Buy`
- quan sat token nao strategy dang loc ra
- kiem tra chat luong tin hieu trong mot vai gio

Neu thay tin hieu hop ly moi bat `Auto Buy`.

### Buoc 4: Cau hinh TP/SL truoc khi cho bot mua that

Toi thieu nen co:

- `SL` de cat lo
- 2 hoac 3 moc `TP`
- `Trailing Stop` hoac `AutoTrail`

Mot cau hinh de test:

```text
TP1: +50%  -> sell 25%
TP2: +150% -> sell 25%
SL:  -25%  -> sell 100%
AutoTrail: 10%
```

### Buoc 5: Bat `Auto Buy`

Chi bat khi ban da ro:

- strategy dang loc dung kieu token ban muon
- TP/SL da duoc set
- max trades, cooldown, max positions da co gioi han

## 5. Cach dung `FTrend`

### Muc tieu

Bat token moi, co momentum manh, vao nhanh ra nhanh.

### Cac tham so nen uu tien

### `AB`

- `Max Age`: cang thap thi cang moi
- `Min Volume`: loc bot token qua yeu
- `Min Fee`: loc token co giao dich that
- `Max Bundle`: tranh token bi gom qua nhieu
- `Max Fresh`: tranh qua nhieu vi moi
- `Min Real`: uu tien user that

### `Mig`

- giong `AB`, nhung nen de `Min Volume` va `Min MCap` cao hon

### Cach set an toan

```text
FTrend Mig:
- Enabled: ON
- Auto Buy: OFF trong 1-2 ngay dau
- Max Age: 300s
- Min Volume: 100k+
- Min Fee: 6+
- Min Real: 15-20%
- Max Bundle: <= 40-45%
```

### Khi nao nen dung

- market dang rat nhanh
- co nhieu token moi len trend
- ban san sang cat lo nhanh

### Khi nao khong nen dung

- market xau, thanh khoan kem
- ban khong the theo doi position thuong xuyen
- chua co SL/Trail ro rang

### Loi hay gap

- de `Max Age` qua rong -> vao token da muon
- `Min Volume` qua thap -> bot mua ca token chat luong kem
- bat `AB Auto Buy` qua som -> drawdown nhanh

## 6. Cach dung `SlowCook`

### Muc tieu

Loc token da ton tai du lau, co chat luong nguoi dung va dong tien tot hon.

### Cac tham so nen uu tien

- `Min Age`: dam bao token da duoc "nau chin"
- `Min Volume`: xac nhan co dong tien that
- `Min Fee`: xac nhan muc do giao dich
- `Min MCap` va `Max MCap`: giu token trong vung von hoa ban muon
- `Min Real`: rat quan trong voi `SlowCook`
- `Max Bundle`: can giu chat hon `FTrend`

### Cach set can bang

```text
SlowCook Mig:
- Enabled: ON
- Auto Buy: OFF trong vong test dau
- Min Age: 3600s+
- Min Volume: 300k+
- Min Fee: 23+
- Min MCap: 30k+
- Max MCap: 150k
- Min Real: 25%+
- Max Bundle: <= 40%
```

### Khi nao nen dung

- muon quality over quantity
- muon giam bot lenh rac
- muon giu tam ly de hon khi de bot chay

### Khi nao khong nen dung

- ban dang tim token sieu som
- ban muon tan cong nhung pha pump rat som

### Loi hay gap

- `Min Age` qua cao -> bo lo nhieu co hoi
- `Min Real` qua thap -> strategy mat chat
- bo qua `Max MCap` -> de vao token da qua cao

## 7. Cach dung `SuperTrend`

### Muc tieu

Dung social signal tu KOL de loc token dang duoc nhac den.

### Cac tham so nen uu tien

- `Min Followers`: loc tai khoan nho/spam
- `Max Post Age`: tin phai moi
- `Min Same Ticker`: can bao nhieu KOL cung nhac
- `KOL Only`: chi mua token duoc KOL trong list cua ban nhac den
- `Min Volume`, `Min Fee`, `Min MCap`: dung de tranh vao tin hieu ao

### Cach set an toan

```text
SuperTrend Mig:
- Enabled: ON
- Auto Buy: OFF trong giai doan dau
- Min Followers: 5000+
- Max Post Age: 15-30m
- Min Same Ticker: 3-4
- KOL Only: ON
- KOL List: chi giu nhung tai khoan ban tin
```

### Khi nao nen dung

- co bo KOL theo doi ro rang
- muon dung social signal lam filter bo sung
- thi truong dang nhay theo narrative, trend va influencer

### Khi nao khong nen dung

- khong co KOL list chat luong
- thi truong nhieu, post nhieu nhung khong co dong tien that

### Loi hay gap

- `Min Same Ticker` qua thap -> bi nhieu tin hieu rac
- `Max Post Age` qua rong -> vao tin hieu da tre
- tat `KOL Only` qua som -> mo rong qua muc can thiet

## 8. Nen bat strategy nao truoc?

Neu ban moi dung bot:

1. `SlowCook Mig`
2. `FTrend Mig`
3. `SuperTrend Mig`
4. `FTrend AB`

Neu ban da quen memecoin trading:

1. `FTrend Mig`
2. `FTrend AB`
3. `SuperTrend`
4. `SlowCook` de loc lenh chat hon trong ngay xau

## 9. Cach ket hop strategy

Khong co nghia phai bat ca 3 strategy cung luc. Nen ket hop theo muc dich.

### Cach 1: `FTrend` + `SlowCook`

- `FTrend` de bat nhung lenh nhanh
- `SlowCook` de bo sung nhung lenh chat hon

### Cach 2: `SuperTrend` lam lop xac nhan

- dung `SuperTrend` de xem token co duoc KOL nhac den khong
- neu co, moi mo rong `Auto Buy` cho `FTrend` hoac `SlowCook`

### Cach 3: tach phase

- `FTrend AB`: tat hoac de rat chat
- `FTrend Mig`: rong hon mot chut
- `SlowCook Mig`: de chay nen

## 10. Checklist truoc khi bat `Auto Buy`

- `Enabled` da bat
- da test bang `SIM`
- da xem signal it nhat vai chuc lenh
- co `SL`, `TP`, `AutoTrail`
- `Buy Amount` nho
- `Max Trades/hr` da gioi han
- `Cooldown` da set
- `Max Positions` da set
- biet ro strategy dang target phase nao: `AB` hay `Mig`

## 11. Mau cau hinh goi y

### Mau 1 - Nguoi moi

```text
Strategy: SlowCook Mig
Buy Amount: 0.1 - 0.25 SOL
Auto Buy: OFF -> ON sau khi da quan sat
TP1: +50% -> 25%
TP2: +150% -> 25%
SL: -20% -> 100%
AutoTrail: 10%
```

### Mau 2 - Can bang

```text
Strategy: FTrend Mig + SlowCook Mig
Buy Amount: 0.25 - 0.5 SOL
Max Positions: 3 - 5
Cooldown: 1000 - 3000ms
TP1: +50% -> 20%
TP2: +100% -> 30%
TP3: +300% -> 20%
SL: -25% -> 100%
AutoTrail: 10%
```

### Mau 3 - Aggressive

```text
Strategy: FTrend AB + FTrend Mig
Buy Amount: nho, chia von ky
AB chi bat khi da test ky
SL: bat buoc co
MCap Zone: nen bat
Dynamic Zone: uu tien neu ban trade memecoin bien dong manh
```

## 12. Quan ly rui ro khi dung strategy

- khong all-in vao 1 strategy
- khong de `Auto Buy` chay Live neu chua qua `SIM`
- uu tien `Mig` truoc `AB`
- moi strategy chi nen chinh 1 vai tham so mot lan roi quan sat ket qua
- neu bot vao qua nhieu lenh xau, thu siet `Min Volume`, `Min Real`, `Max Bundle`
- neu bot bo lo qua nhieu lenh ngon, thu noi `Age`, `Volume`, `Same Ticker` hoac `MCap`

## 13. Cach danh gia strategy co hop hay khong

Sau 1-3 ngay test, xem lai:

- so lenh vao co qua nhieu hay qua it
- ty le token bi dump ngay sau khi mua
- strategy co dang mua dung phase ban muon khong
- TP1 co thuong xuyen duoc hit khong
- SL co bi cham lien tuc khong
- lenh thang co du bu cho lenh thua khong

Neu chua on, khong can thay tat ca. Hay sua tung nhom:

- chat luong token: `Volume`, `Fee`, `Real`, `Bundle`
- do som/muon cua entry: `Age`, `Post Age`
- do chat cua social signal: `Followers`, `Same Ticker`, `KOL Only`

## 14. Ket luan

- muon nhanh, san sang rui ro cao: dung `FTrend`
- muon chat luong, on dinh hon: dung `SlowCook`
- muon them social signal: dung `SuperTrend`

Chien luoc tot nhat khong phai strategy vao lenh nhieu nhat, ma la strategy phu hop voi khau vi rui ro, khung gio giao dich va cach ban quan ly position.
