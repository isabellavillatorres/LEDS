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
    tm,
    USR = null,
    RQ = "",
    PID = 1;
  try {
    USR = JSON.parse(localStorage.getItem("leds-user"));
    if (USR && USR.pid) PID = USR.pid;
  } catch (e) {}
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
    db.run("UPDATE aluno SET email = replace(email, '@exemplo.ifes', '@ifes')");
    db.run("UPDATE projeto SET nome = 'Portal do Aluno', descricao = 'Plataforma web de serviços acadêmicos do IFES' WHERE id = 1 AND nome = 'Projeto X'");
    db.run("UPDATE projeto SET nome = 'Sistema de Estágios', descricao = 'Gestão de vagas e convênios de estágio' WHERE id = 2 AND nome = 'Outros projetos'");
    persist();
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
    const me = q("SELECT * FROM aluno WHERE id = " + PID)[0];
    const mine = q(
      "SELECT h.id, h.nome, h.categoria, k.nivel, k.pontos, k.tarefas FROM vw_nivel_kanban k JOIN habilidade h ON h.id = k.habilidade_id WHERE k.aluno_id = " + PID + " ORDER BY h.id",
    );
    const src = q(
      "SELECT habilidade_id h, fonte f, COUNT(*) n FROM tarefa WHERE aluno_id = " + PID + " GROUP BY habilidade_id, fonte ORDER BY fonte",
    );
    const recent = q(
      "SELECT t.fonte, t.titulo, t.complexidade c, t.data_conclusao d, h.nome hn FROM tarefa t JOIN habilidade h ON h.id = t.habilidade_id WHERE t.aluno_id = " + PID + " ORDER BY t.data_conclusao DESC, t.id DESC LIMIT 5",
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
  const logHtml = () => "";
  const PN = () => (q("SELECT nome FROM projeto WHERE id = 1")[0] || { nome: "projeto" }).nome;
  const KB = () => {
    try {
      return JSON.parse(localStorage.getItem("leds-kanban-" + PID));
    } catch (e) {
      return null;
    }
  };
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function csv(head, rows, name) {
    const c = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const t = [head].concat(rows).map((r) => r.map(c).join(";")).join("\r\n");
    downloadBlob(new Blob(["\ufeff" + t], { type: "text/csv;charset=utf-8" }), name + "-" + today() + ".csv");
    toast("Relatório exportado");
  }
  let EXP = null;
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
      ? `<div class="kbf"><div class="fld"><label for="kb-f">Ferramenta</label><select id="kb-f" class="q">${FONTES.map((f) => `<option>${f}</option>`).join("")}</select></div><div class="fld"><label for="kb-h">Habilidade</label><select id="kb-h" class="q">${D.mine.map((m) => `<option value="${m.id}">${esc(m.nome)}</option>`).join("")}</select></div><div class="fld"><label for="kb-c">Complexidade (pts)</label><select id="kb-c" class="q">${CPX.map((c) => `<option value="${c}"${c == 3 ? " selected" : ""}>${c} pts</option>`).join("")}</select></div><div class="fld kbt"><label for="kb-t">Tarefa concluída</label><input id="kb-t" class="q" placeholder="Ex.: Issue #42 – API de login"></div></div><button class="btn p" style="margin-top:12px" onclick="A.imp()">Registrar tarefa concluída</button>`
      : '<div class="sub" style="margin-top:12px">Adicione uma habilidade no catálogo para registrar tarefas.</div>';
    const kb = KB();
    const con = kb
      ? `<div class="between kbc"><span><span class="match">Conectado</span> <b>${esc(kb.f)}</b> <span class="sub">${esc(kb.u)}</span></span><button class="btn" onclick="A.kbx()">Desconectar</button></div>`
      : `<div class="kbf"><div class="fld"><label for="kc-f">Ferramenta</label><select id="kc-f" class="q">${FONTES.map((f) => `<option>${f}</option>`).join("")}</select></div><div class="fld kbt"><label for="kc-u">Endereço do quadro ou repositório</label><input id="kc-u" class="q" type="url" placeholder="https://github.com/leds-ifes/portal"></div></div><button class="btn" style="margin-top:12px" onclick="A.kbc()">Conectar quadro</button>`;
    return `<div class="card"><div class="between"><b style="font-size:15px">Integração com kanban</b><span class="sub">GitHub · Trello · Jira</span></div><div class="sub" style="margin:4px 0 0">Seu nível em cada habilidade é calculado pela complexidade das tarefas concluídas.</div><div class="sub" style="margin-top:4px">${rule}</div><div style="margin-top:12px">${con}</div>${form}<div style="margin-top:14px"><b style="font-size:14px">Últimas tarefas concluídas</b>${rows}</div></div>`;
  }
  function pProfile(D) {
    const me = D.me,
      o = D.ov.find((x) => x.aluno_id == PID),
      nv = NV(),
      hb = HB();
    const who = `<div class="who"><div class="av">${ini(me.nome)}</div><div><b>${esc(me.nome)}</b><div class="sub">${esc(me.curso)} · LEDS / IFES</div><div class="sub">${esc(me.email)}</div>${USR.pid == me.id ? `<button class="btn" style="margin-top:10px" onclick="A.go('cf')">Configurações</button>` : ""}</div></div>`;
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
    return `<div class="pg"><div class="a-who">${who}</div><div class="a-av">${avail}</div><div class="a-sec">${sec}</div><div class="sk a-sk">${sk}</div><div class="a-cat">${cat}${kanbanHtml(D, nv)}</div><div class="a-save"><button class="btn" onclick="A.save()">Salvar perfil</button> <button class="btn" onclick="A.hist()">Ver histórico</button></div></div>`;
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
            ? `<div class="conf"><div class="sub">Alocar ${esc(nome1)} por ${h2} h em ${esc(PN())}?</div><div class="alrow"><button class="btn p" onclick="A.ok(${c.id})">Confirmar</button><button class="btn" onclick="A.no()">Cancelar</button></div></div>`
            : `<div class="alrow"><div class="step"><button aria-label="Menos horas" onclick="A.hrs(${c.id},-1)">−</button><span>${h2} h</span><button aria-label="Mais horas" onclick="A.hrs(${c.id},1)">+</button></div><button class="btn p" ${c.hl > 0 ? "" : "disabled"} onclick="A.ask(${c.id})">Alocar em ${esc(PN())}</button></div>`;
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
    const rule = `<div class="sub">Match = filtros atendidos ÷ filtros ativos. Ordem: maior match, menor taxa de ocupação, maior nível e perfil mais recente.</div><div class="sub" style="margin-top:6px">Nível calculado pelas tarefas concluídas no kanban (GitHub, Trello ou Jira), ponderadas por complexidade.</div><div class="sub" style="margin-top:6px">${esc(PN())} pede: ${D.req.map((r) => `${r.v} vaga${r.v > 1 ? "s" : ""} de ${esc(r.hn)} (${r.nn}+, ${r.h} h/sem)`).join("; ")}.</div>`;
    const occB = `<button class="btn" onclick="A.oc()">${oc ? "Ocultar" : "Ver"} ocupação da equipe (${filled}) →</button>`;
    const occP = oc
      ? `<div class="card"><div class="between"><b style="font-size:15px">Ocupação da equipe</b><span class="sub">Vagas preenchidas em ${esc(PN())}: ${filled} de ${total}</span></div>${D.ov
          .map((o) => {
            const r = o.horas_alocadas / o.carga_horaria_semanal;
            return `<div style="margin-top:14px"><div class="between" style="font-size:14px"><span>${esc(o.nome)}</span><span class="sub">${o.horas_alocadas} de ${o.carga_horaria_semanal} h · ${o.horas_livres} h livres</span></div><div class="bar" style="margin-top:6px"><i><b class="${r >= 0.9 ? "w" : ""}" style="width:${Math.min(100, r * 100)}%"></b></i><span>${String(o.taxa_ocupacao_pct).replace(".", ",")}%</span></div>${r >= 0.9 ? '<div class="warn">Atenção: perto do limite de horas</div>' : ""}</div>`;
          })
          .join(
            "",
          )}</div>`
      : "";
    const ph = `Quem sabe ${F.tech || "tecnologias"}${F.lvl ? " nível " + lvl(F.lvl) : ""} e está livre${F.h ? " " + F.h + " h+" : ""} esta semana?`;
    return `<div class="sg"><div class="a-head"><h1>Quem você procura?</h1><div class="sub" style="margin-top:6px">Filtre estudantes por habilidade, nível e horas livres.</div></div><div class="a-filters">${filtersHtml(ph)}</div><div class="a-res">${resHtml(D)}</div><div class="a-rule">${rule}</div><div class="a-occb">${occB}</div><div class="a-occp">${occP}</div></div>`;
  }

  const nomeDe = (em) =>
    em.split("@")[0].split(/[._-]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || em;
  let LM = "in";
  const ACC = () => {
    try {
      return JSON.parse(localStorage.getItem("leds-accounts")) || {};
    } catch (e) {
      return {};
    }
  };
  function pLogin() {
    const up = LM == "up";
    const tab = (k, t) => `<button type="button" class="lgt${LM == k ? " on" : ""}" onclick="A.lm('${k}')">${t}</button>`;
    return `<div class="lg"><div class="card lgc"><span class="brand lgb">LEDS</span><div class="lgtabs">${tab("in", "Entrar")}${tab("up", "Cadastrar")}</div><h1>${up ? "Criar conta" : "Entrar"}</h1><div class="sub" style="margin:6px 0 16px">${up ? "Primeira vez no LEDS? Cadastre-se para criar seu perfil." : "Matriz de competências e alocação de desenvolvedores."}</div><form onsubmit="A.login(event)"><div class="fld"><label for="lg-n">Nome completo</label><input id="lg-n" class="q" required autocomplete="name" placeholder="Seu nome"></div><div class="fld" style="margin-top:12px"><label for="lg-e">E-mail</label><input id="lg-e" class="q" type="email" required autocomplete="username" placeholder="voce@ifes.edu.br"></div><div class="fld" style="margin-top:12px"><label for="lg-s">Senha</label><input id="lg-s" class="q" type="password" required minlength="${up ? 6 : 1}" autocomplete="${up ? "new-password" : "current-password"}" placeholder="••••••"></div><fieldset class="lgr"><legend>Você é…</legend><label class="lgo"><input type="radio" name="lg-p" value="Gestor" required><span><b>Gestor</b><small>Gerencia equipes e projetos</small></span></label><label class="lgo"><input type="radio" name="lg-p" value="Estudante" required><span><b>Estudante</b><small>Mostra suas habilidades</small></span></label></fieldset><div id="lg-err" class="warn" hidden style="margin-top:12px"></div><button class="btn p" type="submit" style="width:100%;margin-top:16px">${up ? "Cadastrar" : "Entrar"}</button></form><div class="sub" style="margin-top:14px;text-align:center">${up ? 'Já tem conta? <button type="button" class="plink" onclick="A.lm(\'in\')">Entrar</button>' : 'Primeira vez aqui? <button type="button" class="plink" onclick="A.lm(\'up\')">Cadastre-se</button>'}</div></div></div>`;
  }
  function pGestor() {
    const pj = q("SELECT * FROM projeto WHERE status = 'Ativo' ORDER BY id");
    const eq = q("SELECT al.projeto_id p, a.nome, a.curso, al.horas_semanais h FROM alocacao al JOIN aluno a ON a.id = al.aluno_id WHERE al.ativa = 1 ORDER BY a.nome");
    const tot = q("SELECT COUNT(*) n FROM aluno WHERE ativo = 1")[0].n;
    const cards = pj.map((p) => {
      const m = eq.filter((x) => x.p == p.id);
      return `<div class="card rp"><div class="between"><div><b>${esc(p.nome)}</b><div class="sub">${esc(p.descricao || "")}</div></div><span class="sub">${m.length} pessoa(s) · ${m.reduce((s, x) => s + x.h, 0)} h/sem</span></div>${m.length ? `<table class="rt"><thead><tr><th>Pessoa</th><th>Curso</th><th>Horas/sem</th></tr></thead><tbody>${m.map((x) => `<tr><td>${esc(x.nome)}</td><td class="sub">${esc(x.curso || "")}</td><td>${x.h} h</td></tr>`).join("")}</tbody></table>` : '<div class="sub" style="margin-top:10px">Nenhuma pessoa alocada.</div>'}</div>`;
    }).join("");
    return `<div class="pg rep"><div class="card"><div class="who"><span class="av">${ini(USR.nome)}</span><div><h1>${esc(USR.nome)}</h1><div class="sub">${esc(USR.email)} · Gestor</div></div></div><div class="between" style="margin-top:14px"><span class="sub">Projetos ativos: <b>${pj.length}</b></span><span class="sub">Estudantes no LEDS: <b>${tot}</b></span></div><button class="btn p" style="margin-top:14px" onclick="A.go('b')">Gerenciar equipe</button> <button class="btn" style="margin-top:14px" onclick="A.go('cf')">Configurações</button></div><h2 style="margin-top:20px">Minhas equipes</h2><div class="rl">${cards || '<div class="card sub">Nenhum projeto ativo.</div>'}</div></div>`;
  }
  const lvTag = (l) => `<span class="tag rl${l}">${l} · ${esc(nm(l))}</span>`;
  function rSearch(ph) {
    return `<input class="q" style="margin-top:14px" placeholder="${ph}" value="${esc(RQ)}" oninput="A.rq(this.value)" id="rq">`;
  }
  function pRepPessoas() {
    const al = q("SELECT a.id, a.nome, a.email, a.curso, a.carga_horaria_semanal carga, COALESCE(o.horas_livres, a.carga_horaria_semanal) hl FROM aluno a LEFT JOIN vw_ocupacao_aluno o ON o.aluno_id = a.id WHERE a.ativo = 1 ORDER BY a.nome");
    const sk = q("SELECT k.aluno_id id, h.nome n, h.categoria c, k.nivel l, k.pontos p FROM vw_nivel_kanban k JOIN habilidade h ON h.id = k.habilidade_id ORDER BY k.nivel DESC, h.nome");
    const t = RQ.trim().toLowerCase();
    const rows = al
      .map((a) => ({ ...a, sk: sk.filter((x) => x.id == a.id) }))
      .filter((a) => !t || [a.nome, a.curso].concat(a.sk.map((x) => x.n)).some((v) => String(v).toLowerCase().includes(t)));
    const body = rows.length
      ? rows.map((a) => `<div class="card rp"><div class="between"><div class="who"><span class="av">${ini(a.nome)}</span><div><button class="plink" onclick="A.ver(${a.id})" title="Ver perfil">${esc(a.nome)}</button><div class="sub">${esc(a.curso || "")} · ${a.carga} h/sem · ${a.hl} h livres</div></div></div><span class="sub">${a.sk.length} habilidade(s)</span></div>${a.sk.length ? `<table class="rt"><thead><tr><th>Habilidade</th><th>Categoria</th><th>Nível</th><th>Pontos</th></tr></thead><tbody>${a.sk.map((x) => `<tr><td>${esc(x.n)}</td><td class="sub">${esc(x.c)}</td><td>${lvTag(x.l)}</td><td>${x.p}</td></tr>`).join("")}</tbody></table>` : '<div class="sub" style="margin-top:10px">Sem habilidades registradas.</div>'}</div>`).join("")
      : '<div class="card sub">Nenhuma pessoa encontrada.</div>';
    EXP = { n: "relatorio-por-pessoa", h: ["Nome", "E-mail", "Curso", "Carga (h/sem)", "Horas livres", "Habilidade", "Categoria", "Nível", "Pontos"], r: rows.flatMap((a) => (a.sk.length ? a.sk : [null]).map((x) => [a.nome, a.email, a.curso, a.carga, a.hl, x ? x.n : "", x ? x.c : "", x ? x.l + " - " + nm(x.l) : "", x ? x.p : ""])) };
    return `<div class="pg rep"><div class="between rh"><div><h1>Relatório por pessoa</h1><div class="sub" style="margin-top:6px">Cada pessoa do LEDS com suas habilidades e níveis.</div></div><div class="alrow"><button class="btn p" onclick="A.exp()">Exportar CSV</button><button class="btn" onclick="print()">Imprimir</button></div></div>${rSearch("Buscar por nome, curso ou habilidade…")}<div class="rl">${body}</div></div>`;
  }
  function pRepHab() {
    const hb = HB();
    const sk = q("SELECT k.habilidade_id h, a.nome n, a.curso c, k.nivel l, k.pontos p FROM vw_nivel_kanban k JOIN aluno a ON a.id = k.aluno_id WHERE a.ativo = 1 ORDER BY k.nivel DESC, k.pontos DESC, a.nome");
    const t = RQ.trim().toLowerCase();
    const rows = hb
      .map((h) => ({ ...h, ps: sk.filter((x) => x.h == h.id) }))
      .filter((h) => !t || [h.nome, h.categoria].concat(h.ps.map((x) => x.n)).some((v) => String(v).toLowerCase().includes(t)));
    const body = rows.length
      ? rows.map((h) => `<div class="card rp"><div class="between"><div><b>${esc(h.nome)}</b><div class="sub">${esc(h.categoria)}</div></div><span class="sub">${h.ps.length} pessoa(s)${h.ps.length ? " · média " + (h.ps.reduce((s, x) => s + x.l, 0) / h.ps.length).toFixed(1) : ""}</span></div>${h.ps.length ? `<table class="rt"><thead><tr><th>Pessoa</th><th>Curso</th><th>Nível</th><th>Pontos</th></tr></thead><tbody>${h.ps.map((x) => `<tr><td>${esc(x.n)}</td><td class="sub">${esc(x.c || "")}</td><td>${lvTag(x.l)}</td><td>${x.p}</td></tr>`).join("")}</tbody></table>` : '<div class="sub" style="margin-top:10px">Ninguém possui essa habilidade ainda.</div>'}</div>`).join("")
      : '<div class="card sub">Nenhuma habilidade encontrada.</div>';
    EXP = { n: "relatorio-por-habilidade", h: ["Habilidade", "Categoria", "Pessoa", "Curso", "Nível", "Pontos"], r: rows.flatMap((h) => (h.ps.length ? h.ps : [null]).map((x) => [h.nome, h.categoria, x ? x.n : "", x ? x.c : "", x ? x.l + " - " + nm(x.l) : "", x ? x.p : ""])) };
    return `<div class="pg rep"><div class="between rh"><div><h1>Relatório por habilidade</h1><div class="sub" style="margin-top:6px">Cada habilidade do catálogo e as pessoas que a possuem.</div></div><div class="alrow"><button class="btn p" onclick="A.exp()">Exportar CSV</button><button class="btn" onclick="print()">Imprimir</button></div></div>${rSearch("Buscar por habilidade, categoria ou pessoa…")}<div class="rl">${body}</div></div>`;
  }
  function pHist() {
    const me = q("SELECT * FROM aluno WHERE id = " + PID)[0];
    const al = q("SELECT al.*, p.nome pn FROM alocacao al JOIN projeto p ON p.id = al.projeto_id WHERE al.aluno_id = ? ORDER BY al.data_inicio DESC, al.id DESC", [PID]);
    const tk = q("SELECT t.*, h.nome hn FROM tarefa t JOIN habilidade h ON h.id = t.habilidade_id WHERE t.aluno_id = ? ORDER BY t.data_conclusao, t.id", [PID]);
    const nv = NV(), acc = {}, ev = [];
    tk.forEach((t) => {
      const b = acc[t.habilidade_id] || 0, a = b + t.complexidade;
      acc[t.habilidade_id] = a;
      ev.push({ d: t.data_conclusao, k: "t", t: `${esc(t.titulo)} · ${esc(t.hn)}`, s: `${t.fonte} · +${t.complexidade} pts` });
      LIM.forEach((l, i) => {
        if (b < l && a >= l) ev.push({ d: t.data_conclusao, k: "n", t: `Subiu para ${nv[i + 1].nome} em ${esc(t.hn)}`, s: `Nível ${i + 2} · ${a} pts acumulados` });
      });
    });
    al.forEach((x) => {
      ev.push({ d: x.data_inicio, k: "a", t: `Entrou em ${esc(x.pn)}`, s: `${x.horas_semanais} h/sem` });
      if (x.data_fim) ev.push({ d: x.data_fim, k: "f", t: `Saiu de ${esc(x.pn)}`, s: `${x.horas_semanais} h/sem` });
    });
    ev.reverse().sort((a, b) => b.d.localeCompare(a.d));
    const ic = { t: "✓", n: "★", a: "→", f: "←" };
    const pts = tk.reduce((s, t) => s + t.complexidade, 0), npj = new Set(al.map((x) => x.projeto_id)).size;
    const stat = (v, l) => `<div class="card hst"><span class="big">${v}</span><div class="sub">${l}</div></div>`;
    const alT = al.length
      ? `<table class="rt"><thead><tr><th>Projeto</th><th>Horas/sem</th><th>Período</th><th>Situação</th></tr></thead><tbody>${al.map((x) => `<tr><td>${esc(x.pn)}</td><td>${x.horas_semanais} h</td><td class="sub">${fd(x.data_inicio)} – ${x.data_fim ? fd(x.data_fim) : "atual"}</td><td>${x.ativa ? '<span class="match">Ativa</span>' : '<span class="sub">Encerrada</span>'}</td></tr>`).join("")}</tbody></table>`
      : '<div class="sub" style="margin-top:10px">Nenhuma alocação registrada.</div>';
    const tl = ev.length
      ? ev.slice(0, 40).map((e) => `<div class="hev"><span class="hic h${e.k}">${ic[e.k]}</span><div style="flex:1"><div class="between"><b style="font-size:14px">${e.t}</b><span class="sub">${fd(e.d)}</span></div><div class="sub">${e.s}</div></div></div>`).join("")
      : '<div class="sub" style="margin-top:10px">Nenhuma atividade registrada ainda.</div>';
    const mine = USR.pid == PID;
    return `<div class="pg rep"><div class="between rh"><div><h1>${mine ? "Meu histórico" : "Histórico de " + esc(me.nome)}</h1><div class="sub" style="margin-top:6px">Alocações, tarefas concluídas e evolução de nível.</div></div><button class="btn" onclick="A.go('p')">Ver perfil</button></div><div class="hsts">${stat(tk.length, "tarefas concluídas")}${stat(pts, "pontos acumulados")}${stat(npj, "projetos")}</div><div class="card"><b style="font-size:15px">Alocações</b>${alT}</div><div class="card"><b style="font-size:15px">Linha do tempo</b>${tl}</div></div>`;
  }
  function pConf() {
    const st = USR.papel == "Estudante", me = st ? q("SELECT * FROM aluno WHERE id = " + USR.pid)[0] : null;
    const f = (id, l, v, t, x) => `<div class="fld" style="margin-top:12px"><label for="${id}">${l}</label><input id="${id}" class="q" type="${t || "text"}" value="${esc(v || "").replace(/"/g, "&quot;")}" ${x || ""}></div>`;
    return `<div class="pg rep cfp"><h1>Configurações da conta</h1><div class="sub" style="margin-top:6px">${esc(USR.email)} · ${esc(USR.papel)}</div>
<div class="card"><b style="font-size:15px">Dados pessoais</b>${f("cf-n", "Nome completo", USR.nome, "text", "required")}${st ? f("cf-c", "Curso", me.curso) + f("cf-h", "Carga horária semanal (h)", me.carga_horaria_semanal, "number", 'min="1" max="40"') : ""}<button class="btn p" style="margin-top:14px" onclick="A.cfd()">Salvar dados</button></div>
<div class="card"><b style="font-size:15px">Trocar senha</b>${f("cf-a", "Senha atual", "", "password", 'autocomplete="current-password"')}${f("cf-s", "Nova senha", "", "password", 'autocomplete="new-password"')}${f("cf-r", "Confirmar nova senha", "", "password", 'autocomplete="new-password"')}<div id="cf-err" class="warn" hidden style="margin-top:12px"></div><button class="btn p" style="margin-top:14px" onclick="A.cfs()">Alterar senha</button></div>
<div class="card"><div class="between"><div><b style="font-size:15px">Aparência</b><div class="sub">Tema ${TH == "dark" ? "escuro" : "claro"} ativo</div></div><button class="btn" onclick="A.th()">${TH == "dark" ? "Usar tema claro" : "Usar tema escuro"}</button></div></div>
<div class="card"><div class="between"><div><b style="font-size:15px">Sessão</b><div class="sub">Encerrar o acesso neste dispositivo</div></div><button class="btn" onclick="A.logout()">Sair da conta</button></div></div></div>`;
  }
  function render() {
    try {
      localStorage.setItem(KU, JSON.stringify({ F, scr, oc }));
    } catch (e) {}
    if (!USR) {
      $("nav").innerHTML = "";
      $("nav").hidden = true;
      $("app").innerHTML = pLogin();
      return;
    }
    $("nav").hidden = false;
    const G = USR.papel == "Gestor";
    const ok = G ? ["g", "b", "rp", "rh", "p", "hi", "cf"] : ["p", "hi", "rp", "rh", "cf"];
    if (scr != "p" && scr != "hi" && USR.pid) PID = USR.pid;
    if (!ok.includes(scr)) scr = ok[0];
    const nb = (k, t) => `<button class="${scr == k ? "on" : ""}" ${scr == k ? 'aria-current="page"' : ""} onclick="A.go('${k}')">${t}</button>`;
    $("nav").innerHTML =
      `<span class="brand">LEDS</span><span class="links">${G ? nb("g", "Perfil do gestor") + nb("b", "Gerenciar equipe") : nb("p", "Meu perfil") + nb("hi", "Meu histórico")}${nb("rp", "Relatório por pessoa")}${nb("rh", "Relatório por habilidade")}</span><span class="end"><span class="usr">${esc(USR.nome)} · ${esc(USR.papel)}</span><button class="thm" onclick="A.logout()">Sair</button></span>`;
    const D = data();
    $("app").innerHTML =
      (scr == "g" ? pGestor() : scr == "p" ? pProfile(D) : scr == "b" ? pSearch(D) : scr == "rp" ? pRepPessoas() : scr == "hi" ? pHist() : scr == "cf" ? pConf() : pRepHab()) + logHtml();
  }
  window.A = {
    lm(m) {
      LM = m;
      render();
    },
    login(e) {
      e.preventDefault();
      const err = (t) => {
        $("lg-err").textContent = t;
        $("lg-err").hidden = false;
      };
      const no = $("lg-n").value.trim().replace(/\s+/g, " "),
        em = $("lg-e").value.trim().toLowerCase(),
        se = $("lg-s").value;
      const pp = document.querySelector('input[name="lg-p"]:checked');
      if (!no) return err("Informe seu nome.");
      if (!pp) return err("Escolha se você é gestor ou estudante.");
      const acc = ACC();
      if (LM == "up") {
        if (acc[em]) return err("Este e-mail já está cadastrado. Use a aba Entrar.");
        acc[em] = { nome: no, senha: se, papel: pp.value };
        try {
          localStorage.setItem("leds-accounts", JSON.stringify(acc));
        } catch (er) {}
      } else {
        const c = acc[em];
        if (!c) return err("Conta não encontrada. Se é sua primeira vez, cadastre-se.");
        if (c.senha !== se) return err("Senha incorreta.");
        if (c.papel !== pp.value) return err("Esta conta está cadastrada como " + c.papel + ".");
        c.nome = no;
        try {
          localStorage.setItem("leds-accounts", JSON.stringify(acc));
        } catch (er) {}
      }
      const st = pp.value == "Estudante";
      USR = { nome: no, papel: pp.value, email: em };
      if (st) {
        let a = q("SELECT id FROM aluno WHERE lower(email) = ?", [em])[0];
        if (!a) {
          const n = q("SELECT COALESCE(MAX(id), 0) + 1 AS n FROM aluno")[0].n;
          ex("INSERT INTO aluno (id, nome, email, curso, carga_horaria_semanal, ativo, data_atualizacao_perfil) VALUES (?, ?, ?, ?, ?, 1, ?)", [n, no, em, "Estudante", 20, today()]);
          a = { id: n };
        } else ex("UPDATE aluno SET nome = ? WHERE id = ?", [no, a.id]);
        USR.pid = a.id;
        PID = a.id;
      }
      try {
        localStorage.setItem("leds-user", JSON.stringify(USR));
      } catch (er) {}
      const novo = LM == "up";
      LM = "in";
      scr = st ? "p" : "g";
      toast((novo ? "Conta criada! " : "") + "Bem-vindo(a), " + no.split(" ")[0]);
      render();
    },
    logout() {
      USR = null;
      try {
        localStorage.removeItem("leds-user");
      } catch (er) {}
      render();
    },
    rq(v) {
      RQ = v;
      render();
      const i = $("rq");
      if (i) {
        i.focus();
        i.setSelectionRange(v.length, v.length);
      }
    },
    hv(v) {
      document.querySelectorAll(".hv").forEach((e) => (e.textContent = v));
    },
    h(v) {
      ex("UPDATE aluno SET carga_horaria_semanal = ? WHERE id = ?", [+v, PID]);
      render();
    },
    rm(id) {
      ex(
        "DELETE FROM aluno_habilidade WHERE aluno_id = ? AND habilidade_id = ?",
        [PID, id],
      );
      toast("Habilidade removida");
      render();
    },
    add(id) {
      ex(
        "INSERT INTO aluno_habilidade (aluno_id, habilidade_id, nivel) VALUES (?, ?, 1)",
        [PID, id],
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
        "INSERT INTO tarefa (id, aluno_id, habilidade_id, fonte, titulo, complexidade, data_conclusao) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [n, PID, h, f, t, c, today()],
      );
      toast("Tarefa registrada (" + f + ")"+"" + ": +" + c + " pts");
      render();
    },
    save() {
      ex("UPDATE aluno SET data_atualizacao_perfil = ? WHERE id = ?", [
        today(),
        PID,
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
    ver(id) {
      PID = id;
      scr = "p";
      RQ = "";
      scrollTo(0, 0);
      render();
    },
    hist() {
      scr = "hi";
      scrollTo(0, 0);
      render();
    },
    exp() {
      if (EXP) csv(EXP.h, EXP.r, EXP.n);
    },
    kbc() {
      const u = $("kc-u").value.trim();
      if (!/^https?:\/\/\S+\.\S+/.test(u)) {
        toast("Informe o endereço do quadro");
        $("kc-u").focus();
        return;
      }
      try {
        localStorage.setItem("leds-kanban-" + PID, JSON.stringify({ f: $("kc-f").value, u }));
      } catch (e) {}
      toast("Quadro conectado");
      render();
    },
    kbx() {
      try {
        localStorage.removeItem("leds-kanban-" + PID);
      } catch (e) {}
      toast("Quadro desconectado");
      render();
    },
    cfd() {
      const no = $("cf-n").value.trim().replace(/\s+/g, " ");
      if (!no) return toast("Informe seu nome");
      const acc = ACC();
      if (acc[USR.email]) acc[USR.email].nome = no;
      USR.nome = no;
      if (USR.pid) {
        const h = Math.max(1, Math.min(40, +$("cf-h").value || 1));
        ex("UPDATE aluno SET nome = ?, curso = ?, carga_horaria_semanal = ?, data_atualizacao_perfil = ? WHERE id = ?", [no, $("cf-c").value.trim(), h, today(), USR.pid]);
      }
      try {
        localStorage.setItem("leds-accounts", JSON.stringify(acc));
        localStorage.setItem("leds-user", JSON.stringify(USR));
      } catch (e) {}
      toast("Dados salvos");
      render();
    },
    cfs() {
      const err = (t) => {
        $("cf-err").textContent = t;
        $("cf-err").hidden = false;
      };
      const acc = ACC(), c = acc[USR.email];
      if (!c || c.senha !== $("cf-a").value) return err("Senha atual incorreta.");
      const n = $("cf-s").value;
      if (n.length < 6) return err("A nova senha precisa ter pelo menos 6 caracteres.");
      if (n !== $("cf-r").value) return err("As senhas não coincidem.");
      c.senha = n;
      try {
        localStorage.setItem("leds-accounts", JSON.stringify(acc));
      } catch (e) {}
      toast("Senha alterada");
      render();
    },
    go(s) {
      if (USR && USR.pid) PID = USR.pid;
      scr = s;
      RQ = "";
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
    '<div class="card sub">Carregando…</div>';
  if (typeof initSqlJs !== "function") {
    $("app").innerHTML =
      '<div class="card"><b>Não foi possível carregar o aplicativo.</b><div class="sub" style="margin-top:6px">Verifique sua conexão e recarregue a página.</div></div>';
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
        '<div class="card"><b>Não foi possível iniciar o aplicativo.</b><div class="sub" style="margin-top:6px">Recarregue a página.</div></div>';
    });
})();
