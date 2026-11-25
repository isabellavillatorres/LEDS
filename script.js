(function () {
  const KD = "leds-db-v3",
    KU = "leds-ui-v1";
  const SCHEMA =
      "-- LEDS / IFES - Matriz de Competências e Alocação de Desenvolvedores\n-- Modelo de dados em SQL portável\n-- =====================================================================\n\nDROP VIEW IF EXISTS vw_ocupacao_aluno;\nDROP TABLE IF EXISTS alocacao;\nDROP TABLE IF EXISTS projeto_requisito;\nDROP TABLE IF EXISTS projeto;\nDROP TABLE IF EXISTS aluno_habilidade;\nDROP TABLE IF EXISTS habilidade;\nDROP TABLE IF EXISTS nivel_proficiencia;\nDROP TABLE IF EXISTS aluno;\n\n-- 1. ALUNO: quem trabalha no LEDS\nCREATE TABLE aluno (\n    id                      INT PRIMARY KEY,\n    nome                    VARCHAR(120) NOT NULL,\n    email                   VARCHAR(150) NOT NULL UNIQUE,\n    curso                   VARCHAR(100),\n    carga_horaria_semanal   INT NOT NULL CHECK (carga_horaria_semanal > 0),\n    ativo                   INT NOT NULL CHECK (ativo IN (0, 1)),\n    data_atualizacao_perfil DATE NOT NULL\n);\n\n-- 2. NÍVEIS DE PROFICIÊNCIA (escala de 1 a 5)\nCREATE TABLE nivel_proficiencia (\n    nivel     INT PRIMARY KEY CHECK (nivel BETWEEN 1 AND 5),\n    nome      VARCHAR(30)  NOT NULL,\n    descricao VARCHAR(200) NOT NULL\n);\n\n-- 3. HABILIDADE: catálogo fixo de competências\nCREATE TABLE habilidade (\n    id        INT PRIMARY KEY,\n    nome      VARCHAR(60) NOT NULL UNIQUE,\n    categoria VARCHAR(30) NOT NULL\n              CHECK (categoria IN ('Desenvolvimento', 'Design', 'Dados', 'Ferramentas', 'Soft Skill'))\n);\n\n-- 4. ALUNO_HABILIDADE: matriz de competências (aluno x habilidade x nível)\nCREATE TABLE aluno_habilidade (\n    aluno_id      INT NOT NULL,\n    habilidade_id INT NOT NULL,\n    nivel         INT NOT NULL,\n    PRIMARY KEY (aluno_id, habilidade_id),\n    FOREIGN KEY (aluno_id)      REFERENCES aluno(id),\n    FOREIGN KEY (habilidade_id) REFERENCES habilidade(id),\n    FOREIGN KEY (nivel)         REFERENCES nivel_proficiencia(nivel)\n);\n\n-- 5. PROJETO\nCREATE TABLE projeto (\n    id          INT PRIMARY KEY,\n    nome        VARCHAR(120) NOT NULL,\n    descricao   VARCHAR(500),\n    status      VARCHAR(20) NOT NULL\n                CHECK (status IN ('Planejado', 'Ativo', 'Concluido', 'Cancelado')),\n    data_inicio DATE,\n    data_fim    DATE\n);\n\n-- 6. PROJETO_REQUISITO: o que o gestor exige (ex.: 2 devs Python nível 3+, 10h/semana)\nCREATE TABLE projeto_requisito (\n    id                INT PRIMARY KEY,\n    projeto_id        INT NOT NULL,\n    habilidade_id     INT NOT NULL,\n    nivel_minimo      INT NOT NULL,\n    quantidade_vagas  INT NOT NULL CHECK (quantidade_vagas > 0),\n    horas_semanais    INT NOT NULL CHECK (horas_semanais > 0),\n    peso              INT NOT NULL CHECK (peso > 0),\n    UNIQUE (projeto_id, habilidade_id),\n    FOREIGN KEY (projeto_id)    REFERENCES projeto(id),\n    FOREIGN KEY (habilidade_id) REFERENCES habilidade(id),\n    FOREIGN KEY (nivel_minimo)  REFERENCES nivel_proficiencia(nivel)\n);\n\n-- 7. ALOCACAO: aluno em projeto, com horas por semana\nCREATE TABLE alocacao (\n    id             INT PRIMARY KEY,\n    aluno_id       INT NOT NULL,\n    projeto_id     INT NOT NULL,\n    horas_semanais INT NOT NULL CHECK (horas_semanais > 0),\n    data_inicio    DATE NOT NULL,\n    data_fim       DATE,\n    ativa          INT NOT NULL CHECK (ativa IN (0, 1)),\n    FOREIGN KEY (aluno_id)   REFERENCES aluno(id),\n    FOREIGN KEY (projeto_id) REFERENCES projeto(id)\n);\n\n-- PAINEL DE OCUPAÇÃO (RN06): horas livres e taxa de ocupação sempre calculadas\nCREATE VIEW vw_ocupacao_aluno AS\nSELECT\n    a.id AS aluno_id,\n    a.nome,\n    a.carga_horaria_semanal,\n    COALESCE(SUM(al.horas_semanais), 0) AS horas_alocadas,\n    a.carga_horaria_semanal - COALESCE(SUM(al.horas_semanais), 0) AS horas_livres,\n    ROUND(100.0 * COALESCE(SUM(al.horas_semanais), 0) / a.carga_horaria_semanal, 1) AS taxa_ocupacao_pct\nFROM aluno a\nLEFT JOIN alocacao al ON al.aluno_id = a.id AND al.ativa = 1\nWHERE a.ativo = 1\nGROUP BY a.id, a.nome, a.carga_horaria_semanal;\n\n-- =====================================================================\n-- DADOS INICIAIS\n-- =====================================================================\n\nINSERT INTO nivel_proficiencia (nivel, nome, descricao) VALUES (1, 'Aprendiz',     'Conhece pouco sobre essa habilidade.');\nINSERT INTO nivel_proficiencia (nivel, nome, descricao) VALUES (2, 'Júnior',       'Consegue realizar tarefas simples.');\nINSERT INTO nivel_proficiencia (nivel, nome, descricao) VALUES (3, 'Pleno',        'Consegue trabalhar com autonomia.');\nINSERT INTO nivel_proficiencia (nivel, nome, descricao) VALUES (4, 'Sênior',       'Possui bastante domínio.');\nINSERT INTO nivel_proficiencia (nivel, nome, descricao) VALUES (5, 'Especialista', 'Possui domínio completo e pode orientar outras pessoas.');\n\n-- Lista fixa das 10 tecnologias/competências principais\nINSERT INTO habilidade (id, nome, categoria) VALUES (1,  'Python',     'Desenvolvimento');\nINSERT INTO habilidade (id, nome, categoria) VALUES (2,  'React',      'Desenvolvimento');\nINSERT INTO habilidade (id, nome, categoria) VALUES (3,  'JavaScript', 'Desenvolvimento');\nINSERT INTO habilidade (id, nome, categoria) VALUES (4,  'Node.js',    'Desenvolvimento');\nINSERT INTO habilidade (id, nome, categoria) VALUES (5,  'HTML/CSS',   'Desenvolvimento');\nINSERT INTO habilidade (id, nome, categoria) VALUES (6,  'SQL',        'Dados');\nINSERT INTO habilidade (id, nome, categoria) VALUES (7,  'Figma',      'Design');\nINSERT INTO habilidade (id, nome, categoria) VALUES (8,  'UI/UX',      'Design');\nINSERT INTO habilidade (id, nome, categoria) VALUES (9,  'Git/GitHub', 'Ferramentas');\nINSERT INTO habilidade (id, nome, categoria) VALUES (10, 'Liderança',  'Soft Skill');\n\n-- Ficha do Desenvolvedor do exemplo (carga de 12h por semana)\nINSERT INTO aluno (id, nome, email, curso, carga_horaria_semanal, ativo, data_atualizacao_perfil)\nVALUES (1, 'Heitor Santos', 'heitor.santos@exemplo.ifes.edu.br', 'Sistemas de Informação', 12, 1, '2026-10-21');\n\n-- Avançado = 4, Intermediário = 3, Iniciante = 1\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (1, 1, 4);  -- Python\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (1, 2, 3);  -- React\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (1, 6, 1);  -- SQL\n\n-- Projeto de exemplo (\"Projeto X\" da ficha do Dia 2)\nINSERT INTO projeto (id, nome, descricao, status, data_inicio, data_fim)\nVALUES (1, 'Projeto X', 'Projeto de exemplo para testar a alocação', 'Ativo', '2026-10-21', NULL);\n\n-- Alocação do Heitor Santos no Projeto X (2 horas por semana)\nINSERT INTO alocacao (id, aluno_id, projeto_id, horas_semanais, data_inicio, data_fim, ativa)\nVALUES (1, 1, 1, 2, '2026-10-21', NULL, 1);\n",
    EXTRA =
      "-- =====================================================================\n-- DADOS DE EXEMPLO ADICIONAIS (não fazem parte do script original)\n-- =====================================================================\nINSERT INTO aluno (id, nome, email, curso, carga_horaria_semanal, ativo, data_atualizacao_perfil) VALUES (2, 'Marina Souza', 'marina.souza@exemplo.ifes.edu.br', 'Sistemas de Informação', 26, 1, '2026-10-18');\nINSERT INTO aluno (id, nome, email, curso, carga_horaria_semanal, ativo, data_atualizacao_perfil) VALUES (3, 'João Pereira', 'joao.pereira@exemplo.ifes.edu.br', 'Eng. de Computação', 32, 1, '2026-10-15');\nINSERT INTO aluno (id, nome, email, curso, carga_horaria_semanal, ativo, data_atualizacao_perfil) VALUES (4, 'Ana Lima', 'ana.lima@exemplo.ifes.edu.br', 'Sistemas de Informação', 32, 1, '2026-10-12');\nINSERT INTO aluno (id, nome, email, curso, carga_horaria_semanal, ativo, data_atualizacao_perfil) VALUES (5, 'Carlos Ribeiro', 'carlos.ribeiro@exemplo.ifes.edu.br', 'Análise de Sistemas', 22, 1, '2026-10-10');\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (2, 1, 5);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (2, 6, 4);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (3, 2, 5);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (3, 1, 3);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (4, 2, 3);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (4, 8, 5);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (5, 2, 3);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (5, 6, 3);\nINSERT INTO projeto (id, nome, descricao, status, data_inicio, data_fim) VALUES (2, 'Outros projetos', 'Alocações de exemplo fora do Projeto X', 'Ativo', '2026-09-01', NULL);\nINSERT INTO alocacao (id, aluno_id, projeto_id, horas_semanais, data_inicio, data_fim, ativa) VALUES (2, 2, 2, 20, '2026-09-01', NULL, 1);\nINSERT INTO alocacao (id, aluno_id, projeto_id, horas_semanais, data_inicio, data_fim, ativa) VALUES (3, 3, 2, 17, '2026-09-01', NULL, 1);\nINSERT INTO alocacao (id, aluno_id, projeto_id, horas_semanais, data_inicio, data_fim, ativa) VALUES (4, 4, 2, 22, '2026-09-01', NULL, 1);\nINSERT INTO alocacao (id, aluno_id, projeto_id, horas_semanais, data_inicio, data_fim, ativa) VALUES (5, 5, 2, 12, '2026-09-01', NULL, 1);\nINSERT INTO projeto_requisito (id, projeto_id, habilidade_id, nivel_minimo, quantidade_vagas, horas_semanais, peso) VALUES (1, 1, 1, 3, 2, 10, 2);\nINSERT INTO projeto_requisito (id, projeto_id, habilidade_id, nivel_minimo, quantidade_vagas, horas_semanais, peso) VALUES (2, 1, 8, 3, 1, 10, 1);\n-- Habilidades adicionais do Heitor (Skill Matrix mais completa)\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (1, 3, 4);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (1, 5, 4);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (1, 9, 3);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (1, 4, 2);\nINSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (1, 7, 2);\n";

  /* ===== Integração com kanban (GitHub / Trello / Jira) =====
     O nível de cada habilidade deixa de ser autodeclarado: é calculado pela
     soma da complexidade (story points) das tarefas concluídas no kanban. */
  const LIM = [5, 12, 25, 40]; // pontos mínimos para os níveis 2, 3, 4 e 5
  const FONTES = ["GitHub", "Trello", "Jira"];
  const CPX = [1, 2, 3, 5, 8, 13];
  const KANBAN =
    "CREATE TABLE tarefa (\n" +
    "    id            INT PRIMARY KEY,\n" +
    "    aluno_id      INT NOT NULL,\n" +
    "    habilidade_id INT NOT NULL,\n" +
    "    fonte         VARCHAR(10) NOT NULL CHECK (fonte IN ('GitHub', 'Trello', 'Jira')),\n" +
    "    titulo        VARCHAR(150) NOT NULL,\n" +
    "    complexidade  INT NOT NULL CHECK (complexidade IN (1, 2, 3, 5, 8, 13)),\n" +
    "    data_conclusao DATE NOT NULL,\n" +
    "    FOREIGN KEY (aluno_id)      REFERENCES aluno(id),\n" +
    "    FOREIGN KEY (habilidade_id) REFERENCES habilidade(id)\n" +
    ");\n" +
    "CREATE VIEW vw_nivel_kanban AS\n" +
    "SELECT aluno_id, habilidade_id, pontos, tarefas,\n" +
    "    CASE WHEN pontos >= " + LIM[3] + " THEN 5\n" +
    "         WHEN pontos >= " + LIM[2] + " THEN 4\n" +
    "         WHEN pontos >= " + LIM[1] + " THEN 3\n" +
    "         WHEN pontos >= " + LIM[0] + " THEN 2\n" +
    "         ELSE 1 END AS nivel\n" +
    "FROM (\n" +
    "    SELECT ah.aluno_id, ah.habilidade_id,\n" +
    "           COALESCE(SUM(t.complexidade), 0) AS pontos,\n" +
    "           COUNT(t.id) AS tarefas\n" +
    "    FROM aluno_habilidade ah\n" +
    "    LEFT JOIN tarefa t ON t.aluno_id = ah.aluno_id AND t.habilidade_id = ah.habilidade_id\n" +
    "    GROUP BY ah.aluno_id, ah.habilidade_id\n" +
    ");\n";
  // [aluno, habilidade, fonte, complexidades das tarefas concluídas]
  const SEED = [
    [1, 1, "GitHub", [8, 5, 5, 5, 5]],
    [1, 2, "GitHub", [5, 5, 5]],
    [1, 6, "Jira", [3]],
    [1, 3, "GitHub", [8, 8, 5, 5, 2]],
    [1, 5, "Trello", [5, 5, 5, 5, 8]],
    [1, 9, "GitHub", [5, 5, 5]],
    [1, 4, "Jira", [3, 2, 2]],
    [1, 7, "Trello", [3, 2, 2]],
    [2, 1, "Jira", [13, 13, 8, 8, 5]],
    [2, 6, "Jira", [8, 8, 5, 5, 3]],
    [3, 2, "GitHub", [13, 13, 8, 8, 5]],
    [3, 1, "GitHub", [5, 5, 5]],
    [4, 2, "Trello", [5, 5, 5]],
    [4, 8, "Trello", [13, 13, 8, 8, 5]],
    [5, 2, "Jira", [5, 5, 5]],
    [5, 6, "Jira", [5, 5, 5]],
  ];
  const SEEDSQL = (() => {
    let id = 0,
      s = "";
    SEED.forEach(([a, h, f, cs]) =>
      cs.forEach((c) => {
        id++;
        const tipo = f == "GitHub" ? "Issue" : f == "Trello" ? "Cartão" : "Ticket";
        const dia = String(1 + (id % 28)).padStart(2, "0");
        s += `INSERT INTO tarefa (id, aluno_id, habilidade_id, fonte, titulo, complexidade, data_conclusao) VALUES (${id}, ${a}, ${h}, '${f}', '${tipo} #${100 + id}', ${c}, '2026-10-${dia}');\n`;
      }),
    );
    return s;
  })();

  const $ = (id) => document.getElementById(id);
  const fd = (d) => String(d).split("-").reverse().join("/");
  const esc = (t) =>
    String(t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const today = () => new Date().toISOString().slice(0, 10);
  const HO = [5, 10, 15];
  let AI = 0,
    TH = "dark";
  try {
    TH = localStorage.getItem("leds-theme") || "dark";
  } catch (e) {}
  document.documentElement.dataset.theme = TH;
  let SQL,
    db,
    LOG = [],
    F = { tech: "Python", lvl: 4, h: 10 },
    scr = "p",
    oc = false,
    PK = null,
    CF = null,
    SEL = {},
    QT = "",
    tm;
  try {
    const u = JSON.parse(localStorage.getItem(KU));
    if (u) {
      F = u.F;
      scr = u.scr;
      oc = u.oc;
    }
  } catch (e) {}
  function toast(t) {
    const e = $("toast");
    e.textContent = t;
    e.className = "on";
    clearTimeout(tm);
    tm = setTimeout(() => (e.className = ""), 1800);
  }
  function q(sql, p) {
    const st = db.prepare(sql);
    try {
      if (p) st.bind(p);
      const r = [];
      while (st.step()) r.push(st.getAsObject());
      return r;
    } finally {
      st.free();
    }
  }
  function persist() {
    try {
      const u = db.export();
      let b = "";
      for (let i = 0; i < u.length; i += 8192)
        b += String.fromCharCode.apply(null, u.subarray(i, i + 8192));
      localStorage.setItem(KD, btoa(b));
    } catch (e) {}
  }
  function ex(sql, p) {
    db.run(sql, p || []);
    let i = 0;
    LOG.push(
      sql
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\?/g, () => {
          const v = (p || [])[i++];
          return typeof v == "string" ? "'" + v + "'" : v;
        }) + ";",
    );
    if (LOG.length > 8) LOG.shift();
    persist();
  }
  function initDb(fresh) {
    let d = null;
    try {
      const s = fresh ? null : localStorage.getItem(KD);
      if (s) {
        const b = atob(s),
          u = new Uint8Array(b.length);
        for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
        d = u;
      }
    } catch (e) {}
    if (d) {
      db = new SQL.Database(d);
    } else {
      db = new SQL.Database();
      db.run(SCHEMA);
      db.run(EXTRA);
      db.run(KANBAN);
      db.run(SEEDSQL);
      persist();
    }
    LOG = [];
  }
  const NV = () => q("SELECT * FROM nivel_proficiencia ORDER BY nivel");
  const HB = () => q("SELECT * FROM habilidade ORDER BY id");
  const nm = (l) => NV()[l - 1].nome;
  const ini = (n) =>
    n
      .replace(/[^A-Za-zÀ-ú ]/g, "")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const lvl = (v) => {
    const n = NV()[v - 1];
    return v == 5 ? n.nome : n.nome + "+";
  };
  function data() {
    const me = q("SELECT * FROM aluno WHERE id = 1")[0];
    const mine = q(
      "SELECT h.id, h.nome, h.categoria, k.nivel, k.pontos, k.tarefas FROM vw_nivel_kanban k JOIN habilidade h ON h.id = k.habilidade_id WHERE k.aluno_id = 1 ORDER BY h.id",
    );
    const src = q(
      "SELECT habilidade_id h, fonte f, COUNT(*) n FROM tarefa WHERE aluno_id = 1 GROUP BY habilidade_id, fonte ORDER BY fonte",
    );
    const recent = q(
      "SELECT t.fonte, t.titulo, t.complexidade c, t.data_conclusao d, h.nome hn FROM tarefa t JOIN habilidade h ON h.id = t.habilidade_id WHERE t.aluno_id = 1 ORDER BY t.data_conclusao DESC, t.id DESC LIMIT 5",
    );
    const ov = q("SELECT * FROM vw_ocupacao_aluno");
    const sk = q(
      "SELECT k.aluno_id id, h.nome n, k.nivel l FROM vw_nivel_kanban k JOIN habilidade h ON h.id = k.habilidade_id ORDER BY k.aluno_id, h.id",
    );
    const al = q("SELECT * FROM alocacao WHERE projeto_id = 1 AND ativa = 1");
    const req = q(
      "SELECT r.quantidade_vagas v, r.horas_semanais h, h.nome hn, n.nome nn FROM projeto_requisito r JOIN habilidade h ON h.id = r.habilidade_id JOIN nivel_proficiencia n ON n.nivel = r.nivel_minimo WHERE r.projeto_id = 1 ORDER BY r.id",
    );
    const cand = q(
      "SELECT a.id, a.nome, a.curso, a.data_atualizacao_perfil dt, o.carga_horaria_semanal carga, o.horas_alocadas ha, o.horas_livres hl, o.taxa_ocupacao_pct taxa FROM aluno a JOIN vw_ocupacao_aluno o ON o.aluno_id = a.id",
    ).map((c) => ({ ...c, sk: sk.filter((x) => x.id == c.id) }));
    return { me, mine, src, recent, ov, al, req, cand };
  }
  function sqlStrict() {
    const w = [];
    if (F.lvl) w.push("ah.nivel >= " + F.lvl);
    if (F.h) w.push("o.horas_livres >= " + F.h);
    return `SELECT a.nome, ah.nivel, o.horas_livres
FROM aluno a
JOIN vw_nivel_kanban ah ON ah.aluno_id = a.id
JOIN habilidade h ON h.id = ah.habilidade_id${F.tech ? ` AND h.nome = '${F.tech.replace(/'/g, "''")}'` : ""}
JOIN vw_ocupacao_aluno o ON o.aluno_id = a.id${w.length ? "\nWHERE " + w.join("\n  AND ") : ""}
ORDER BY o.taxa_ocupacao_pct ASC,
         ah.nivel DESC,
         a.data_atualizacao_perfil DESC`;
  }
  const tl = (c) => (F.tech ? c.sk.filter((x) => x.n === F.tech) : c.sk);
  function pct(c) {
    let t = 0,
      ok = 0;
    const s = tl(c);
    if (F.tech) {
      t++;
      if (s.length) ok++;
    }
    if (F.lvl) {
      t++;
      if (s.some((x) => x.l >= F.lvl)) ok++;
    }
    if (F.h) {
      t++;
      if (c.hl >= F.h) ok++;
    }
    return t ? Math.round((100 * ok) / t) : 100;
  }
  const maxl = (c) => Math.max(0, ...tl(c).map((x) => x.l));
  const hit = (c) => {
    const t = QT.trim().toLowerCase();
    return (
      !t ||
      [c.nome, c.curso]
        .concat(c.sk.map((x) => x.n))
        .some((s) => s.toLowerCase().includes(t))
    );
  };
  const hr = (c) => Math.max(1, Math.min(SEL[c.id] || 10, Math.max(1, c.hl)));
  const logHtml = () =>
    `<details class="sql" style="margin-top:16px"><summary>Registro SQL executado (${LOG.length})</summary><pre>${LOG.length ? esc(LOG.join("\n")) : "-- nenhuma alteração ainda"}</pre></details><button class="rst" onclick="A.reset()">Restaurar dados iniciais do SQL</button>`;
  function kanbanHtml(D, nv) {
    const rule = nv
      .slice(1)
      .map((n, i) => LIM[i] + "+ pts = " + n.nome)
      .join(" · ");
    const rows = D.recent.length
      ? D.recent
          .map(
            (t) =>
              `<div class="between" style="margin-top:10px;font-size:14px"><span>${esc(t.titulo)} · ${esc(t.hn)}</span><span class="sub">${t.fonte} · ${t.c} pts · ${fd(t.d)}</span></div>`,
          )
          .join("")
      : '<div class="sub" style="margin-top:10px">Nenhuma tarefa importada ainda.</div>';
    const form = D.mine.length
      ? `<div class="kbf"><div class="fld"><label for="kb-f">Ferramenta</label><select id="kb-f" class="q">${FONTES.map((f) => `<option>${f}</option>`).join("")}</select></div><div class="fld"><label for="kb-h">Habilidade</label><select id="kb-h" class="q">${D.mine.map((m) => `<option value="${m.id}">${esc(m.nome)}</option>`).join("")}</select></div><div class="fld"><label for="kb-c">Complexidade (pts)</label><select id="kb-c" class="q">${CPX.map((c) => `<option value="${c}"${c == 3 ? " selected" : ""}>${c} pts</option>`).join("")}</select></div><div class="fld kbt"><label for="kb-t">Tarefa concluída</label><input id="kb-t" class="q" placeholder="Ex.: Issue #42 – API de login"></div></div><button class="btn p" style="margin-top:12px" onclick="A.imp()">Importar tarefa concluída</button>`
      : '<div class="sub" style="margin-top:12px">Adicione uma habilidade no catálogo para importar tarefas.</div>';
    return `<div class="card"><div class="between"><b style="font-size:15px">Integração com kanban</b><span class="sub">GitHub · Trello · Jira</span></div><div class="sub" style="margin:4px 0 0">O nível não é mais autodeclarado: é calculado pela complexidade das tarefas concluídas.</div><div class="sub" style="margin-top:4px">${rule}</div><div class="sub" style="margin-top:4px">Simulação: as tarefas são registradas no banco local, sem chamada real às APIs.</div>${form}<div style="margin-top:14px"><b style="font-size:14px">Últimas tarefas concluídas</b>${rows}</div></div>`;
  }
  function pProfile(D) {
    const me = D.me,
      o = D.ov.find((x) => x.aluno_id == 1),
      nv = NV(),
      hb = HB();
    const who = `<div class="who"><div class="av">${ini(me.nome)}</div><div><b>${esc(me.nome)}</b><div class="sub">${esc(me.curso)} · LEDS / IFES</div><div class="sub">${esc(me.email)}</div></div></div>`;
    const avail = `<div class="card"><div class="between"><b style="font-size:15px">Carga horária semanal</b><span class="big"><span class="hv">${me.carga_horaria_semanal}</span> h</span></div><input type="range" min="${Math.max(1, o.horas_alocadas)}" max="40" value="${me.carga_horaria_semanal}" aria-label="Carga horária semanal" oninput="A.hv(this.value)" onchange="A.h(this.value)"><div class="sub">${o.horas_alocadas} h alocadas · ${o.horas_livres} h livres (${String(o.taxa_ocupacao_pct).replace(".", ",")}% ocupado)</div><div class="sub" style="margin-top:4px">Perfil atualizado em ${fd(me.data_atualizacao_perfil)}</div></div>`;
    const sec = `<div class="sec"><span>Minhas habilidades</span><span>${D.mine.length} de ${hb.length}</span></div>`;
    const sk =
      D.mine
        .map((x) => {
          const base = x.nivel == 1 ? 0 : LIM[x.nivel - 2],
            nxt = x.nivel < 5 ? LIM[x.nivel - 1] : null,
            w = nxt ? Math.max(0, Math.min(100, ((x.pontos - base) / (nxt - base)) * 100)) : 100;
          const fontes = D.src
            .filter((s) => s.h == x.id)
            .map((s) => s.f + " " + s.n)
            .join(" · ");
          return `<div class="card"><div class="between"><div class="item"><div class="ini">${ini(x.nome)}</div><div><b>${esc(x.nome)}</b><div class="sub">${x.categoria}</div></div></div><button class="rmb" aria-label="Remover ${esc(x.nome)}" onclick="A.rm(${x.id})">✕</button></div><div class="between" style="margin-top:12px"><span class="match">Nível ${x.nivel} · ${nv[x.nivel - 1].nome}</span><span class="sub">${x.pontos} pts · ${x.tarefas} tarefa${x.tarefas == 1 ? "" : "s"}</span></div><div class="bar" style="margin-top:10px"><i><b style="width:${w}%"></b></i><span>${nxt ? "faltam " + (nxt - x.pontos) + " pts" : "nível máximo"}</span></div><div class="sub" style="margin-top:8px">${fontes ? "Fonte: " + fontes : "Sem tarefas concluídas no kanban"}</div></div>`;
        })
        .join("") ||
      '<div class="card sub">Nenhuma habilidade cadastrada. Adicione pelo catálogo.</div>';
    const av = hb.filter((h) => !D.mine.some((x) => x.id == h.id));
    const cat = `<div class="card"><div class="between"><b style="font-size:15px">Catálogo de habilidades</b><span class="sub">${D.mine.length} de ${hb.length}</span></div><div class="sub" style="margin:4px 0 12px">${nv.map((n) => n.nivel + " " + n.nome).join(" · ")}</div>${av.length ? `<div class="chips">${av.map((h) => `<button class="chip" title="${h.categoria}" onclick="A.add(${h.id})">+ ${esc(h.nome)}</button>`).join("")}</div>` : '<div class="sub">Catálogo completo</div>'}</div>`;
    return `<div class="pg"><div class="a-who">${who}</div><div class="a-av">${avail}</div><div class="a-sec">${sec}</div><div class="sk a-sk">${sk}</div><div class="a-cat">${cat}${kanbanHtml(D, nv)}</div><div class="a-save"><button class="btn" onclick="A.save()">Salvar perfil</button></div></div>`;
  }
  const FD = () => ({
    tech: { l: "Tecnologia", o: HB().map((h) => [h.nome, h.nome]) },
    lvl: { l: "Nível mínimo", o: NV().map((n) => [n.nivel, lvl(n.nivel)]) },
    h: { l: "Horas livres", o: HO.map((v) => [v, v + " h+"]) },
  });
  const FL = (k) => {
    const p = FD()[k].o.find((p) => p[0] == F[k]);
    return p ? p[1] : "";
  };
  const fopts = (k, t) => {
    const x = (t || "").toLowerCase();
    return FD()[k].o.filter((p) => !x || p[1].toLowerCase().includes(x));
  };
  function lb(k, t) {
    const o = fopts(k, t),
      u = $("lb-" + k);
    AI = o.length ? Math.min(AI, o.length - 1) : 0;
    u.hidden = false;
    $("f-" + k).setAttribute("aria-expanded", "true");
    u.innerHTML = o.length
      ? o
          .map(
            (p, i) =>
              `<li role="option" class="${i == AI ? "hl" : ""}${F[k] == p[0] ? " sel" : ""}" aria-selected="${F[k] == p[0]}" onmousedown="event.preventDefault();A.set('${k}',${JSON.stringify(p[0]).replace(/"/g, "&quot;")})">${esc(p[1])}</li>`,
          )
          .join("")
      : '<li class="none">Nenhuma opção</li>';
  }
  function filtersHtml(ph) {
    const f = FD();
    return (
      `<div class="fld fq"><label for="fq">Buscar</label><input id="fq" class="q" type="search" value="${esc(QT).replace(/"/g, "&quot;")}" placeholder="${esc(ph)}" oninput="A.qs(this.value)"></div>` +
      Object.keys(f)
        .map(
          (k) =>
            `<div class="fld"><label for="f-${k}">${f[k].l}</label><div class="ac"><input id="f-${k}" class="q" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="lb-${k}" autocomplete="off" placeholder="Qualquer" value="${esc(FL(k)).replace(/"/g, "&quot;")}" onfocus="A.fo('${k}',this)" oninput="A.ft('${k}',this.value)" onkeydown="A.fk(event,'${k}')" onblur="A.fb('${k}')">${F[k] ? `<button class="acx" aria-label="Limpar ${f[k].l}" onmousedown="event.preventDefault()" onclick="A.set('${k}',null)">✕</button>` : ""}<ul id="lb-${k}" role="listbox" hidden></ul></div></div>`,
        )
        .join("")
    );
  }
  function modelHtml() {
    const T = q(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY rowid",
    ).map((t) => t.name);
    return (
      `<div class="er">` +
      T.map((t) => {
        const fk = {};
        q(`PRAGMA foreign_key_list(${t})`).forEach(
          (f) => (fk[f.from] = f.table + "." + f.to),
        );
        return `<div class="ent"><b>${t}</b>${q(`PRAGMA table_info(${t})`)
          .map(
            (c) =>
              `<div class="col"><span>${c.name}</span><i>${[c.pk ? "PK" : "", fk[c.name] ? "FK → " + fk[c.name] : ""].filter(Boolean).join(" · ")}</i></div>`,
          )
          .join("")}</div>`;
      }).join("") +
      `</div><div class="sub" style="margin-bottom:12px">View vw_ocupacao_aluno: junta aluno e alocacao (ativa = 1) e calcula horas alocadas, horas livres e taxa de ocupação.</div><div class="sub" style="margin-bottom:12px">View vw_nivel_kanban: soma a complexidade das tarefas concluídas (tabela tarefa, vinda do GitHub, Trello ou Jira) por aluno e habilidade e converte os pontos em nível de 1 a 5.</div>`
    );
  }
  function resHtml(D) {
    const xa = (id) => D.al.find((x) => x.aluno_id == id);
    const R = D.cand
        .map((c) => ({ c, m: pct(c) }))
        .filter((x) => x.m > 0 && hit(x.c))
        .sort(
          (a, b) =>
            b.m - a.m ||
            a.c.taxa - b.c.taxa ||
            maxl(b.c) - maxl(a.c) ||
            b.c.dt.localeCompare(a.c.dt),
        ),
      n = R.length;
    const h = `<div class="sec l"><span>${n} perfil${n == 1 ? "" : "s"} encontrado${n == 1 ? "" : "s"}</span><span>Por match</span></div>`;
    if (!n)
      return (
        h +
        '<div class="card"><b>Nenhum perfil encontrado</b><div class="sub" style="margin-top:6px">Remova um filtro ou mude os valores.</div></div>'
      );
    return (
      h +
      R.map(({ c, m }, i) => {
        const a = xa(c.id),
          h2 = hr(c),
          nome1 = c.nome.split(" ")[0];
        const act = a
          ? `<div class="alrow"><button class="btn p ok" onclick="A.un(${c.id})">Alocado: ${a.horas_semanais} h ✓ (remover)</button></div>`
          : CF == c.id
            ? `<div class="conf"><div class="sub">Alocar ${esc(nome1)} por ${h2} h no projeto X?</div><div class="alrow"><button class="btn p" onclick="A.ok(${c.id})">Confirmar</button><button class="btn" onclick="A.no()">Cancelar</button></div></div>`
            : `<div class="alrow"><div class="step"><button aria-label="Menos horas" onclick="A.hrs(${c.id},-1)">−</button><span>${h2} h</span><button aria-label="Mais horas" onclick="A.hrs(${c.id},1)">+</button></div><button class="btn p" ${c.hl > 0 ? "" : "disabled"} onclick="A.ask(${c.id})">Alocar no projeto X</button></div>`;
        return `<article class="card${i == 0 && m == 100 ? " best" : ""}"><div class="between"><div class="item"><div class="av s">${ini(c.nome)}</div><div><b>${esc(c.nome)}</b><div class="sub">${esc(c.curso)}</div></div></div><span class="match${m < 100 ? " part" : ""}">${m}%</span></div><div class="tags">${c.sk.map((x) => `<span class="tag">${esc(x.n)} · ${x.l}/5</span>`).join("")}</div><div class="bar"><span>Livre</span><i><b style="width:${Math.max(0, Math.min(100, c.hl * 2.5))}%"></b></i><span>${c.hl} h</span></div><div class="sub" style="margin-top:6px">${c.ha} h alocadas · perfil de ${fd(c.dt)}</div>${act}</article>`;
      }).join("")
    );
  }
  function pSearch(D) {
    let strict = [];
    try {
      strict = q(sqlStrict());
    } catch (e) {}
    const filled = D.al.length,
      total = D.req.reduce((t, r) => t + r.v, 0);
    const rule = `<div class="sub">Match = filtros atendidos ÷ filtros ativos. Ordem: maior match, menor taxa de ocupação, maior nível e perfil mais recente.</div><div class="sub" style="margin-top:6px">Nível calculado pelas tarefas concluídas no kanban (GitHub, Trello ou Jira), ponderadas por complexidade.</div><div class="sub" style="margin-top:6px">Projeto X pede: ${D.req.map((r) => `${r.v} vaga${r.v > 1 ? "s" : ""} de ${esc(r.hn)} (${r.nn}+, ${r.h} h/sem)`).join("; ")}.</div><details class="sql" style="margin-top:10px"><summary>Ver consulta SQL (${strict.length} linha${strict.length == 1 ? "" : "s"})</summary><pre>${esc(sqlStrict())};</pre></details><details class="sql" style="margin-top:10px"><summary>Ver modelo lógico do banco</summary>${modelHtml()}</details>`;
    const occB = `<button class="btn" onclick="A.oc()">${oc ? "Ocultar" : "Ver"} ocupação da equipe (${filled}) →</button>`;
    const occP = oc
      ? `<div class="card"><div class="between"><b style="font-size:15px">Ocupação da equipe</b><span class="sub">Vagas preenchidas no projeto X: ${filled} de ${total}</span></div>${D.ov
          .map((o) => {
            const r = o.horas_alocadas / o.carga_horaria_semanal;
            return `<div style="margin-top:14px"><div class="between" style="font-size:14px"><span>${esc(o.nome)}</span><span class="sub">${o.horas_alocadas} de ${o.carga_horaria_semanal} h · ${o.horas_livres} h livres</span></div><div class="bar" style="margin-top:6px"><i><b class="${r >= 0.9 ? "w" : ""}" style="width:${Math.min(100, r * 100)}%"></b></i><span>${String(o.taxa_ocupacao_pct).replace(".", ",")}%</span></div>${r >= 0.9 ? '<div class="warn">Atenção: perto do limite de horas</div>' : ""}</div>`;
          })
          .join(
            "",
          )}<div class="sub" style="margin-top:14px">Fonte: SELECT * FROM vw_ocupacao_aluno;</div></div>`
      : "";
    const ph = `Quem sabe ${F.tech || "tecnologias"}${F.lvl ? " nível " + lvl(F.lvl) : ""} e está livre${F.h ? " " + F.h + " h+" : ""} esta semana?`;
    return `<div class="sg"><div class="a-head"><h1>Quem você procura?</h1><div class="sub" style="margin-top:6px">Filtre talentos por habilidade, nível e horas livres.</div></div><div class="a-filters">${filtersHtml(ph)}</div><div class="a-res">${resHtml(D)}</div><div class="a-rule">${rule}</div><div class="a-occb">${occB}</div><div class="a-occp">${occP}</div></div>`;
  }
  function render() {
    try {
      localStorage.setItem(KU, JSON.stringify({ F, scr, oc }));
    } catch (e) {}
    $("nav").innerHTML =
      `<span class="brand">LEDS</span><button class="${scr == "p" ? "on" : ""}" ${scr == "p" ? 'aria-current="page"' : ""} onclick="A.go('p')">Perfil do talento</button><button class="${scr == "b" ? "on" : ""}" ${scr == "b" ? 'aria-current="page"' : ""} onclick="A.go('b')">Gerenciar equipe</button><span class="usr">Heitor Santos</span><button class="thm" onclick="A.th()">${TH == "dark" ? "Tema claro" : "Tema escuro"}</button>`;
    const D = data();
    $("app").innerHTML = (scr == "p" ? pProfile(D) : pSearch(D)) + logHtml();
  }
  window.A = {
    hv(v) {
      document.querySelectorAll(".hv").forEach((e) => (e.textContent = v));
    },
    h(v) {
      ex("UPDATE aluno SET carga_horaria_semanal = ? WHERE id = 1", [+v]);
      render();
    },
    rm(id) {
      ex(
        "DELETE FROM aluno_habilidade WHERE aluno_id = 1 AND habilidade_id = ?",
        [id],
      );
      toast("Habilidade removida");
      render();
    },
    add(id) {
      ex(
        "INSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (1, ?, 1)",
        [id],
      );
      toast("Habilidade adicionada (nível calculado pelas tarefas)");
      render();
    },
    imp() {
      const t = $("kb-t").value.trim();
      if (!t) {
        toast("Informe a tarefa concluída");
        $("kb-t").focus();
        return;
      }
      const n = q("SELECT COALESCE(MAX(id), 0) + 1 AS n FROM tarefa")[0].n,
        f = $("kb-f").value,
        h = +$("kb-h").value,
        c = +$("kb-c").value;
      ex(
        "INSERT INTO tarefa (id, aluno_id, habilidade_id, fonte, titulo, complexidade, data_conclusao) VALUES (?, 1, ?, ?, ?, ?, ?)",
        [n, h, f, t, c, today()],
      );
      toast("Tarefa importada de " + f + ": +" + c + " pts");
      render();
    },
    save() {
      ex("UPDATE aluno SET data_atualizacao_perfil = ? WHERE id = 1", [
        today(),
      ]);
      toast("Perfil salvo");
      render();
    },
    qs(v) {
      QT = v;
      document.querySelector(".a-res").innerHTML = resHtml(data());
    },
    pk(k) {
      PK = PK == k ? null : k;
      render();
    },
    set(k, v) {
      F[k] = v;
      PK = null;
      CF = null;
      render();
    },
    addf(k) {
      F[k] = k == "tech" ? "Python" : k == "lvl" ? 4 : 10;
      PK = k;
      render();
    },
    fo(k, el) {
      AI = 0;
      el.select();
      lb(k, "");
    },
    ft(k, v) {
      AI = 0;
      lb(k, v);
    },
    fb(k) {
      const u = $("lb-" + k),
        e = $("f-" + k);
      if (u) u.hidden = true;
      if (e) {
        e.value = FL(k);
        e.setAttribute("aria-expanded", "false");
      }
    },
    fk(e, k) {
      if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) return;
      if (e.key == "Escape") return e.target.blur();
      e.preventDefault();
      const o = fopts(k, e.target.value);
      if (e.key == "Enter") {
        if (o[AI]) A.set(k, o[AI][0]);
        return;
      }
      AI = o.length ? (AI + (e.key == "ArrowDown" ? 1 : o.length - 1)) % o.length : 0;
      lb(k, e.target.value);
    },
    th() {
      TH = TH == "dark" ? "light" : "dark";
      try {
        localStorage.setItem("leds-theme", TH);
      } catch (e) {}
      document.documentElement.dataset.theme = TH;
      render();
    },
    hrs(id, d) {
      const c = data().cand.find((x) => x.id == id);
      SEL[id] = Math.max(1, Math.min(Math.max(1, c.hl), hr(c) + d));
      render();
    },
    ask(id) {
      CF = id;
      render();
    },
    no() {
      CF = null;
      render();
    },
    ok(id) {
      const c = data().cand.find((x) => x.id == id),
        h = hr(c),
        n = q("SELECT COALESCE(MAX(id), 0) + 1 AS n FROM alocacao")[0].n;
      ex(
        "INSERT INTO alocacao (id, aluno_id, projeto_id, horas_semanais, data_inicio, data_fim, ativa) VALUES (?, ?, 1, ?, ?, NULL, 1)",
        [n, id, h, today()],
      );
      CF = null;
      toast(c.nome.split(" ")[0] + " alocado(a): " + h + " h");
      render();
    },
    un(id) {
      ex(
        "UPDATE alocacao SET ativa = 0, data_fim = ? WHERE aluno_id = ? AND projeto_id = 1 AND ativa = 1",
        [today(), id],
      );
      toast("Alocação encerrada");
      render();
    },
    oc() {
      oc = !oc;
      render();
    },
    go(s) {
      scr = s;
      PK = null;
      CF = null;
      scrollTo(0, 0);
      render();
    },
    reset() {
      initDb(true);
      F = { tech: "Python", lvl: 4, h: 10 };
      QT = "";
      PK = null;
      CF = null;
      SEL = {};
      toast("Dados iniciais restaurados");
      render();
    },
  };
  $("app").innerHTML =
    '<div class="card sub">Carregando banco de dados SQLite…</div>';
  if (typeof initSqlJs !== "function") {
    $("app").innerHTML =
      '<div class="card"><b>Não foi possível carregar o SQLite (sql.js).</b><div class="sub" style="margin-top:6px">Verifique sua conexão e recarregue a página.</div></div>';
    return;
  }
  initSqlJs()
    .then((S) => {
      SQL = S;
      try {
        initDb(false);
        render();
      } catch (e) {
        initDb(true);
        render();
      }
    })
    .catch(() => {
      $("app").innerHTML =
        '<div class="card"><b>Erro ao iniciar o banco SQLite.</b></div>';
    });
})();
