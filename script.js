document.addEventListener("DOMContentLoaded", function() {
    // ============ SISTEMA DE MENU ============
    const menuIcon = document.getElementById("menuIcon");
    const menu = document.getElementById("menu");

    menuIcon.addEventListener("click", function(e) {
        e.stopPropagation();
        menu.classList.toggle("active");
        menuIcon.classList.toggle("active");
    });

    document.addEventListener("click", function(e) {
        if (!menu.contains(e.target) && !menuIcon.contains(e.target)) {
            menu.classList.remove("active");
            menuIcon.classList.remove("active");
        }
    });

    document.querySelectorAll(".menu-item").forEach(item => {
        item.addEventListener("mouseenter", function() {
            this.style.transform = "translateY(-3px)";
        });
        item.addEventListener("mouseleave", function() {
            this.style.transform = "translateY(0)";
        });
    });

    // ============ SISTEMA DO JOGO ============
    const gameState = {
        sanity: 100,
        inventory: new Map(),
        currentScenario: 'louvre',
        previousScenarios: []
    };

    const scenarios = {
        louvre: {
            text: "Jacques Saunière está morto no Louvre...",
            image: "louvre_scene.jpg",
            choices: [
                { 
                    text: "Decifrar sequência Fibonacci", 
                    next: "bank_vault",
                    effect: () => gameState.sanity -= 15
                },
                { 
                    text: "Investigar símbolo do Priorado", 
                    puzzle: {
                        type: "symbol_decipher",
                        question: "Qual símbolo corresponde ao Priorado de Sião?",
                        solution: "rosa",
                        reward: "chave_priorado",
                        next: "bank_vault" // Novo campo adicionado
                    }
                }
            ],
            item: { id: "diario_sauniere", type: "document" }
        },

        bank_vault: {
            text: "No cofre do banco, um criptex aguarda...",
            image: "bank_vault.jpg",
            choices: [
                {
                    text: "Inserir 'Sofia' no criptex",
                    next: "teabing_manor",
                    requiredItem: "chave_priorado",
                    effect: () => gameState.inventory.set("criptex", { type: "artifact" })
                },
                {
                    text: "Resolver enigma da rosa",
                    puzzle: {
                        type: "anagrama",
                        question: "Rearranje as letras: V I N C I C O D E",
                        solution: "da-vinci-code",
                        reward: "rosa_cristal",
                        next: "teabing_manor" // Novo campo adicionado
                    }
                }
            ]
        },

        teabing_manor: {
            text: "Na mansão de Leigh Teabing, segredos ancestrais surgem. 'O Graal não é um cálice, mas um túmulo!'",
            image: "teabing_manor.jpg",
            choices: [
                {
                    text: "Confrontar Teabing",
                    next: "westminster",
                    effect: () => gameState.sanity -= 25
                },
                {
                    text: "Decifrar pista de Newton",
                    puzzle: {
                        type: "coordenadas",
                        question: "Coordenadas no túmulo de Newton (51.4995, -0.1273):",
                        solution: "westminster",
                        reward: "mapa_abadia",
                        next: "westminster" // Novo campo adicionado
                    }
                }
            ],
            item: { id: "diario_teabing", type: "document" } // Novo item adicionado
        },
        
        westminster: {
            text: "Na Abadia de Westminster, Silas emerge das sombras. Teabing revela-se traidor!",
            image: "westminster_abbey.jpg",
            choices: [
                {
                    text: "Usar criptex como distração",
                    next: "rosslyn_chapel",
                    requiredItem: "criptex",
                    effect: () => gameState.sanity += 20
                },
                {
                    text: "Decifrar última pista",
                    puzzle: {
                        type: "linha_rosa",
                        question: "Onde a linha rosa cruza a pirâmide invertida?",
                        solution: "louvre",
                        reward: "chave_graal",
                        next: "rosslyn_chapel" // Novo campo adicionado
                    }
                }
            ]
        },
        
        rosslyn_chapel: {
            text: "Na Capela Rosslyn, você descobre a linhagem sagrada. Marie Chauvel revela a verdade sobre Sophie...",
            image: "rosslyn_chapel.jpg",
            choices: [{
                text: "▶ Revelar o Graal",
                next: "true_ending",
                effect: () => gameState.inventory.clear()
            }],
            item: { id: "registro_linhagem", type: "document" } // Novo item adicionado
        },
        
        true_ending: {
            text: "Você encontrou o túmulo de Maria Madalena sob o Louvre. O Priorado de Sião está salvo!",
            image: "graal_final.jpg",
            choices: [{
                text: "▶ Jogar novamente",
                next: "louvre",
                effect: () => location.reload()
            }]
        },
        
        game_over: {
            text: "Sua sanidade chegou a zero! O Priorado de Sião foi destruído...",
            image: "graal_final.jpg",
            choices: [{
                text: "▶ Tentar novamente",
                next: "louvre",
                effect: () => location.reload()
            }]
        }        
}


// ============ SISTEMA DE PUZZLES (GLOBAL) ============
    window.puzzleSystem = {
        activePuzzle: null,
        startPuzzle(puzzleData) {
            this.activePuzzle = puzzleData;
            const puzzleHTML = `
                <div class="puzzle-box">
                    <p>${puzzleData.question}</p>
                    <input type="text" id="puzzle-input" onkeypress="if(event.key === 'Enter') window.submitPuzzle()">
                    <button onclick="window.submitPuzzle()">Submeter</button>
                </div>`;
            document.getElementById('puzzle-container').innerHTML = puzzleHTML;
        },
        checkSolution(answer) {
            const cleanAnswer = answer.toLowerCase().replace(/[\s-]/g, '');
            return cleanAnswer === this.activePuzzle.solution.replace(/[\s-]/g, '');
        }
    };

    // ============ FUNÇÕES GLOBAIS ============
    window.submitPuzzle = () => {
        const answer = document.getElementById('puzzle-input').value;
        if (window.puzzleSystem.checkSolution(answer)) {
            gameState.inventory.set(window.puzzleSystem.activePuzzle.reward, { type: "key" });
            document.getElementById('puzzle-container').innerHTML = "";
            
            // Nova lógica: Avança para o próximo cenário definido no puzzle
            if (window.puzzleSystem.activePuzzle.next) {
                loadScenario(window.puzzleSystem.activePuzzle.next);
            } else {
                // Recarrega o cenário atual para atualizar as escolhas
                loadScenario(gameState.currentScenario); 
            }
            
        } else {
            document.body.style.filter = 'grayscale(100%)';
            setTimeout(() => document.body.style.filter = '', 1000);
        }
    };

    window.handleChoice = (nextScenario) => {
        const choice = scenarios[gameState.currentScenario].choices.find(c => c.next === nextScenario);
        if (choice?.effect) choice.effect();
        loadScenario(nextScenario);
    };

    // ============ FUNÇÕES AUXILIARES ============
    function loadScenario(scenarioId) {
        const scenario = scenarios[scenarioId];
        gameState.currentScenario = scenarioId;
        
        document.getElementById('game-text').textContent = scenario.text;
        document.getElementById('scene').style.backgroundImage = `url('${scenario.image}')`;

        const choicesContainer = document.getElementById('choices-container');
        choicesContainer.innerHTML = scenario.choices
            .filter(choice => !choice.requiredItem || gameState.inventory.has(choice.requiredItem))
            .map(choice => {
                if (choice.puzzle) {
                    // Corrigido: Escape correto das aspas
                    return `<button class="button-style" onclick="window.puzzleSystem.startPuzzle(${JSON.stringify(choice.puzzle).replace(/"/g, '&quot;')})">${choice.text}</button>`;
                } else {
                    return `<button class="button-style" onclick="window.handleChoice('${choice.next}')">${choice.text}</button>`;
                }
            }).join('');

        if (scenario.item) {
            gameState.inventory.set(scenario.item.id, scenario.item);
        }

        updateSanityDisplay();
    }

    function updateSanityDisplay() {
        const sanityBar = document.getElementById('sanityBar');
        sanityBar.style.width = `${gameState.sanity}%`;
        document.body.classList.toggle('low-sanity', gameState.sanity < 30);
        
        // Correção: Carregar game_over ao invés de true_ending
        if (gameState.sanity <= 0) {
            loadScenario('game_over');
        }
    }

    // ============ INICIALIZAÇÃO ============
    loadScenario('louvre');
    setInterval(() => {
        gameState.sanity = Math.max(0, gameState.sanity - 0.3);
        updateSanityDisplay();
    }, 10000);
});