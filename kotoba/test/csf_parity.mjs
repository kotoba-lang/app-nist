// aiueos/nist_csf.cljk（判定コア）と正本 kotoba/src/types.ts の実行 parity。
// 正本の isValidCsfCode / csfLevel / parentOf を node で直接実行し、
// guest の判定（6 Function 閉じた集合・3 段の形・親の決まり）と一致を照合。
import { isValidCsfCode, csfLevel, parentOf, CSF_FUNCTIONS } from "../src/types.ts";
import assert from "node:assert";

// guest test-code: 正当な形は通る（function / category / subcategory）
assert.equal(isValidCsfCode("GV"), true);
assert.equal(isValidCsfCode("ID.AM"), true);
assert.equal(isValidCsfCode("PR.DS-01"), true);
// guest test-fn: 6 Function の閉じた集合
assert.deepEqual([...CSF_FUNCTIONS], ["GV", "ID", "PR", "DE", "RS", "RC"]);
assert.equal(isValidCsfCode("XX"), false);
assert.equal(isValidCsfCode("XX.AB-01"), false);
// guest test-form: 3 段以外は不可
assert.equal(isValidCsfCode("GV1"), false);
assert.equal(isValidCsfCode("GV.A"), false);
assert.equal(isValidCsfCode("GV.AB-1"), false);
// guest test-level: 階層の深さ
assert.equal(csfLevel("GV"), "function");
assert.equal(csfLevel("ID.AM"), "category");
assert.equal(csfLevel("PR.DS-01"), "subcategory");
// guest test-parent: function 親無し / category の親は function /
// subcategory の親は category（ハイフン前まで）
assert.equal(parentOf("GV"), null);
assert.equal(parentOf("ID.AM"), "ID");
assert.equal(parentOf("PR.DS-01"), "PR.DS");
console.log("csf parity_vectors: all pass");
