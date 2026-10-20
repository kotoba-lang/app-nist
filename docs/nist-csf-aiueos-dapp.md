# app-nist（CSF コード）— itonami（dapp）上の分散型設計

状態: 第 1 スライス実装（2026-10-20）。正本はこの文書。
追跡: Linear JUN-128（親 JUN-116）。

## 位置づけ

app-nist は NIST CSF 2.0 のインテリジェンス（6 Function + Tier Gap +
CMMC L2 + SP 1302 Community Profile、106 subcategory 全量 + クロス
フレームワーク mapping）。logical actor（SQL :Actor node、Worker 無し）。
この project の wasm 面は T3 fallback（actor-manifest へ移行済み）。

## このスライス: CSF コード判定コア

| 層 | 実体 | 状態 |
|---|---|---|
| 判定コア guest | `aiueos/nist_csf.cljk` — csf-code-ok（**6 Function の閉じた集合** GV/ID/PR/DE/RS/RC × **3 段の形**（2 大文字 / X.YY / X.YY-NN））/ csf-level（階層の深さ）/ parent-kind（**function 親無し / category の親は function / subcategory の親は category**） | **実装済み・実測** |
| 記述子 | `aiueos/nist-csf.edn` | **実装済み** |
| parity | `kotoba/test/csf_parity.mjs` — **正本 types.ts を node で直接実行**（isValidCsfCode / csfLevel / parentOf）して一致 | **実装済み・実測** |

実測: `amu test aiueos/nist_csf.cljk` → **18/18**（jvm-kir / js / wasm）。
parity → **all pass**（正当形 3 / 集合外 2 / 形外 3 / level 3 / parent 3）。

## 正本の正確な規則（guest はこれに追従 —— types.ts の明文）

- **CSF_FUNCTIONS** = GV / ID / PR / DE / RS / RC（NIST CSF 2.0 の 6 Function）。
- コードの形: `^[A-Z]{2}$`（function）/ `^[A-Z]{2}\.[A-Z]{2}$`（category）/
  `^[A-Z]{2}\.[A-Z]{2}-\d{2}$`（subcategory）。Function が 6 つの中であること
  が形と同じくらい必須（`isValidCsfCode` は両方見る）。
- `parentOf`: function → null / category → 先頭 2 文字（function）/
  subcategory → ハイフン前（category）。

## 実測メモ

- parity 初回で親の期待を誤った（`parentOf("ID.AM")` は "ID" —— 先祖ではなく
  **1 段上**の親）。guest の parent-kind（親の form-code を返す）は正しく
  この 1 段上の規則を表す —— fixture を実測値に訂正。

## 未実装境界

- ancestor chain（function-first の全祖先）、Tier Gap / CMMC L2 / SP 1302 の
  mapping 判定。
- 106 subcategory の中身（seed.ts のデータ）。
- mon（DNA）化、aiueos session 載せ（fleet 共通）。
