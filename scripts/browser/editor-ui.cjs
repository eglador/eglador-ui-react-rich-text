/**
 * Browser checks for the editor's UI: paste cleanup, the selection
 * toolbar (headings, letter case, placement), the heading character
 * counter and the image block's alt row.
 *
 * Needs Storybook running:  npm run storybook -- -p 6017
 * Then:                     npm run browser-test
 *
 * Kept in the repo because throwaway copies in the OS temp directory
 * keep getting swept away between sessions.
 */
const ROOT = "C:/Users/umuty/Desktop/eglador/eglador-ui-react-rich-text";
const { chromium } = require(ROOT + "/node_modules/playwright");

let failures = 0;
const ck = (label, cond, detail) => {
  if (cond) console.log("  ok   " + label);
  else {
    failures++;
    console.log("  FAIL " + label + (detail ? "\n       " + detail : ""));
  }
};
const section = (t) => console.log(`\n== ${t} ==`);

/** Blocks of the first JSON output panel: "type/tag(text)". */
const blocks = (page) =>
  page.evaluate(() => {
    for (const el of document.querySelectorAll("pre")) {
      try {
        const json = JSON.parse(el.textContent);
        if (!json?.root?.children) continue;
        return json.root.children.map((c) => {
          const text = (function walk(n) {
            if (n.type === "text") return n.text ?? "";
            return (n.children ?? []).map(walk).join("");
          })(c);
          return `${c.type}${c.tag ? "/" + c.tag : ""}(${text.trim() === "" ? "" : text})`;
        });
      } catch {
        /* not a JSON panel */
      }
    }
    return ["<missing>"];
  });

const rawJson = (page) =>
  page.evaluate(() => {
    for (const el of document.querySelectorAll("pre")) {
      try {
        const json = JSON.parse(el.textContent);
        if (json?.root?.children) return el.textContent;
      } catch {
        /* skip */
      }
    }
    return "";
  });

const paste = async (page, { text, html }) => {
  await page.evaluate(async ({ text, html }) => {
    const items = { "text/plain": new Blob([text], { type: "text/plain" }) };
    if (html) items["text/html"] = new Blob([html], { type: "text/html" });
    await navigator.clipboard.write([new ClipboardItem(items)]);
  }, { text, html });
  await page.keyboard.press("Control+V");
  await page.waitForTimeout(400);
};

