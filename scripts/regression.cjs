/**
 * Headless regression checks for the built package.
 *
 * Kept in the repo rather than a temp directory — the throwaway copies
 * kept getting swept away by the OS between runs.
 *
 *   node scripts/regression.cjs
 */
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const {
  createEditor,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
} = require(path.join(ROOT, "node_modules/lexical"));
const p = require(path.join(ROOT, "dist/index.js"));

let failures = 0;
const ck = (label, cond, detail) => {
  if (cond) console.log(`  ok   ${label}`);
  else {
    failures++;
    console.log(`  FAIL ${label}${detail ? `\n       ${detail}` : ""}`);
  }
};
const section = (t) => console.log(`\n== ${t} ==`);

const newEditor = () =>
  createEditor({
    namespace: "regression",
    nodes: p.defaultNodes,
    onError: (e) => {
      failures++;
      console.log("  FAIL onError:", e.message);
    },
  });

/** Run `build` inside an update, then assert on the committed state. */
const withDoc = (build, assert) =>
  new Promise((resolve) => {
    const ed = newEditor();
    ed.update(
      () => {
        $getRoot().clear();
        build(ed);
      },
      {
        onUpdate: () => {
          assert(ed.getEditorState().toJSON(), ed);
          resolve();
        },
      },
    );
  });

