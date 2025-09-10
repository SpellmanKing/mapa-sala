<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SGST - Painel de Gestão de Salas</title>
    <link rel="stylesheet" href="./public/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
    <div class="page-container">
        <aside class="sidebar">
            <nav class="sidebar-nav">
                <ul>
                    <li>
                        <a href="#" class="nav-item active" data-target="painel-visual">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Painel Visual (Agenda)</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="nav-item" data-target="calculadora-inteligente">
                            <i class="fas fa-calculator"></i>
                            <span>Calculadora Inteligente</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="nav-item" data-target="relatorios">
                            <i class="fas fa-chart-line"></i>
                            <span>Relatórios e Exportações</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="nav-item" data-target="integracoes">
                            <i class="fas fa-puzzle-piece"></i>
                            <span>Integração Futuras</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>

        <div class="main-content-wrapper">
            <section id="painel-visual" class="content-section active">
                <header class="page-header">
                    <h1>Painel Visual de Salas</h1>
                    <button id="add-turma-btn" class="primary-btn"><i class="fas fa-plus"></i> Agendar Turma</button>
                    <button type="submit" class="primary-btn" id="alocacao-automatica-btn">Alocação Automática</button>
                </header>
                <main class="main-content">
                    <div class="calendar-header">
                        <button id="prev-month-btn" class="nav-btn"><i class="fas fa-chevron-left"></i></button>
                        <h2 id="current-month-year"></h2>
                        <button id="next-month-btn" class="nav-btn"><i class="fas fa-chevron-right"></i></button>
                        <div class="filters">
                            <select id="turno-filter" class="filter-select">
                                <option value="todos">Todos os Turnos</option>
                                <option value="manha">Manhã</option>
                                <option value="tarde">Tarde</option>
                                <option value="noite">Noite</option>
                                <option value="integral">Integral</option>
                            </select>
                            <select id="tipo-sala-filter" class="filter-select">
                                <option value="todos">Todos os Tipos</option>
                            </select>
                        </div>
                    </div>
                    <div id="calendar-grid" class="calendar-grid"></div>
                </main>
            </section>

            <section id="calculadora-inteligente" class="content-section">
                <header class="page-header">
                    <h1>Calculadora Inteligente</h1>
                </header>
                <main class="main-content">
                    <form id="schedule-form" class="form-grid">
                        <div class="form-group">
                            <label for="course-select">Curso:</label>
                            <select id="course-select" required></select>
                        </div>
                        <div class="form-group">
                            <label for="start-date-input">Data de Início:</label>
                            <input type="date" id="start-date-input" required>
                        </div>
                        <div class="form-group">
                            <label for="turno-select">Turno:</label>
                            <select id="turno-select" required>
                                <option value="" disabled selected>Selecione um turno</option>
                                <option value="Manhã">Manhã</option>
                                <option value="Tarde">Tarde</option>
                                <option value="Noite">Noite</option>
                                <option value="Integral">Integral</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Dias da Semana Letivos:</label>
                            <div id="dias-semana-container" class="checkbox-group">
                                <label><input type="checkbox" name="dias-semana" value="1" checked>Segunda</label>
                                <label><input type="checkbox" name="dias-semana" value="2" checked>Terça</label>
                                <label><input type="checkbox" name="dias-semana" value="3" checked>Quarta</label>
                                <label><input type="checkbox" name="dias-semana" value="4" checked>Quinta</label>
                                <label><input type="checkbox" name="dias-semana" value="5" checked>Sexta</label>
                                <label><input type="checkbox" name="dias-semana" value="6">Sábado</label>
                                <label><input type="checkbox" name="dias-semana" value="0">Domingo</label>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary full-width">Calcular Cronograma</button>
                    </form>
                    <div id="results" class="results-container hidden">
                        <div class="results-header">
                            <h3>Cronograma Sugerido</h3>
                            <button id="export-pdf-btn" class="btn btn-secondary"><i class="icon-download"></i> Exportar para PDF</button>
                        </div>
                        <div id="results-content">
                            <p id="course-details"></p>
                            <p id="end-date"></p>
                            <div id="calendar-visual"></div>
                        </div>
                    </div>
                </main>
            </section>

            <section id="relatorios" class="content-section">
                <header class="page-header">
                    <h1>Relatórios e Exportações</h1>
                </header>
                <main class="main-content">
                    <p>Conteúdo para Relatórios e Exportações...</p>
                </main>
            </section>
            
            <section id="integracoes" class="content-section">
                <header class="page-header">
                    <h1>Integração Futuras</h1>
                </header>
                <main class="main-content">
                    <p>Conteúdo para Integração Futuras...</p>
                </main>
            </section>
        </div>
    </div>

    <div id="agendamento-modal" class="modal">
        <div class="modal-content">
            <header class="modal-header">
                <h2>Agendar Nova Turma</h2>
                <button class="close-btn">&times;</button>
            </header>
            <form id="agendamento-form">
                <input type="hidden" id="agendamento-salaId">
                <div class="form-group">
                    <label for="curso-agendamento">Curso:</label>
                    <select id="curso-agendamento" required></select>
                </div>
                <div class="form-group">
                    <label for="instrutor-agendamento">Instrutor(a):</label>
                    <select id="instrutor-agendamento" required></select>
                </div>
                <div class="form-group">
                    <label for="data-inicio-agendamento">Data de Início:</label>
                    <input type="date" id="data-inicio-agendamento" required>
                </div>
                <div class="form-group">
                    <label for="total-alunos-agendamento">Número de Alunos:</label>
                    <input type="number" id="total-alunos-agendamento" required min="1">
                </div>
                <div class="form-group">
                    <label for="turno-agendamento">Turno:</label>
                    <select id="turno-agendamento" required>
                        <option value="" disabled selected>Selecione um turno</option>
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                        <option value="Integral">Integral</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Dias da Semana:</label>
                    <div id="dias-semana-agendamento" class="dias-semana-checkbox">
                        <label><input type="checkbox" name="dias-semana" value="2"> Seg</label>
                        <label><input type="checkbox" name="dias-semana" value="3"> Ter</label>
                        <label><input type="checkbox" name="dias-semana" value="4"> Qua</label>
                        <label><input type="checkbox" name="dias-semana" value="5"> Qui</label>
                        <label><input type="checkbox" name="dias-semana" value="6"> Sex</label>
                        <label><input type="checkbox" name="dias-semana" value="7"> Sáb</label>
                        <label><input type="checkbox" name="dias-semana" value="1"> Dom</label>
                    </div>
                </div>
                <div class="form-group" id="alocacao-automatica-container">
                    <button type="button" class="btn btn-secondary" id="alocacao-automatica-btn">Alocação Automática</button>
                    <label for="agendamento-salas-display">Sala(s) Alocada(s):</label>
                    <input type="text" id="agendamento-salas-display" placeholder="Clique em Alocação Automática" disabled>
                    <input type="hidden" id="agendamento-salas-id-input" name="salaId">
                </div>
                <button type="submit" class="primary-btn">Agendar</button>
            </form>
        </div>
    </div>

    <div id="detalhes-modal" class="modal">
        <div class="modal-content">
            <header class="modal-header">
                <h2 id="detalhes-titulo">Detalhes da Turma</h2>
                <button class="close-btn">&times;</button>
            </header>
            <div id="detalhes-conteudo">
                <p><strong>Curso:</strong> <span id="detalhes-curso"></span></p>
                <p><strong>Sala:</strong> <span id="detalhes-sala"></span></p>
                <p><strong>Datas:</strong> <span id="detalhes-datas"></span></p>
                <p><strong>Turno:</strong> <span id="detalhes-turno"></span></p>
                <p><strong>Alunos:</strong> <span id="detalhes-alunos"></span></p>
                <p><strong>Instrutor:</strong> <span id="detalhes-instrutor"></span></p>
                <p><strong>Status:</strong> <span id="detalhes-status"></span></p>
            </div>
            <form id="detalhes-form" class="form-detalhes">
                <input type="hidden" id="detalhes-turmaId">
                <div class="form-group">
                    <label for="detalhes-status-select">Alterar Status:</label>
                    <select id="detalhes-status-select" required>
                        <option value="Planejada">Planejada</option>
                        <option value="Confirmada">Confirmada</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluída">Concluída</option>
                        <option value="Cancelada">Cancelada</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="detalhes-instrutor-input">Alterar Instrutor:</label>
                    <select id="detalhes-instrutor-input" required></select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="primary-btn">Salvar Alterações</button>
                    <button type="button" class="danger-btn" id="cancelar-turma-btn">Cancelar Turma</button>
                </div>
            </form>
        </div>
    </div>

    <section id="alocacaoModal" class="modal">
        <header class="page-header">
            <h1>Alocação inteligente</h1>
        </header>
        <main class="main-content">
            <form id="alocacao-form" class="form-container">
                <div class="form-group">
                    <label for="curso-alocacao">Curso:</label>
                    <select id="curso-alocacao" required></select>
                </div>
                <div class="form-group">
                    <label for="total-alunos-alocacao">Número de Alunos:</label>
                    <input type="number" id="total-alunos-alocacao" required min="1">
                </div>
                <div class="form-group">
                    <label for="data-inicio-alocacao">Data de Início:</label>
                    <input type="date" id="data-inicio-alocacao" required>
                </div>
                <div class="form-group">
                    <label for="turno-alocacao">Turno:</label>
                    <select id="turno-alocacao" required>
                        <option value="" disabled selected>Selecione um turno</option>
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                        <option value="Integral">Integral</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Dias da Semana:</label>
                    <div id="dias-semana-alocacao" class="dias-semana-checkbox">
                        <label><input type="checkbox" value="2"> Seg</label>
                        <label><input type="checkbox" value="3"> Ter</label>
                        <label><input type="checkbox" value="4"> Qua</label>
                        <label><input type="checkbox" value="5"> Qui</label>
                        <label><input type="checkbox" value="6"> Sex</label>
                        <label><input type="checkbox" value="7"> Sáb</label>
                        <label><input type="checkbox" value="1"> Dom</label>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">Buscar Alocação</button>
            </form>
            <div id="results-content" class="results-content">
                <h3>Resultado da Sugestão:</h3>
                <div id="sugestao-alocacao"></div>
                <p id="course-details"></p>
                <p id="end-date"></p>
            </div>
        </main>
    </section>

    <div id="alocacao-modal" class="modal">
        <div class="modal-content">
            <header class="modal-header">
                <h2>Alocação Automática - Confirmação</h2>
                <button class="close-btn">&times;</button>
            </header>
            <div id="alocacao-confirmacao-conteudo">
                <p><strong>Curso:</strong> <span id="alocacao-curso-nome"></span></p>
                <p><strong>Data de Início:</strong> <span id="alocacao-data-inicio"></span></p>
                <p><strong>Data de Término (Estimada):</strong> <span id="alocacao-data-termino"></span></p>
                <p><strong>Sala(s) Sugerida(s):</strong> <span id="alocacao-salas-sugeridas"></span></p>
            </div>
            <div class="form-actions">
                <button class="primary-btn" id="confirmar-alocacao-btn">Confirmar Agendamento</button>
                <button class="secondary-btn" id="cancelar-alocacao-btn">Cancelar</button>
            </div>
        </div>
    </div>

    <script src="./public/js/script.js"></script>
</body>
</html>