import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
(() => {
  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toque = window.matchMedia("(hover: none)").matches;

  /* Copiar o número: funciona com ou sem animação */
  const btnCopiar = document.getElementById("copiar-numero");
  const aviso = document.getElementById("copiado");
  btnCopiar.addEventListener("click", () => {
    const n = document.getElementById("numero");
    const selecionar = () => { const r = document.createRange(); r.selectNodeContents(n); const s = getSelection(); s.removeAllRanges(); s.addRange(r); aviso.textContent = "Número selecionado. Copie com Ctrl+C."; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText("51991556819").then(() => { aviso.textContent = "Número copiado."; }).catch(selecionar);
    } else selecionar();
  });

  /* Fita de clientes no toque: tocar no nome abre o cartão (e para a fita); tocar fora fecha */
  const fitaEl = document.querySelector(".fita");
  const fecharCartoes = () => fitaEl.querySelectorAll(".cliente.aberto").forEach((c) => c.classList.remove("aberto"));
  // Mantém o cartão inteiro dentro da tela quando o nome está perto da borda
  const ajustarCartao = (cli) => {
    const cartao = cli.querySelector(".cartao"), r = cli.getBoundingClientRect(), larg = cartao.offsetWidth, margem = 20;
    const esquerda = r.left + r.width / 2 - larg / 2;
    let d = 0;
    if (esquerda < margem) d = margem - esquerda;
    else if (esquerda + larg > window.innerWidth - margem) d = window.innerWidth - margem - (esquerda + larg);
    cartao.style.setProperty("--desloca", d + "px");
  };
  fitaEl.addEventListener("pointerover", (e) => { const c = e.target.closest(".cliente"); if (c && !c.contains(e.relatedTarget)) ajustarCartao(c); });
  fitaEl.addEventListener("focusin", (e) => { const c = e.target.closest(".cliente"); if (c) ajustarCartao(c); });
  fitaEl.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    const c = e.target.closest(".cliente"); if (!c) return;
    const abrir = !c.classList.contains("aberto");
    fecharCartoes();
    if (abrir) { ajustarCartao(c); c.classList.add("aberto"); window.__fita && window.__fita.pausar(); }
    else window.__fita && window.__fita.retomar();
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".fita") && fitaEl.querySelector(".cliente.aberto")) { fecharCartoes(); window.__fita && window.__fita.retomar(); } });

  /* Grade técnica da abertura: acende em amarelo onde o cursor passa */
  const canvas = document.getElementById("grade");
  const ctx = canvas.getContext("2d");
  const CEL = 44;
  let larg = 0, alt = 0, cols = 0, lins = 0, brilho = new Float32Array(0), dpr = 1, ativo = true, rodando = false;
  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    larg = canvas.clientWidth; alt = canvas.clientHeight;
    canvas.width = Math.round(larg * dpr); canvas.height = Math.round(alt * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(larg / CEL); lins = Math.ceil(alt / CEL);
    brilho = new Float32Array(cols * lins);
    desenhar();
  }
  function desenhar() {
    ctx.clearRect(0, 0, larg, alt);
    for (let i = 0; i < brilho.length; i++) {
      const b = brilho[i];
      if (b > 0.02) {
        ctx.fillStyle = `rgba(245, 197, 24, ${b * 0.85})`;
        ctx.fillRect((i % cols) * CEL + 1, Math.floor(i / cols) * CEL + 1, CEL - 1, CEL - 1);
      }
    }
    ctx.strokeStyle = "rgba(246, 246, 243, 0.07)"; ctx.lineWidth = 1; // Versão escura: na clara era rgba(17, 17, 17, 0.07)
    ctx.beginPath();
    for (let x = 0; x <= larg; x += CEL) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, alt); }
    for (let y = 0; y <= alt; y += CEL) { ctx.moveTo(0, y + 0.5); ctx.lineTo(larg, y + 0.5); }
    ctx.stroke();
  }
  function quadro() {
    let algum = false;
    for (let i = 0; i < brilho.length; i++) { if (brilho[i] > 0.01) { brilho[i] *= 0.94; algum = true; } else brilho[i] = 0; }
    desenhar();
    if (algum && ativo) requestAnimationFrame(quadro); else rodando = false;
  }
  function acender(c, l, forca) {
    if (c < 0 || l < 0 || c >= cols || l >= lins) return;
    const i = l * cols + c;
    brilho[i] = Math.min(1, Math.max(brilho[i], forca));
    if (!rodando && ativo && !reduz) { rodando = true; requestAnimationFrame(quadro); }
  }
  medir();
  window.addEventListener("resize", medir);
  if (!reduz) {
    const abertura = document.querySelector(".abertura");
    abertura.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      const c = Math.floor((e.clientX - r.left) / CEL), l = Math.floor((e.clientY - r.top) / CEL);
      acender(c, l, 0.9); acender(c + 1, l, 0.35); acender(c - 1, l, 0.35); acender(c, l + 1, 0.35); acender(c, l - 1, 0.35);
    });
    new IntersectionObserver(([e]) => { ativo = e.isIntersecting; }).observe(abertura);
    setInterval(() => { if (ativo && cols) acender(Math.floor(Math.random() * cols), Math.floor(Math.random() * lins), 0.55); }, toque ? 380 : 900);
  }

  /* Decodificação de títulos: o texto real fica para leitores de tela */
  const SIMBOLOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#_+";
  function prepararDecod(el) {
    const final = el.textContent.trim();
    el.textContent = "";
    const real = document.createElement("span"); real.className = "sr"; real.textContent = final;
    const vis = document.createElement("span"); vis.setAttribute("aria-hidden", "true");
    const chs = [];
    final.split(" ").forEach((palavra, n) => {
      if (n) vis.append(" ");
      const p = document.createElement("span"); p.className = "palavra";
      for (const c of palavra) {
        const s = document.createElement("span"); s.className = "ch"; s.textContent = c;
        p.append(s); chs.push(s);
      }
      vis.append(p);
    });
    el.append(real, vis);
    el._chs = chs;
  }
  /* As letras reais nunca saem do lugar: só ficam transparentes. Os símbolos aparecem por cima (::before),
     fora do fluxo, então a quebra de linha e a altura do título não mudam durante a animação. */
  function ocultarDecod(el) { el._chs.forEach((s) => { s.className = "ch oculto"; }); }
  function decodificar(el, duracao = 2200) {
    const chs = el._chs, n = chs.length, t0 = performance.now(), JANELA = 7, TROCA = 85;
    let ultimaTroca = -1;
    function passo(t) {
      const p = Math.min(1, (t - t0) / duracao);
      const fixo = Math.floor(p * (n + JANELA)) - JANELA;
      const ini = Math.max(0, fixo), fim = Math.max(0, Math.min(n, fixo + JANELA));
      // Os símbolos trocam num ritmo próprio, mais calmo que a taxa de quadros
      const trocar = t - ultimaTroca > TROCA;
      if (trocar) ultimaTroca = t;
      for (let i = 0; i < n; i++) {
        const s = chs[i], classe = i < ini ? "ch" : i < fim ? "ch ruido" : "ch oculto";
        if (s.className !== classe) s.className = classe;
        if (classe === "ch ruido" && (trocar || !s.dataset.r)) s.dataset.r = SIMBOLOS[(Math.random() * SIMBOLOS.length) | 0];
      }
      if (p < 1) requestAnimationFrame(passo); else chs.forEach((s) => { s.className = "ch"; });
    }
    requestAnimationFrame(passo);
  }
  const decods = [...document.querySelectorAll("[data-decodificar]")];
  decods.forEach(prepararDecod);

  if (reduz || !window.gsap) {
    document.querySelectorAll(".etapa").forEach((e) => e.classList.add("ativa"));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* Abertura: o título decodifica e o resto entra logo depois */
  decodificar(decods[0], 2800);
  // Títulos e demonstrações abaixo da dobra já esperam no estado inicial, para não piscarem completos e sumirem ao chegar
  const abaixo = (el) => el.getBoundingClientRect().top > window.innerHeight;
  decods.slice(1).forEach((el) => { if (abaixo(el)) ocultarDecod(el); });
  gsap.from(".abertura .sub, .abertura .acoes, .abertura .status", { y: 18, opacity: 0, duration: 0.6, stagger: 0.1, ease: "power3.out", delay: 0.5 });

  /* Vitrine: cada site desce devagar dentro da janela; depois o próximo entra com uma cortina */
  const vTela = document.querySelector(".vit-tela"), vImgs = gsap.utils.toArray(".vit-img");
  const vDominio = document.querySelector(".vit-dominio"), vCliente = document.querySelector(".vit-cliente"), vSeg = document.querySelector(".vit-seg");
  const vPontos = gsap.utils.toArray(".vit-pontos i");
  let vAtual = 0;
  function mostrarSite(i) {
    const img = vImgs[i];
    vImgs.forEach((el, k) => el.classList.toggle("ativa", k === i));
    vPontos.forEach((el, k) => el.classList.toggle("ativo", k === i));
    vDominio.textContent = img.dataset.dominio; vCliente.textContent = img.dataset.cliente; vSeg.textContent = img.dataset.seg;
    const curso = Math.max(0, img.offsetHeight - vTela.clientHeight);
    gsap.timeline({ onComplete: () => { vAtual = (i + 1) % vImgs.length; mostrarSite(vAtual); } })
      .fromTo(img, { clipPath: "inset(0 0 100% 0)", y: 0 }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "power3.inOut" })
      .to(img, { y: -curso, duration: Math.max(4, curso / 140), ease: "power1.inOut" }, "+=0.6")
      .to({}, { duration: 0.8 });
  }
  const iniciarVitrine = () => mostrarSite(0);
  if (vImgs[0].complete) iniciarVitrine(); else vImgs[0].addEventListener("load", iniciarVitrine, { once: true });

  /* Botões magnéticos */
  if (!toque) {
    document.querySelectorAll("[data-magnetico]").forEach((b) => {
      // Deslocamento limitado a poucos pixels: o botão puxa o cursor sem invadir o vizinho
      const limite = gsap.utils.clamp(-6, 6);
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(b, { x: limite(dx * 12), y: limite(dy * 10), duration: 0.3, ease: "power3.out", overwrite: "auto" });
      });
      b.addEventListener("pointerleave", () => gsap.to(b, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)", overwrite: "auto" }));
    });
  }

  /* Títulos das seções decodificam ao aparecer */
  decods.slice(1).forEach((el) => ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => decodificar(el, 2000) }));

  /* Contadores */
  function contar(el, dur = 1.2) {
    const de = Number(el.dataset.de || 0), alvo = Number(el.dataset.alvo), o = { v: de };
    return gsap.fromTo(o, { v: de }, { v: alvo, duration: dur, ease: "power2.out", onUpdate: () => { el.textContent = Math.round(o.v); }, immediateRender: false });
  }

  /* Demonstrações: cada uma monta uma linha do tempo, toca ao aparecer e pode ser repetida */
  const demos = {
    site(raiz) {
      const url = raiz.querySelector(".url-txt"), texto = url.textContent, o = { n: 0 };
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(o, { n: 0 }, { n: texto.length, duration: 0.9, ease: "none", onUpdate: () => { url.textContent = texto.slice(0, Math.round(o.n)); }, immediateRender: false })
        .fromTo(raiz.querySelectorAll(".ds-nav > *"), { scale: 0 }, { scale: 1, duration: 0.3, stagger: 0.06, ease: "back.out(2)", immediateRender: false })
        .fromTo(raiz.querySelectorAll(".ds-l"), { scaleX: 0 }, { scaleX: 1, duration: 0.45, stagger: 0.12, ease: "power3.out", immediateRender: false })
        .fromTo(raiz.querySelector(".ds-btn"), { scale: 0 }, { scale: 1, duration: 0.4, ease: "back.out(2.5)", immediateRender: false })
        .fromTo(raiz.querySelectorAll(".ds-cards div"), { scaleY: 0 }, { scaleY: 1, duration: 0.4, stagger: 0.1, ease: "power3.out", immediateRender: false })
        .fromTo(raiz.querySelector(".ponteiro"), { x: 150, y: 90, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.8, ease: "power2.inOut", immediateRender: false })
        .to(raiz.querySelector(".ponteiro"), { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
        .fromTo(raiz.querySelector(".ds-btn"), { backgroundColor: "#f5c518", color: "#111" }, { backgroundColor: "#111", color: "#f5c518", duration: 0.3, immediateRender: false }, "<")
        .fromTo(raiz.querySelector(".ds-aviso"), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.8)", immediateRender: false }, "+=0.15");
      return tl;
    },
    gmn(raiz) {
      const q = raiz.querySelector(".q"), texto = q.textContent, o = { n: 0 }, nota = { v: 0 };
      const notaEl = raiz.querySelector(".nota-num"), avalEl = raiz.querySelector(".aval-num");
      avalEl.dataset.alvo = "87"; avalEl.dataset.de = "0";
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(o, { n: 0 }, { n: texto.length, duration: 1.1, ease: "none", onUpdate: () => { q.textContent = texto.slice(0, Math.round(o.n)); }, immediateRender: false })
        .fromTo(raiz.querySelector(".ficha"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", immediateRender: false })
        .fromTo(raiz.querySelector(".pino"), { y: -80 }, { y: 0, duration: 0.8, ease: "bounce.out", immediateRender: false }, "<0.1")
        .fromTo(raiz.querySelector(".estrelas .cheias"), { width: "0%" }, { width: "98%", duration: 1, ease: "power2.out", immediateRender: false }, "<0.2")
        .fromTo(nota, { v: 0 }, { v: 4.9, duration: 1, ease: "power2.out", onUpdate: () => { notaEl.textContent = nota.v.toFixed(1).replace(".", ","); }, immediateRender: false }, "<")
        .add(contar(avalEl, 1), "<")
        .fromTo(raiz.querySelectorAll(".ficha-botoes span"), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.08, immediateRender: false }, "-=0.4");
      return tl;
    },
    sis(raiz) {
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(raiz.querySelectorAll(".kpis div"), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: "power3.out", immediateRender: false });
      raiz.querySelectorAll(".kpis b").forEach((b) => tl.add(contar(b, 1.3), 0.2));
      tl.fromTo(raiz.querySelectorAll(".grafico i"), { scaleY: 0 }, { scaleY: 1, duration: 0.6, stagger: 0.07, ease: "power3.out", immediateRender: false }, 0.3)
        .fromTo(raiz.querySelector(".lista li.novo"), { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out", immediateRender: false }, "+=0.2");
      return tl;
    }
  };
  document.querySelectorAll("[data-demo]").forEach((raiz) => {
    const tl = demos[raiz.dataset.demo](raiz);
    if (abaixo(raiz)) tl.progress(1).progress(0);
    ScrollTrigger.create({ trigger: raiz, start: "top 80%", once: true, onEnter: () => tl.restart() });
    raiz.querySelector(".repetir").addEventListener("click", () => tl.restart());
  });

  /* Como eu trabalho: a linha amarela acompanha a rolagem e cada etapa trava no lugar */
  // Cada etapa acende quando a linha amarela chega no número dela (mesma fonte de verdade, sem gatilhos separados)
  const listaEtapas = document.querySelector(".etapas");
  const etapas = gsap.utils.toArray(".etapa");
  gsap.fromTo(".etapas .preenche", { scaleY: 0 }, {
    scaleY: 1, ease: "none",
    scrollTrigger: { trigger: listaEtapas, start: "top 70%", end: "bottom 65%", scrub: 0.4 },
    onUpdate() {
      const ponta = this.progress() * listaEtapas.offsetHeight;
      etapas.forEach((e) => e.classList.toggle("ativa", e.offsetTop + 8 <= ponta));
    }
  });

  // Fita de clientes: o grupo se repete até cobrir a tela, corre em loop e para quando o mouse (ou o foco) entra
  const fita = document.querySelector(".fita"), trilho = fita.querySelector(".fita-trilho"), grupo = trilho.querySelector(".fita-grupo");
  const base = [...grupo.children];
  const marcarCopia = (n) => { n.setAttribute("aria-hidden", "true"); n.setAttribute("tabindex", "-1"); n.querySelectorAll("a").forEach((a) => a.setAttribute("tabindex", "-1")); };
  let guarda = 0;
  while (grupo.scrollWidth < window.innerWidth * 1.2 && guarda++ < 20) base.forEach((n) => { const c = n.cloneNode(true); marcarCopia(c); grupo.append(c); });
  const grupo2 = grupo.cloneNode(true); grupo2.querySelectorAll(".cliente").forEach(marcarCopia); trilho.append(grupo2);
  const fitaTween = gsap.to(trilho, { x: () => -grupo.offsetWidth, duration: () => grupo.offsetWidth / 55, ease: "none", repeat: -1, invalidateOnRefresh: true });
  const algumAberto = () => !!fita.querySelector(".cliente.aberto");
  const pausar = () => gsap.to(fitaTween, { timeScale: 0, duration: 0.45, ease: "power2.out", overwrite: true });
  const retomar = () => { if (!algumAberto()) gsap.to(fitaTween, { timeScale: 1, duration: 0.8, ease: "power2.in", overwrite: true }); };
  fita.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") pausar(); });
  fita.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") retomar(); });
  fita.addEventListener("focusin", pausar);
  fita.addEventListener("focusout", (e) => { if (!fita.contains(e.relatedTarget)) retomar(); });
  window.__fita = { pausar, retomar };

  // Posições recalculadas depois que a fonte carrega: antes disso os gatilhos ficam deslocados
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