(async () => {
  section("node registry");
  const types = p.defaultNodes.map((n) => n.getType());
  const dupes = types.filter((t, i) => types.indexOf(t) !== i);
  ck(`no duplicate types (${types.length} nodes)`, dupes.length === 0, String(dupes));
  ck("TextNode's 'text' key untouched", !types.includes("text"));
  for (const t of ["newsMoment", "contextNote", "quato2", "linkEmbed"]) {
    ck(`registered: ${t}`, types.includes(t));
  }

  section("three surfaces stay identical");
  const surf = (s) => p.getBlocksForSurface(s, p.defaultBlocks).map((b) => b.key);
  const [i, l, d] = [surf("insert"), surf("slash"), surf("draggable")];
  ck(
    `same ${i.length} blocks, same order`,
    i.length === l.length && i.length === d.length &&
      i.every((k, n) => k === l[n] && k === d[n]),
    `insert=${i.length} slash=${l.length} draggable=${d.length}`,
  );

  section("whole-document round-trip");
  const ed = newEditor();
  const inserted = p.insertAllComponents(ed);
  await new Promise((resolve) => {
    ed.update(() => {}, {
      onUpdate: () => {
        const json = ed.getEditorState().toJSON();
        const flat = JSON.stringify(json);
        ck(`document built (${inserted} blocks)`, inserted > 30);
        ck(
          "parseEditorState reproduces it byte-for-byte",
          JSON.stringify(ed.parseEditorState(flat).toJSON()) === flat,
        );
        ck(
          "every CMS type present",
          p.CMS_BLOCK_SCHEMA.every((s) => flat.includes(`"type":"${s.type}"`)),
        );
        ck("no shortcode leakage", !/#(galeri|piyasa|countdown)#/.test(flat));
        const img = json.root.children.find(
          (c) => c.type === "image" && c.options?.imageId,
        );
        ck("image(id) omits src", img && !("src" in img));
        resolve();
      },
    });
  });

  section("youtube stores the URL verbatim");
  const EMBED = "https://www.youtube-nocookie.com/embed/abc12345678?rel=0";
  await withDoc(
    () => $getRoot().append(p.$createYouTubeNode(EMBED)),
    (json) => {
      const b = json.root.children[0];
      ck("url kept as entered", b.url === EMBED, JSON.stringify(b));
      ck("no videoID written", !("videoID" in b));
    },
  );
  ck(
    "legacy videoID still imports",
    (() => {
      const legacy = JSON.stringify({
        root: {
          type: "root", format: "", indent: 0, version: 1, direction: null,
          children: [{ type: "youtube", version: 1, format: "", videoID: "abc12345678" }],
        },
      });
      const n = newEditor().parseEditorState(legacy).toJSON().root.children[0];
      return n.url === "https://www.youtube-nocookie.com/embed/abc12345678";
    })(),
  );

  section("note blocks: metadata flat, body as children");
  await withDoc(
    () => {
      const n = p.$createContextNoteNode({ title: "T", images: "1, 2" });
      n.clear();
      const para = $createParagraphNode();
      para.append($createTextNode("body"));
      n.append(para);
      $getRoot().append(n);
    },
    (json) => {
      const b = json.root.children[0];
      ck("type contextNote", b.type === "contextNote");
      ck("metadata flat", b.title === "T" && b.images === "1, 2");
      ck("no date/time", !("date" in b) && !("time" in b));
      ck("body is real children", b.children?.[0]?.type === "paragraph");
    },
  );

  section("block-level insert reaches nested containers");
  for (const [label, build, pick] of [
    ["newsMoment body", () => p.$createNewsMomentNode({ title: "T" }), (r) => r.getFirstChild().getFirstChild()],
    ["contextNote body", () => p.$createContextNoteNode({ title: "T" }), (r) => r.getFirstChild().getFirstChild()],
    ["columns column", () => {
      const cols = p.$createColumnsNode({ count: 2 });
      for (let n = 0; n < 2; n++) {
        const col = p.$createColumnNode();
        col.append($createParagraphNode());
        cols.append(col);
      }
      return cols;
    }, (r) => r.getFirstChild().getFirstChild().getFirstChild()],
  ]) {
    await new Promise((resolve) => {
      const e = newEditor();
      e.update(() => { $getRoot().clear(); $getRoot().append(build()); }, {
        onUpdate: () => {
          e.update(() => {
            pick($getRoot()).selectStart();
            $insertNodes([p.$createCmsNode("galeri", { id: "999" })]);
          }, {
            onUpdate: () => {
              const flat = JSON.stringify(e.getEditorState().toJSON());
              ck(`${label}: block landed inside`, flat.includes('"type":"galeri"') && flat.includes('"999"'));
              resolve();
            },
          });
        },
      });
    });
  }

  section("hiddenFields is pure and safe");
  const doc = { root: { type: "root", children: [
    { type: "image", version: 1, format: "", options: { alt: "A", caption: "C", maxWidth: 300 } },
    { type: "galeri", version: 1, format: "", id: "9", position: "left" },
  ] } };
  const snapshot = JSON.stringify(doc);
  const stripped = p.stripHiddenFields(doc, { image: ["caption"], galeri: ["position"] });
  ck("input untouched", JSON.stringify(doc) === snapshot);
  ck("returns a new object", stripped !== doc);
  ck("fields removed", !("caption" in stripped.root.children[0].options) && !("position" in stripped.root.children[1]));
  ck("empty config is identity", p.stripHiddenFields(doc, {}) === doc);
  ck(
    "structural keys protected",
    Array.isArray(p.stripHiddenFields(doc, { "*": ["children", "type"] }).root.children),
  );

  section("exportJSON hands out copies, not live state");
  await new Promise((resolve) => {
    const e = newEditor();
    e.update(
      () => {
        $getRoot().clear();
        $getRoot().append(
          p.$createImageNode("u", { alt: "A", caption: "C" }),
          p.$createVideoNode("v", { title: "T" }),
          p.$createAudioNode("a", { title: "T" }),
          p.$createIframeNode("i", { title: "T" }),
          p.$createImageComparisonNode("b", "c", {}),
          p.$createYouTubeNode("https://y/embed/x"),
        );
      },
      {
        onUpdate: () => {
          const a = e.getEditorState().toJSON().root.children;
          const b = e.getEditorState().toJSON().root.children;
          a.forEach((n, idx) =>
            ck(`${n.type}: separate options object per export`, n.options !== b[idx].options),
          );
          delete a[0].options.caption;
          ck(
            "mutating an export leaves the document intact",
            e.getEditorState().toJSON().root.children[0].options.caption === "C",
          );
          resolve();
        },
      },
    );
  });

  section("partial options can't produce undefined");
  const partial = JSON.stringify({ root: {
    type: "root", format: "", indent: 0, version: 1, direction: null,
    children: [
      { type: "image", version: 1, format: "", options: { alt: "A" } },
      { type: "video", version: 1, format: "", options: {} },
    ],
  } });
  newEditor().parseEditorState(partial).read(() => {
    const [img, vid] = $getRoot().getChildren();
    ck("image.caption is a string", typeof img.getOptions().caption === "string");
    ck("image.maxWidth is a number", typeof img.getOptions().maxWidth === "number");
    ck("video.title is a string", typeof vid.getOptions().title === "string");
    let threw = null;
    try { img.getOptions().caption.trim(); vid.getOptions().poster.trim(); }
    catch (e) { threw = e.message; }
    ck(".trim() does not throw", threw === null, String(threw));
  });

  section("inline text styles are additive");
  await withDoc(
    () => {
      const para = $createParagraphNode();
      const t = $createTextNode("x");
      t.setFormat(9);
      t.setStyle("color: #ef4444;");
      para.append(t);
      $getRoot().append(para);
    },
    (json, e) => {
      const styled = p.withInlineTextStyles(JSON.parse(JSON.stringify(json)));
      const run = styled.root.children[0].children[0];
      ck("css merges format + style", /font-weight: 700/.test(run.css) && /#ef4444/.test(run.css), run.css);
      ck(
        "styled JSON still re-imports",
        JSON.stringify(e.parseEditorState(JSON.stringify(styled)).toJSON()) === JSON.stringify(json),
      );
    },
  );

  section("i18n defaults to Turkish");
  ck("default locale is tr", p.DEFAULT_LOCALE === "tr");
  ck("tr cancel", p.trMessages.cancel === "Vazgeç");
  ck("en cancel", p.enMessages.cancel === "Cancel");
  ck("overrides merge", p.resolveMessages("tr", { cancel: "X" }).cancel === "X");
  ck("unknown locale falls back", p.resolveMessages(undefined).cancel === "Vazgeç");

  console.log(
    failures === 0 ? "\nAll checks passed.\n" : `\n${failures} check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
})();
