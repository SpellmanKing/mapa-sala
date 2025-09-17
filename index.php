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
                <main class="main-grid">
                    <aside class="panel">
                        <h3>Filtros</h3>
                        <div class="filter-options">
                        <label for="filter-nome-curso">Nome do Curso</label>
                        <input type="text" id="filter-nome-curso" placeholder="Digite para buscar...">
                        <label for="filter-segmento">Segmento</label>
                        <select id="filter-segmento"><option value="">Todos</option></select>
                        <label for="filter-modalidade">Modalidade</label>
                        <select id="filter-modalidade"><option value="">Todas</option></select>
                        <label for="filter-ch-min">Carga Horária Mínima</label>
                        <input type="number" id="filter-ch-min" placeholder="ex: 40">
                        <label for="filter-ch-max">Carga Horária Máxima</label>
                        <input type="number" id="filter-ch-max" placeholder="ex: 1800">
                        <div class="checkbox-group" style="margin-top: 20px;">
                            <label><input type="checkbox" id="filter-tem"> Apenas Cursos TEM</label>
                            <label><input type="checkbox" id="filter-bolsa"> Compatível com Bolsa</label>
                        </div>
                        <div class="button-group">
                            <button type="button" id="apply-filters">Aplicar Filtros</button>
                            <button type="button" id="clear-filters" class="secondary-button">Limpar</button>
                        </div>
                        </div>
                    </aside>
                    <section class="panel-calculator">
                        <form id="course-form" class="panel-calculator" onsubmit="return false;">
                            <label for="course-select">Seleção de Curso (filtrada)</label>
                            <select id="course-select"><option value="">Use os filtros para carregar</option></select>
                            <div id="course-details" class="hidden" style="padding: 10px 0;">
                                <p style="margin: 5px 0;"><strong>Carga Horária:</strong> <span id="display-ch"></span> horas</p>
                                <p style="margin: 5px 0;"><strong>Valor:</strong> <span id="display-valor"></span></p>
                            </div>
                            <label for="start-date">Data de Início</label>
                            <input type="date" id="start-date">
                            <label for="shift-select">Turno</label>
                            <select id="shift-select">
                                <option value="manha">Manhã (4h/dia)</option>
                                <option value="tarde">Tarde (4h/dia)</option>
                                <option value="noite">Noite (3h/dia)</option>
                            </select>

                            <div id="tecnico-type-options" class="options-panel hidden">
                                <div class="checkbox-group">
                                    <label><input type="checkbox" id="is-tem-checkbox"> É um curso do Ensino Médio (TEM)?</label>
                                </div>
                            </div>
                            
                            <div id="regular-course-options" class="options-panel hidden">
                                <h4>Dias da Semana</h4>
                                <div class="checkbox-group">
                                    <label><input type="checkbox" class="weekday-check" value="1" checked> Seg</label>
                                    <label><input type="checkbox" class="weekday-check" value="2" checked> Ter</label>
                                    <label><input type="checkbox" class="weekday-check" value="3" checked> Qua</label>
                                    <label><input type="checkbox" class="weekday-check" value="4" checked> Qui</label>
                                    <label><input type="checkbox" class="weekday-check" value="5" checked> Sex</label>
                                </div>
                            </div>

                            <div id="remote-options-panel" class="options-panel hidden" style="background-color: var(--info-bg);">
                                <h4>Aulas Remotas (Opcional)</h4>
                                <label for="remote-percentage-select">Percentual de aulas remotas</label>
                                <select id="remote-percentage-select">
                                    <option value="0">Nenhum (100% Presencial)</option>
                                    <option value="5">5%</option>
                                    <option value="10">10%</option>
                                    <option value="15">15%</option>
                                    <option value="20">20%</option>
                                </select>
                                <div id="remote-details-options" class="hidden">
                                    <label for="remote-frequency-select">Frequência das aulas remotas</label>
                                    <select id="remote-frequency-select">
                                        <option value="1">1 vez por semana</option>
                                        <option value="2">2 vezes por semana</option>
                                    </select>
                                    <label for="remote-period-select">Período de ocorrência</label>
                                    <select id="remote-period-select">
                                        <option value="inicio">Início do curso</option>
                                        <option value="meio">Meio do curso</option>
                                        <option value="fim">Fim do curso</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div id="aprendizagem-options" class="options-panel hidden" style="background-color: var(--warning-bg);">
                                <h4>Opções para Aprendizagem</h4>
                                <div class="checkbox-group">
                                    <label><input type="checkbox" id="aprendizagem-exclusiva"> Curso exclusivo (aulas somente no Senac?)</label>
                                </div>
                                <div id="aprendizagem-tradicional-options" class="hidden">
                                    <label for="aprendizagem-dia-senac">Dia da aula presencial no Senac</label>
                                    <select id="aprendizagem-dia-senac">
                                        <option value="1">Segunda-feira</option><option value="2">Terça-feira</option><option value="3">Quarta-feira</option><option value="4">Quinta-feira</option><option value="5">Sexta-feira</option>
                                    </select>
                                    <div class="checkbox-group" style="margin-top: 15px;">
                                        <label><input type="checkbox" id="aprendizagem-modelo-novo"> Aplicar Modelo Novo (15 dias de imersão)?</label>
                                    </div>
                                </div>
                            </div>

                            <div id="tem-options" class="options-panel hidden" style="background-color: var(--info-bg);">
                                <h4>Opções para Cursos TEM</h4>
                                <div id="tem-manual-options">
                                    <div id="tem-800h-options" class="hidden">
                                        <label for="tem-semester-option-800h">Qual semestre terá 3 dias presenciais?</label>
                                        <select id="tem-semester-option-800h">
                                        <option value="0">Padrão (2 dias/semana)</option>
                                        <option value="1">1º Semestre</option><option value="2">2º Semestre</option><option value="3">3º Semestre</option><option value="4">4º Semestre</option>
                                        </select>
                                    </div>
                                    <div id="tem-1200h-options" class="hidden">
                                        <label for="tem-semester-option-1200h">Qual semestre terá 5 dias presenciais?</label>
                                        <select id="tem-semester-option-1200h">
                                        <option value="0">Padrão (4 dias/semana)</option>
                                        <option value="1">1º Semestre</option><option value="2">2º Semestre</option><option value="3">3º Semestre</option><option value="4">4º Semestre</option>
                                        </select>
                                    </div>
                                    <label for="tem-remote-day">Informe o dia da aula remota</label>
                                    <select id="tem-remote-day">
                                    <option value="1">Segunda-feira</option><option value="2">Terça-feira</option><option value="3">Quarta-feira</option><option value="4">Quinta-feira</option><option value="5">Sexta-feira</option>
                                    </select>
                                    <div id="tem-presencial-days-selector">
                                        <label>Selecione os dias presenciais:</label>
                                        <div class="checkbox-group">
                                            <label><input type="checkbox" class="tem-weekday-check" value="1"> Seg</label>
                                            <label><input type="checkbox" class="tem-weekday-check" value="2"> Ter</label>
                                            <label><input type="checkbox" class="tem-weekday-check" value="3"> Qua</label>
                                            <label><input type="checkbox" class="tem-weekday-check" value="4"> Qui</label>
                                            <label><input type="checkbox" class="tem-weekday-check" value="5"> Sex</label>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" id="tem-auto-button" class="secondary-button">Otimizar Grade (Automático)</button>
                            </div>
                            
                            <button type="button" id="calculate-button">Calcular Duração</button>
                        </form>
                    </section>
                    <section id="results-container" class="hidden">
                        <div class="result-box" id="results-content">
                        <h2>Resultados do Cálculo</h2>
                        <div id="metrics-panel"></div>
                        <div id="results-summary"></div>
                        <div id="calendar-visual" class="calendar-grid"></div>
                        </div>
                        <button id="export-pdf-button" class="hidden">Exportar Resultados para PDF</button>
                    </section>
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
                <input type="hidden" id="agendamento-salas-id-input">
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
                <div class="form-group">
                    <label for="agendamento-salas-display">Salas:</label>
                    <input type="text" id="agendamento-salas-display" readonly placeholder="Clique para buscar salas disponíveis">
                    <button type="button" class="secondary-btn" id="alocacao-manual-btn" style="margin-top: 10px;">Buscar Salas Automaticamente</button>
                    <div id="salasAlocadasInfo" style="margin-top: 10px;"></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="primary-btn">Agendar</button>
                    <button type="button" class="secondary-btn" onclick="fecharModais()">Cancelar</button>
                </div>
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
    <div id="alocacao-modal" class="modal">
        <div class="modal-content">
            <header class="modal-header">
                <h2>Alocação Automática - Confirmação</h2>
                <button class="close-btn">&times;</button>
            </header>
            <div id="alocacao-confirmacao-conteudo">
                <p><strong>Curso:</strong> <span id="alocacao-curso-nome"></span></p>
                <p><strong>Data de Início:</strong> <span id="alocacao-data-inicio" data-value=""></span></p>
                <p><strong>Data de Término (Estimada):</strong> <span id="alocacao-data-termino"></span></p>
                <p><strong>Salas Sugeridas:</strong> <span id="alocacao-salas-sugeridas"></span></p>
                <input type="hidden" id="alocacao-curso-id">
                <input type="hidden" id="alocacao-total-alunos">
                <input type="hidden" id="alocacao-turno">
                <input type="hidden" id="alocacao-salas-id">
                <input type="hidden" id="alocacao-dias-semana">
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