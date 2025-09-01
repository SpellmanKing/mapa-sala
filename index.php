<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SGST - Painel de Gestão de Salas</title>
    <link rel="stylesheet" href="./public/css/style.css">
</head>
<body>
    <header class="page-header">
        <h1>Painel de Gestão de Salas e Turmas</h1>
        <div class="header-actions">
            <button id="add-turma-btn" class="btn btn-primary">+ Agendar Nova Turma</button>
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
                <option value="todas">Todos os Tipos de Sala</option>
            </select>
        </div>
    </nav>
    <div class="schedule-container">
        <div class="schedule-grid"></div>
    </div>
    </main>

<div id="agendamento-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Agendar Nova Turma</h2>
                <span class="close-btn">&times;</span>
            </div>
            <div class="modal-body">
                <p id="agendamento-info" style="font-weight: bold; color: #005a9c;"></p>
                
                <form id="agendamento-form">
                    <input type="hidden" id="agendamento-sala-id">

                    <label for="curso-select">Curso:</label>
                    <select id="curso-select" required></select>

                    <label for="data-inicio">Data de Início:</label>
                    <input type="date" id="data-inicio" required>

                    <label for="total-alunos">Nº de Alunos:</label>
                    <input type="number" id="total-alunos" required>

                    <label for="turno-select-agendamento">Turno:</label>
                    <select id="turno-select-agendamento" required>
                        <option value="manha">Manhã</option>
                        <option value="tarde">Tarde</option>
                        <option value="noite">Noite</option>
                        <option value="integral">Integral</option>
                    </select>
                    
                    <label for="instrutor-select">Instrutor:</label>
                    <input type="text" id="instrutor-select" list="instrutores-list" placeholder="Digite ou selecione um instrutor">
                    <datalist id="instrutores-list"></datalist>

                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">Agendar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div id="detalhes-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="detalhes-curso-nome"></h2>
                <span class="close-btn">&times;</span>
            </div>
            <div class="modal-body">
                <form id="detalhes-form">
                    <input type="hidden" id="detalhes-turma-id">
                    <p><strong>Código da Turma:</strong> <span id="detalhes-codigo"></span></p>
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