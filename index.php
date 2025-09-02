<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SGST - Painel de Gestão de Salas</title>
    <link rel="stylesheet" href="./public/css/style.css">
</head>
<body>
    <div class="page-container">
        <aside class="sidebar">
            <nav class="sidebar-nav">
                <ul>
                    <li>
                        <a href="#" class="nav-item active">
                            <i class="icon-dashboard"></i>
                            <span>Painel Visual(Agenda)</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="nav-item">
                            <i class="icon-smart-allocation"></i>
                            <span>Calculadora Inteligente</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="nav-item">
                            <i class="icon-reports"></i>
                            <span>Relatórios e Exportações</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" class="nav-item">
                            <i class="icon-integrations"></i>
                            <span>Integração Futuras</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>
        <div class="main-content-wrapper">
            <header class="page-header">
                <h1>Painel de Gestão de Salas e Turmas</h1>
                <div class="header-actions">
                    <button id="add-turma-btn" class="btn btn-primary">+Agendar Nova Turma</button>
                    <button id="alocacao-automatica-btn" class="btn btn-primary">
                        <i class="icon-smart-allocation"></i> Alocação Automática
                    </button>
                </div>
            </header>
            <main class="main-content">
                <nav class="toolbar">
                    <div class="navigation">
                        <button id="prev-month-btn" class="btn btn-icon">&lt;</button>
                        <h2 id="current-month-year" class="month-title"></h2>
                        <button id="next-month-btn" class="btn btn-icon">&gt;</button>
                    </div>
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
                </nav>
                <div class="schedule-container">
                    <div class="schedule-grid" id="schedule-grid"></div>
                </div>
            </main>
        </div>
    </div>

    <div id="agendamento-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Agendar Turma</h2>
                <span class="close-btn">&times;</span>
            </div>
            <div class="modal-body">
                <form id="agendamento-form">
                    <input type="hidden" id="agendamento-sala-id" name="agendamento_sala_id">
                    <p id="agendamento-info"></p>
                    <label for="agendamento-curso">Curso:</label>
                    <select id="agendamento-curso" required></select>

                    <label for="agendamento-instrutor">Instrutor:</label>
                    <input type="text" id="agendamento-instrutor" placeholder="Nome do Instrutor" list="agendamento-instrutores-list">
                    <datalist id="agendamento-instrutores-list"></datalist>

                    <label for="agendamento-data-inicio">Data de Início:</label>
                    <input type="date" id="agendamento-data-inicio" required>

                    <label for="dias-letivos-checkbox-container">Dias da Semana Letivos:</label>
                    <div class="checkbox-group" id="dias-letivos-checkbox-container">
                        <label><input type="checkbox" name="dias-semana" value="1">Segunda</label>
                        <label><input type="checkbox" name="dias-semana" value="2">Terça</label>
                        <label><input type="checkbox" name="dias-semana" value="3">Quarta</label>
                        <label><input type="checkbox" name="dias-semana" value="4">Quinta</label>
                        <label><input type="checkbox" name="dias-semana" value="5">Sexta</label>
                        <label><input type="checkbox" name="dias-semana" value="6">Sábado</label>
                        <label><input type="checkbox" name="dias-semana" value="0">Domingo</label>
                    </div>
                    
                    <label for="agendamento-total-alunos">Total de Alunos:</label>
                    <input type="number" id="agendamento-total-alunos" required>

                    <label>Turno:</label>
                    <div class="checkbox-group" id="turnos-checkboxes">
                        <label><input type="radio" name="turno" value="Manhã" class="turno-radio"> Manhã</label>
                        <label><input type="radio" name="turno" value="Tarde" class="turno-radio"> Tarde</label>
                        <label><input type="radio" name="turno" value="Noite" class="turno-radio"> Noite</label>
                        <label><input type="radio" name="turno" value="Integral" class="turno-radio"> Integral</label>
                    </div>
                    
                    <label for="agendamento-sala-display">Sala(s) Alocada(s):</label>
                    <div class="sala-inputs">
                        <input type="text" id="agendamento-sala-display" placeholder="Clique em Alocação Automática" disabled>
                        <input type="hidden" id="agendamento-sala-id-input" name="salaId">
                    </div>

                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary" id="agendar-btn">Agendar Turma</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div id="alocacaoModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Alocação Inteligente</h2>
                <span class="close-btn">&times;</span>
            </div>
            <div class="modal-body">
                <form id="alocacao-form">
                    <label for="alocacao-curso">Curso:</label>
                    <select id="alocacao-curso" required></select>
                    
                    <label for="alocacao-alunos">Nº de Alunos:</label>
                    <input type="number" id="alocacao-alunos" required>
                    
                    <label for="alocacao-turno">Turno:</label>
                    <select id="alocacao-turno" required>
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                        <option value="Integral">Integral</option>
                    </select>
                    
                    <label>Dias da Semana:</label>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="diasSemana" value="1"> Segunda</label>
                        <label><input type="checkbox" name="diasSemana" value="2"> Terça</label>
                        <label><input type="checkbox" name="diasSemana" value="3"> Quarta</label>
                        <label><input type="checkbox" name="diasSemana" value="4"> Quinta</label>
                        <label><input type="checkbox" name="diasSemana" value="5"> Sexta</label>
                        <label><input type="checkbox" name="diasSemana" value="6"> Sábado</label>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">Buscar Alocação</button>
                    </div>
                </form>

                <div id="sugestao-alocacao" style="display:none; margin-top: 20px;">
                    <h4>Sugestão de Alocação:</h4>
                    <p id="sugestao-mensagem"></p>
                    <ul id="salas-sugeridas-lista"></ul>
                    <div class="modal-actions">
                        <button id="confirmar-alocacao-btn" class="btn btn-success">Confirmar</button>
                        <button id="cancelar-sugestao-btn" class="btn btn-secondary">Cancelar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="detalhes-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Detalhes da Turma</h2>
                <span class="close-btn">&times;</span>
            </div>
            <div class="modal-body">
                <form id="detalhes-form">
                    <input type="hidden" id="detalhes-turma-id">
                    <p><strong>Curso:</strong> <span id="detalhes-curso-nome"></span></p>
                    <p><strong>Código:</strong> <span id="detalhes-codigo"></span></p>
                    <p><strong>Nº de Alunos:</strong> <span id="detalhes-total-alunos"></span></p>
                    <p><strong>Sala:</strong> <span id="detalhes-sala"></span></p>
                    <p><strong>Turno:</strong> <span id="detalhes-turno"></span></p>
                    <label for="detalhes-instrutor">Instrutor:</label>
                    <input type="text" id="detalhes-instrutor" placeholder="Nome do Instrutor" list="detalhes-instrutores-list">
                    <datalist id="detalhes-instrutores-list"></datalist>
                    <label for="detalhes-status">Status:</label>
                    <select id="detalhes-status" required>
                        <option value="Planejada">Planejada</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluída">Concluída</option>
                        <option value="Cancelada">Cancelada</option>
                    </select>
                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary" id="salvar-detalhes-btn">Salvar</button>
                        <button type="button" class="btn btn-secondary" id="cancelar-turma-btn">Cancelar Turma</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="./public/js/script.js"></script>
</body>
</html>