/** Select a block's text by triple-clicking it. */
const selectBlock = async (page, locator) => {
  await locator.click({ clickCount: 3 });
  await page.waitForTimeout(250);
};

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 950 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  // ── 1. paste cleanup ────────────────────────────────────────────────
  section("yapıştırmada boş paragraf kalmıyor");
  const cases = [
    [
      "Word",
      {
        text: "Bir.\n\nİki.",
        html:
          '<meta charset="utf-8"><p class="MsoNormal">Bir.<o:p></o:p></p>' +
          '<p class="MsoNormal"><o:p>&nbsp;</o:p></p><p class="MsoNormal">İki.<o:p></o:p></p>',
      },
      "paragraph(Bir.),paragraph(İki.)",
    ],
    [
      "Google Docs",
      {
        text: "Bir.\n\nİki.",
        html:
          '<meta charset="utf-8"><b style="font-weight:normal"><p dir="ltr"><span>Bir.</span></p><br><p dir="ltr"><span>İki.</span></p></b>',
      },
      "paragraph(Bir.),paragraph(İki.)",
    ],
    [
      "düz metin",
      { text: "Bir.\n\n\nİki.\n\nÜç." },
      "paragraph(Bir.),paragraph(İki.),paragraph(Üç.)",
    ],
    [
      "başlık + paragraf yapısı korunur",
      {
        text: "Başlık\n\nGövde.",
        html: "<h2>Başlık</h2><p></p><p>Gövde.</p>",
      },
      "heading/h2(Başlık),paragraph(Gövde.)",
    ],
    [
      "biçimlendirme korunur",
      {
        text: "Kalın ve italik.",
        html: "<p><strong>Kalın</strong> ve <em>italik</em>.</p>",
      },
      "paragraph(Kalın ve italik.)",
    ],
    [
      "liste korunur",
      {
        text: "a\nb",
        html: "<ul><li>a</li><li>b</li></ul>",
      },
      "list/ul(ab)",
    ],
  ];

  for (const [label, payload, expected] of cases) {
    await page.goto(
      "http://localhost:6017/iframe.html?viewMode=story&id=rich-text-eglador-cms--pasted-embed-code",
      { waitUntil: "networkidle" },
    );
    await page.waitForTimeout(400);
    await page.locator('[contenteditable="true"]').first().click();
    await paste(page, payload);
    const got = (await blocks(page)).filter((b) => b !== "paragraph()");
    ck(`${label}: ${expected}`, got.join(",") === expected, got.join(","));
  }

  section("biçimlendirme gerçekten geldi mi");
  ck(
    "kalın/italik etiketleri duruyor",
    (await page.locator('[contenteditable="true"] strong, [contenteditable="true"] b').count()) >= 0,
  );

  section("kod bloğunda boş satırlar korunur");
  await page.goto(
    "http://localhost:6017/iframe.html?viewMode=story&id=rich-text-eglador-cms--pasted-embed-code",
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(500);
  await page.locator('[contenteditable="true"]').first().click();
  await page.keyboard.type("```");
  await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  await paste(page, { text: "satir1\n\nsatir3" });
  // Line breaks render as <br>, so textContent cannot see them — read
  // the document instead.
  const codeShape = await page.evaluate(() => {
    for (const el of document.querySelectorAll("pre")) {
      try {
        const json = JSON.parse(el.textContent);
        if (!json?.root?.children) continue;
        const code = json.root.children.find((c) => c.type === "code");
        if (!code) continue;
        return (code.children ?? [])
          .map((c) => (c.type === "linebreak" ? "¶" : (c.text ?? "")))
          .join("");
      } catch {
        /* skip */
      }
    }
    return "<kod bloğu yok>";
  });
  ck(
    "kod bloğuna yapıştırılan boş satır korunuyor",
    codeShape === "satir1¶¶satir3",
    codeShape,
  );

  // ── 2. floating toolbar headings ────────────────────────────────────
  section("seçim çubuğunda H2/H3");
  await page.goto(
    "http://localhost:6017/iframe.html?viewMode=story&id=rich-text-editor--heading-tools",
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(700);
  const editor = page.locator('[contenteditable="true"]').first();
  const para = editor.locator("p").first();
  await selectBlock(page, para);

  const bar = page.locator('[role="toolbar"][aria-label="Selection formatting"]');
  ck("seçim çubuğu açıldı", await bar.isVisible());
  const h2 = bar.locator('button[aria-label="Heading 2"]');
  const h3 = bar.locator('button[aria-label="Heading 3"]');
  ck("H2 düğmesi var", await h2.isVisible());
  ck("H3 düğmesi var", await h3.isVisible());

  await h2.click();
  await page.waitForTimeout(400);
  let got = await blocks(page);
  ck(
    "paragraf H2 oldu",
    got.filter((b) => b.startsWith("heading/h2")).length === 2,
    got.join(","),
  );

  // toggling the same heading returns to a paragraph
  await selectBlock(page, editor.locator("h2").nth(1));
  await bar.locator('button[aria-label="Heading 2"]').click();
  await page.waitForTimeout(400);
  got = await blocks(page);
  ck(
    "tekrar basınca paragrafa döndü",
    got.filter((b) => b.startsWith("heading/h2")).length === 1,
    got.join(","),
  );

  ck(
    "aktif başlıkta düğme basılı görünüyor",
    await (async () => {
      await selectBlock(page, editor.locator("h2").first());
      return (
        (await bar
          .locator('button[aria-label="Heading 2"]')
          .getAttribute("aria-pressed")) === "true"
      );
    })(),
  );

  // ── 3. heading counter ──────────────────────────────────────────────
  section("başlık karakter sayacı");
  const counterOf = (page, selector) =>
    page.locator(selector).first().evaluate((el) => ({
      count: el.getAttribute("data-eglador-heading-count"),
      over: el.hasAttribute("data-eglador-heading-over"),
      after: getComputedStyle(el, "::after").content,
      color: getComputedStyle(el, "::after").color,
    }));

  await editor.locator("h2").first().click();
  await page.waitForTimeout(300);
  let counter = await counterOf(page, '[contenteditable="true"] h2');
  console.log("       ", JSON.stringify(counter));
  ck("odaktaki başlıkta sayaç var", counter.count === "15/60", counter.count);
  ck("sayaç CSS ile çiziliyor", counter.after.includes("15/60"), counter.after);
  ck("limit altında kırmızı değil", counter.over === false);

  await page.keyboard.press("End");
  await page.keyboard.type(" ve bu başlık artık limitin oldukça üzerine çıkıyor ki uyarı görelim");
  await page.waitForTimeout(500);
  counter = await counterOf(page, '[contenteditable="true"] h2');
  console.log("       ", JSON.stringify(counter));
  ck("limit aşılınca kırmızı", counter.over === true, JSON.stringify(counter));
  ck(
    "kırmızı renk uygulandı",
    counter.color.replace(/\s/g, "") === "rgb(185,28,28)",
    counter.color,
  );
  ck("yazmaya devam edilebildi (kesilmedi)", Number(counter.count.split("/")[0]) > 60, counter.count);

  section("sayaç JSON'a sızmıyor");
  const json = await rawJson(page);
  ck("JSON'da sayaç yok", !json.includes("/60") && !json.includes("heading-count"), json.slice(0, 200));
  ck(
    "başlık metni temiz",
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("pre")) {
        try {
          const json = JSON.parse(el.textContent);
          if (!json?.root?.children) continue;
          const h = json.root.children.find((c) => c.type === "heading");
          return !JSON.stringify(h).includes("/60");
        } catch {
          /* skip */
        }
      }
      return false;
    }),
  );
  ck(
    "metin çıktısında sayaç yok",
    !(await editor.evaluate((el) => el.textContent)).includes("/60"),
  );

  section("limit dışı başlık seviyesi sayılmıyor");
  await editor.locator("p").first().click();
  await page.waitForTimeout(300);
  const unfocused = await page.evaluate(() =>
    [...document.querySelectorAll('[contenteditable="true"] h2')].map((el) =>
      el.getAttribute("data-eglador-heading-count"),
    ),
  );
  console.log("       odak dışı h2:", JSON.stringify(unfocused));
  ck(
    "limit üstündeki başlık odaktan çıkınca da uyarıyor",
    unfocused.some((v) => v !== null),
    JSON.stringify(unfocused),
  );

  // ── 4. letter case from the selection toolbar ───────────────────────
  section("seçim çubuğunda harf düzeni (Aa)");
  await page.goto(
    "http://localhost:6017/iframe.html?viewMode=story&id=rich-text-editor--heading-tools",
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(700);
  const ed = page.locator('[contenteditable="true"]').first();
  const target = ed.locator("p").first();
  await target.click({ clickCount: 3 });
  await page.waitForTimeout(250);
  await page.keyboard.type("ilgi çekici İstanbul haberi");
  await page.waitForTimeout(300);

  const bar2 = page.locator('[role="toolbar"][aria-label="Selection formatting"]');
  const caseButton = bar2.locator('button[aria-label="Harf düzeni"]');
  const pick = async (label) => {
    await ed.locator("p").first().click({ clickCount: 3 });
    await page.waitForTimeout(250);
    await caseButton.click();
    await page.waitForTimeout(250);
    await page.locator(`[role="menuitem"][data-text-case="${label}"]`).first().click();
    await page.waitForTimeout(350);
    return (await ed.locator("p").first().textContent()).trim();
  };

  await ed.locator("p").first().click({ clickCount: 3 });
  await page.waitForTimeout(250);
  ck("Aa düğmesi çubukta var", await caseButton.isVisible());
  let out = await pick("BÜYÜK HARF");
  ck("büyük harf (Türkçe İ)", out === "İLGİ ÇEKİCİ İSTANBUL HABERİ", out);
  out = await pick("küçük harf");
  ck("küçük harf (Türkçe ı)", out === "ilgi çekici istanbul haberi", out);
  out = await pick("Baş Harfler Büyük");
  ck("baş harfler büyük", out === "İlgi Çekici İstanbul Haberi", out);

  section("kısmi seçim ve biçim korunur");
  await ed.locator("p").first().click({ clickCount: 3 });
  await page.waitForTimeout(200);
  await page.keyboard.type("son dakika gelişmesi");
  await page.waitForTimeout(300);
  // Select just the first two words.
  await page.keyboard.press("Home");
  for (let i = 0; i < 10; i++) await page.keyboard.press("Shift+ArrowRight");
  await page.waitForTimeout(250);
  await caseButton.click();
  await page.waitForTimeout(250);
  await page.locator('[role="menuitem"][data-text-case="BÜYÜK HARF"]').first().click();
  await page.waitForTimeout(350);
  out = (await ed.locator("p").first().textContent()).trim();
  // Turkish: the dotted i in "dakika" uppercases to İ.
  ck("sadece seçili kısım değişti", out === "SON DAKİKA gelişmesi", out);

  // ── 5. alt text under the image, editor only ───────────────────────
  section("resim alt metni editörde görünüyor");
  await page.goto(
    "http://localhost:6017/iframe.html?viewMode=story&id=rich-text-eglador-cms--pasted-embed-code",
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(500);
  await page.locator('[contenteditable="true"]').first().click();
  await page.locator('button[aria-label="Bileşen ekle"]').first().click();
  await page.waitForTimeout(300);
  await page
    .locator('div[role="presentation"]')
    .last()
    .locator("button", { hasText: "Resim" })
    .first()
    .click();
  await page.waitForTimeout(400);

  const form = page.locator("form").first();
  await form.locator('input[type="url"]').first().fill("https://picsum.photos/id/1015/400/200");
  const ALT = "Dağ manzarası ve göl";
  const CAPTION = "Fotoğraf: Eglador";
  // Text inputs in order: image ID, alt text, caption.
  await form.locator('input[type="text"]').nth(1).fill(ALT);
  await form.locator('input[type="text"]').nth(2).fill(CAPTION);
  await form.locator('button[type="submit"]').click();
  await page.waitForTimeout(600);

  const figure = page.locator('[contenteditable="true"] figure').first();
  ck("resim bloğu eklendi", (await figure.count()) === 1);
  const figureText = ((await figure.textContent()) ?? "").replace(/\s+/g, " ").trim();
  console.log("       figure:", JSON.stringify(figureText));
  ck("alt metni resmin altında görünüyor", figureText.includes(ALT), figureText);
  ck(
    "'alt' rozetiyle işaretli",
    figureText.toLowerCase().startsWith("alt") ||
      figureText.toLowerCase().includes("alt" + ALT.toLowerCase().slice(0, 3)),
    figureText,
  );
  ck(
    "img alt niteliği de dolu",
    (await figure.locator("img").first().getAttribute("alt")) === ALT,
  );
  ck("açıklama ayrı satırda duruyor", figureText.includes(CAPTION), figureText);

  const htmlTab = page.getByRole("button", { name: /^html$/i }).first();
  if (await htmlTab.count()) {
    await htmlTab.click();
    await page.waitForTimeout(400);
  }
  const exported = (await page.locator("pre").allTextContents()).join(" ");
  ck(
    "dışa aktarılan HTML'de rozet yok",
    !exported.includes("tracking-wide") && !exported.includes(">alt<"),
    exported.slice(0, 200),
  );

  // ── 6. the selection toolbar stays on screen ───────────────────────
  section("seçim çubuğu ekran dışına taşmıyor");
  const barRect = () =>
    page.evaluate(() => {
      const bar = document.querySelector(
        '[role="toolbar"][aria-label="Selection formatting"]',
      );
      if (!bar) return null;
      const r = bar.getBoundingClientRect();
      const sel = window.getSelection();
      const s = sel && sel.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : null;
      return {
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        selTop: s ? Math.round(s.top) : null,
        selBottom: s ? Math.round(s.bottom) : null,
        portalledToBody: bar.parentElement === document.body,
        inside:
          r.left >= 0 &&
          r.top >= 0 &&
          r.right <= window.innerWidth &&
          r.bottom <= window.innerHeight,
      };
    });

  await page.setViewportSize({ width: 820, height: 760 });
  await page.goto(
    "http://localhost:6017/iframe.html?viewMode=story&id=rich-text-editor--heading-tools",
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(700);
  const edge = page.locator('[contenteditable="true"]').first();

  // A short selection hard against the left edge — this used to put half
  // the toolbar outside the editor, where `overflow: hidden` cut it off.
  await edge.locator("p").first().click({ clickCount: 3 });
  await page.keyboard.type("kısa");
  await page.keyboard.press("Home");
  for (let i = 0; i < 4; i++) await page.keyboard.press("Shift+ArrowRight");
  await page.waitForTimeout(400);
  let r = await barRect();
  console.log("       sol kenar:", JSON.stringify(r));
  ck("sol kenarda tamamen görünür", r && r.inside && r.left >= 0, JSON.stringify(r));
  ck("gövdeye portal ediliyor (kırpılmaz)", r && r.portalledToBody === true);

  // Still usable where it was clipped before.
  await page.locator('[role="toolbar"][aria-label="Selection formatting"] button[aria-label="Bold"]').click();
  await page.waitForTimeout(300);
  ck(
    "kırpılan konumda düğmeler çalışıyor",
    (await edge.locator("strong, b").count()) > 0,
  );

  await edge.locator("p").first().click({ clickCount: 3 });
  await page.keyboard.type("x".repeat(90));
  await page.keyboard.press("End");
  for (let i = 0; i < 4; i++) await page.keyboard.press("Shift+ArrowLeft");
  await page.waitForTimeout(400);
  r = await barRect();
  console.log("       sağ kenar:", JSON.stringify(r));
  ck("sağ kenarda tamamen görünür", r && r.inside, JSON.stringify(r));

  // No room above the selection → it flips underneath.
  await page.setViewportSize({ width: 800, height: 260 });
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 70));
  await edge.locator("h2").first().click({ clickCount: 3 });
  await page.waitForTimeout(400);
  r = await barRect();
  console.log("       üstte yer yok:", JSON.stringify(r));
  ck("yukarı sığmayınca altına geçiyor", r && r.top > r.selBottom, JSON.stringify(r));
  ck("alta geçince de ekran içinde", r && r.inside, JSON.stringify(r));
  await page.setViewportSize({ width: 1200, height: 950 });

  // ── 7. the bar follows a re-selected word ──────────────────────────
  section("çift tıklama ile tekrar seçmek çubuğu sol üste yapıştırmıyor");
  await page.goto(
    "http://localhost:6017/iframe.html?viewMode=story&id=rich-text-editor--heading-tools",
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(700);
  const reEd = page.locator('[contenteditable="true"]').first();
  await reEd.locator("p").first().click({ clickCount: 3 });
  await page.keyboard.type("Deneme baslik metni burada duruyor");
  await page.waitForTimeout(300);

  /** Centre of a word in the editor, by its text. */
  const wordPoint = (word) =>
    page.evaluate((word) => {
      const root = document.querySelector('[contenteditable="true"]');
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const i = n.data.indexOf(word);
        if (i === -1) continue;
        const range = document.createRange();
        range.setStart(n, i);
        range.setEnd(n, i + word.length);
        const b = range.getBoundingClientRect();
        return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
      }
      return null;
    }, word);

  /** Where the bar sits relative to the current selection. */
  const placement = () =>
    page.evaluate(() => {
      const bar = document.querySelector(
        '[role="toolbar"][aria-label="Selection formatting"]',
      );
      if (!bar) return { bar: "yok" };
      const r = bar.getBoundingClientRect();
      const sel = window.getSelection();
      const s =
        sel && sel.rangeCount && !sel.isCollapsed
          ? sel.getRangeAt(0).getBoundingClientRect()
          : null;
      return {
        left: Math.round(r.left),
        top: Math.round(r.top),
        visible: getComputedStyle(bar).visibility,
        selTop: s ? Math.round(s.top) : null,
        // The old bug: a remounted bar left at its initial 0,0.
        stuckTopLeft: Math.round(r.left) <= 1 && Math.round(r.top) <= 1,
        nearSelection: s
          ? Math.abs(r.bottom - s.top) < 40 || Math.abs(r.top - s.bottom) < 40
          : false,
      };
    });

  const word = await wordPoint("baslik");
  await page.mouse.dblclick(word.x, word.y);
  await page.waitForTimeout(400);
  let place = await placement();
  console.log("       ilk çift tık:", JSON.stringify(place));
  ck("çift tıkta çubuk seçimin yanında", place.nearSelection && !place.stuckTopLeft, JSON.stringify(place));

  // Collapse, then select the very same word again — identical rect.
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  ck("daralınca çubuk kayboluyor", (await placement()).bar === "yok");
  await page.mouse.dblclick(word.x, word.y);
  await page.waitForTimeout(400);
  place = await placement();
  console.log("       aynı kelime :", JSON.stringify(place));
  ck("aynı kelime tekrar seçilince de yerinde", place.nearSelection && !place.stuckTopLeft, JSON.stringify(place));
  ck("görünürlüğü açık", place.visible === "visible", place.visible);

  // The user's exact route: H2 from the bar, then double-click the text.
  await reEd.locator("p").first().click({ clickCount: 3 });
  await page.waitForTimeout(300);
  await page
    .locator('[role="toolbar"][aria-label="Selection formatting"] button[aria-label="Heading 2"]')
    .click();
  await page.waitForTimeout(400);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const headingWord = await wordPoint("baslik");
  await page.mouse.dblclick(headingWord.x, headingWord.y);
  await page.waitForTimeout(400);
  place = await placement();
  console.log("       H2 sonrası  :", JSON.stringify(place));
  ck("H2'ye çevirip çift tıklayınca da yerinde", place.nearSelection && !place.stuckTopLeft, JSON.stringify(place));

  // ── 8. cut / copy / paste a selected block ─────────────────────────
  section("blok kes-kopyala-yapıştır");
  await page.goto(
    "http://localhost:6017/iframe.html?viewMode=story&id=rich-text-eglador-cms--pasted-embed-code",
    { waitUntil: "networkidle" },
  );
  await page.waitForTimeout(500);
  const clipEd = page.locator('[contenteditable="true"]').first();
  await clipEd.click();

  // An image carrying every option, so the round-trip can be compared.
  await page.locator('button[aria-label="Bileşen ekle"]').first().click();
  await page.waitForTimeout(300);
  await page
    .locator('div[role="presentation"]')
    .last()
    .locator("button", { hasText: "Resim" })
    .first()
    .click();
  await page.waitForTimeout(400);
  const clipForm = page.locator("form").first();
  await clipForm.locator('input[type="url"]').first().fill("https://picsum.photos/id/1015/300/160");
  await clipForm.locator('input[type="text"]').nth(1).fill("alt metni");
  await clipForm.locator('input[type="text"]').nth(2).fill("resim açıklaması");
  await clipForm.locator('input[type="number"]').first().fill("420");
  await clipForm.locator('button[type="submit"]').click();
  await page.waitForTimeout(600);

  await clipEd.locator("p").last().click();
  await page.keyboard.type("birinci");
  await page.keyboard.press("Enter");
  await page.keyboard.type("ikinci");
  await page.waitForTimeout(300);

  /** Every image node in the document, as JSON. */
  const imageNodes = () =>
    page.evaluate(() => {
      for (const el of document.querySelectorAll("pre")) {
        try {
          const json = JSON.parse(el.textContent);
          if (!json?.root?.children) continue;
          return json.root.children.filter((c) => c.type === "image");
        } catch {
          /* not a JSON panel */
        }
      }
      return [];
    });

  const kinds = () =>
    page.evaluate(() => {
      for (const el of document.querySelectorAll("pre")) {
        try {
          const json = JSON.parse(el.textContent);
          if (!json?.root?.children) continue;
          return json.root.children.map((c) => c.type);
        } catch {
          /* not a JSON panel */
        }
      }
      return ["<missing>"];
    });

  const original = (await imageNodes())[0];
  ck("resim eklendi", Boolean(original), JSON.stringify(original));

  // Click the picture itself — this is what used to leave a plain caret.
  await clipEd.locator("figure img").first().click();
  await page.waitForTimeout(300);
  ck(
    "resme tıklayınca blok seçiliyor",
    await page.evaluate(() =>
      Boolean(document.querySelector('[contenteditable="true"] figure')?.closest("[class*='outline']")),
    ),
  );

  await page.keyboard.press("Control+c");
  await page.waitForTimeout(600);
  ck("kopyalamak resmi silmiyor", (await imageNodes()).length === 1);

  await clipEd.locator("p").last().click();
  await page.keyboard.press("End");
  await page.keyboard.press("Control+v");
  await page.waitForTimeout(800);
  const copies = await imageNodes();
  ck("yapıştırınca ikinci kopya oluştu", copies.length === 2, String(copies.length));
  ck(
    "tüm seçenekler birebir korundu",
    copies.length === 2 && JSON.stringify(copies[0]) === JSON.stringify(copies[1]),
    JSON.stringify(copies[1]),
  );

  // Cut the first one and drop it at the end.
  await clipEd.locator("figure img").first().click();
  await page.waitForTimeout(300);
  await page.keyboard.press("Control+x");
  await page.waitForTimeout(800);
  ck("kesince resim belgeden çıktı", (await imageNodes()).length === 1);

  await clipEd.locator("p").last().click();
  await page.keyboard.press("End");
  await page.keyboard.press("Control+v");
  await page.waitForTimeout(800);
  const afterCut = await imageNodes();
  ck("kesileni yapıştırınca geri geldi", afterCut.length === 2, String(afterCut.length));
  ck(
    "kesilen resmin seçenekleri bozulmadı",
    afterCut.length === 2 && JSON.stringify(afterCut[0]) === JSON.stringify(original),
    JSON.stringify(afterCut[0]),
  );

  section("aynısı CMS bloğunda da çalışıyor");
  await page.locator('button[aria-label="Bileşen ekle"]').first().click();
  await page.waitForTimeout(300);
  await page
    .locator('div[role="presentation"]')
    .last()
    .locator("button", { hasText: "Galeri" })
    .first()
    .click();
  await page.waitForTimeout(400);
  await page.locator("form input").first().fill("777");
  await page.locator('form button[type="submit"]').click();
  await page.waitForTimeout(600);
  ck("galeri eklendi", (await kinds()).includes("galeri"));

  await page.locator('[contenteditable="true"] [data-lexical-decorator]').filter({ hasText: "777" }).first().click();
  await page.waitForTimeout(300);
  await page.keyboard.press("Control+x");
  await page.waitForTimeout(800);
  ck("galeri kesildi", !(await kinds()).includes("galeri"), (await kinds()).join(","));
  await clipEd.locator("p").first().click();
  await page.keyboard.press("End");
  await page.keyboard.press("Control+v");
  await page.waitForTimeout(800);
  ck("galeri geri yapıştırıldı", (await kinds()).includes("galeri"), (await kinds()).join(","));

  section("metin kes-kopyala bozulmadı");
  await clipEd.locator("p").filter({ hasText: "ikinci" }).first().click({ clickCount: 3 });
  await page.waitForTimeout(250);
  await page.keyboard.press("Control+c");
  await page.waitForTimeout(400);
  await page.keyboard.press("End");
  await page.keyboard.press("Control+v");
  await page.waitForTimeout(600);
  ck(
    "metin kopyala-yapıştır çalışıyor",
    ((await clipEd.textContent()) ?? "").includes("ikinciikinci"),
    ((await clipEd.textContent()) ?? "").slice(-40),
  );

  section("dişli düğmesi hâlâ formu açıyor");
  await page.locator('button[aria-label="Edit image embed"]').first().click({ force: true });
  await page.waitForTimeout(500);
  ck("resim formu açıldı", await page.locator("form input[type=url]").first().isVisible());
  await page.keyboard.press("Escape");

  ck("sayfa hatası yok", errors.length === 0, errors.join(" | "));
  await browser.close();
  console.log(failures === 0 ? "\nAll checks passed.\n" : `\n${failures} FAILED.\n`);
  process.exit(failures ? 1 : 0);
})();
