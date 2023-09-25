const bc = new BroadcastChannel2('Jeopardizer')

const mainDiv = document.getElementById('main')
const questionDiv = document.getElementById('question')
const pauseDiv = document.getElementById('pause')

const playerList = document.getElementById('player_list')
const boardDisplay = document.getElementById('board_display')

const currentCategory = document.getElementById("question_category")
const currentQuestion = document.getElementById("question_text")
const currentValue = document.getElementById("question_value")
const currentAnswer = document.getElementById("question_answer")
let questionValue = 0
const scoreInput = document.getElementById("score_input")

const addPlayer = document.getElementById("add_player")
const removePlayer = document.getElementById("remove_player")
const playerDropdown = document.getElementById("players")

const dailyDoubleText = document.getElementById('daily_double')
const wagerControls = document.getElementById('wager_controls')
const wagerButton = document.getElementById('wager_button')
const wagerInput = document.getElementById('wager_input')
const questionButton = document.getElementById('question_button')

const backButton = document.getElementById('back_button')
const progressButton = document.getElementById('progress_button')
const regressButton = document.getElementById('regress_button')
const roundDropdown = document.getElementById('round_dropdown')
const roundButton = document.getElementById('select_round')

const scoresButton = document.getElementById('scores_button')
const resetButton = document.getElementById('reset_button')
const buzzerButton = document.getElementById('buzzer_button')

const sfxDropdown = document.getElementById('sfx_dropdown')

const playSFX = document.getElementById('play_sfx')
const pauseSFX = document.getElementById('pause_sfx')

const playMedia = document.getElementById('play_media')
const pauseMedia = document.getElementById('pause_media')

const timerControls = document.getElementById('timer')
const timerText = document.getElementById('round_timer')
const timerButton = document.getElementById('timer_button')
let timerCallback;

const divs = [mainDiv, questionDiv, pauseDiv]
const states = ["Main", "Question"]

let board = null
let settings = {}

let cid = null
let coid = Date.now()

let players = {}
let timeLimit = null
let currentTime = null

function setState(div) {
    divs.forEach(d => {
        if(d != div) d.style.display = 'none'
        else d.style.display = 'block'
    })
}

function getState() {
    for(let i = 0; i < divs.length; i++) {
        if(divs[i].style.display != 'none') return states[i]
    }
}

const isQuestion = () => getState() == "Question"
const isMain = () => getState() == "Main"

function closeQuestion() {
    Array.from(document.querySelectorAll('[data-manual]')).forEach(sb => {
        switch(sb.dataset.manual) {
            case 'true':
                sb.style.display = 'inline';
                break;
            case 'support':
                // could change this, but the idea is just hidden non-inline elements for spacing
                sb.style.display = 'block';
                break;
            case 'false':
                sb.style.display = 'none';
                break;
        }
    })
    sendMessage("CLOSE_QUESTION")
    boardDisplay.style.display = 'block'
    setState(mainDiv)
}


window.onload = function() {
    backButton.addEventListener('click', closeQuestion)
    progressButton.addEventListener('click', () => {
        sendMessage("PROGRESS_ROUND")
        sendMessage("SHOW_BOARD")
        scoresButton.textContent = "Show Scores"
        
        currentTime = timeLimit
        timerText.textContent = getTimeText(timeLimit)
        clearInterval(timerCallback)            
        timerButton.textContent = 'Start Timer'
    })

    regressButton.addEventListener('click', () => {
        sendMessage("REGRESS_ROUND")
        sendMessage("SHOW_BOARD")
        scoresButton.textContent = "Show Scores"

        currentTime = timeLimit
        timerText.textContent = getTimeText(timeLimit)
        clearInterval(timerCallback)            
        timerButton.textContent = 'Start Timer'
    })

    roundButton.addEventListener('click', () => {
        sendMessage("SET_ROUND", [['roundKey', roundDropdown.options[roundDropdown.selectedIndex].value]])        
        sendMessage("SHOW_BOARD")
        scoresButton.textContent = "Show Scores"

        currentTime = timeLimit
        timerText.textContent = getTimeText(timeLimit)
        clearInterval(timerCallback)            
        timerButton.textContent = 'Start Timer'
    })
    
    questionButton.addEventListener('click', () => sendMessage('SHOW_QUESTION'))
    wagerButton.addEventListener('click', () => {
        questionValue = parseInt(wagerInput.value || 0)
        currentValue.textContent = `$${questionValue}`
        sendMessage("SET_VALUE", [['value', questionValue]])
        sendMessage('SHOW_QUESTION')
    })
    
    scoresButton.addEventListener('click', () => {
        if(scoresButton.textContent == "Show Scores") {
            if(Object.entries(players).length > 0) {
                sendMessage("SHOW_SCORES")
                scoresButton.textContent = "Show Board"
            }
        } else {
            sendMessage("SHOW_BOARD")
            scoresButton.textContent = "Show Scores"
        }
    })

    resetButton.addEventListener('click', restart)
    
    playSFX.addEventListener('click', () => sendMessage("PLAY_SFX", [['sfx', sfxDropdown.options[sfxDropdown.selectedIndex].value]]))
    pauseSFX.addEventListener('click', () => sendMessage("PAUSE_SFX"))

    playMedia.addEventListener('click', () => sendMessage("PLAY_MEDIA"))
    pauseMedia.addEventListener('click', () => sendMessage("PAUSE_MEDIA"))

    timerButton.addEventListener('click', () => {
        if(timerButton.textContent == 'Start Timer') {
            timerButton.textContent = 'Pause Timer'
            timerCallback = setInterval(countdown, 1000)
        } else {
            clearInterval(timerCallback)            
            timerButton.textContent = 'Start Timer'
        }
    })

    addPlayer.addEventListener('click', () => {
        const name = prompt("Player Name: ");
        if(name && !(name in players)) {
            if(Object.entries(players).length === 0) {
                removePlayer.disabled = false;
            }

            const newOption = document.createElement('option');
            newOption.text = name;
            newOption.value = name;
            playerDropdown.add(newOption);

            players[name] = 0;

            sendMessage("UPDATE_PLAYERS", [['players', players]])
            updatePlayerList(restart=true)
        } 
    })

    removePlayer.addEventListener('click', () => {
        const playerToRemove = playerDropdown.options[playerDropdown.selectedIndex].value
        delete players[playerToRemove]
        playerDropdown.remove(playerDropdown.selectedIndex);
        
        sendMessage("UPDATE_PLAYERS", [['players', players]])
        updatePlayerList(restart=true)

        if(Object.entries(players).length === 0) {
            removePlayer.disabled = true;
        } 
    })
}

function countdown() {
    if(currentTime > 0) {
        if(currentTime == 1) sendMessage("PLAY_SFX", [['sfx', "Round Over"]])
        currentTime -= 1
    } 
    timerText.textContent = getTimeText(currentTime)
}

function clearChildren(node) {
    while(node.lastChild) {
        node.removeChild(node.lastChild)
    }
}

function restart() {
    for(let node of [boardDisplay, playerList, roundDropdown, playerDropdown]) {
        clearChildren(node);
    }

    scoresButton.textContent = 'Show Scores'
    mainDiv.style.display = 'none'
    document.querySelector('nav').style.display = 'none'
    setState(pauseDiv)
    sendMessage("RESTART")
}

function getTimeText(secs) {
    return new Date(secs*1000).toISOString().slice((secs < 3600) ? 14 : 11, 19)
}

function sendMessage(action, params=[]) {
    let messageResponse = {
        src: "CONSOLE",
        cid: cid,
        coid: coid
    }
    params.forEach(p => messageResponse[p[0]] = p[1])
    bc.postMessage({
        action: action,
        response: messageResponse
    })
}

window.addEventListener('beforeunload', (event) => {
    sendMessage("CONSOLE_CLOSE")
})

buzzerButton.addEventListener('click', () => {
    const ok = confirm("Are you sure? Launching buzzers will require all players to join a new buzz.in game!")
    if(ok) {
        sendMessage("OPEN_BUZZERS")
    }
})

bc.onmessage = function(msg) {
    const action = msg.action
    const data = msg.response
    if(data?.src == "CLIENT") { 
        switch(action) {
            case "LINK_CLIENT":
                console.log("Received linking message...linking console...")
                if(!cid) {
                    cid = data.cid
                    sendMessage("LINK_CONSOLE")
                }
                break
            case "START_GAME":
                if(cid == data.cid) {
                    players = data.players  
                    board = data.board
                    timeLimit = data.limit
                    settings = data.settings
                    
                    if(timeLimit) {
                        timerControls.style.display = 'block'
                        currentTime = timeLimit
                        timerText.textContent = getTimeText(currentTime)
                    }
                    
                    updatePlayerList(restart=true)
                    updateBoard()
                    data.seen.forEach(v => {
                        const matchedCell = document.querySelector(`[data-cell='${v}']`)
                        if(matchedCell) matchedCell.classList.add('seen')
                    })
                    
                    const playerNames = Object.keys(players)
                    
                    if(playerNames.length === 0) removePlayer.disabled = true;
                    playerNames.forEach(p => {
                        const opt = document.createElement("option") 
                        opt.text = p
                        opt.value = p
                        playerDropdown.add(opt)
                    })
 
                    board.forEach(b => {
                        const key = Object.keys(b)[0]
                        const opt = document.createElement("option") 
                        opt.text = key
                        opt.value = key
                        roundDropdown.add(opt)
                    })

                    setState(mainDiv)
                    mainDiv.style.display = 'block'

                    document.querySelector('nav').style.display = 'block'
                    document.getElementById("board_display").style.display = 'block'

                    const activeRound = document.querySelector(`#${data.roundKey}`)
                    roundDropdown.value = data.roundKey

                    if(activeRound) activeRound.style.display = 'block'
                }
                break
            case "GET_PLAYERS":
                if(cid == data.cid) players = data.players
                break
            case "LOAD_QUESTION":
                if(data.cid == cid) {
                    currentAnswer.textContent = data.answer
                    currentQuestion.textContent = data.question
                    currentCategory.textContent = data.category
                    currentValue.textContent = data.label + (data.label === `$${data.value}` ? '' : ` (${data.value})`)

                    questionValue = parseInt(data.value)

                    const relevantQuestion = document.querySelector(`[data-cell='${data.cell}']`)
                    if(relevantQuestion) relevantQuestion.classList.add("seen")
                        
                    if(data.dd.includes('true') && settings.ddEnabled) {
                        dailyDoubleText.textContent = "DAILY DOUBLE";
                        dailyDoubleText.style.display = 'block'
                        showWager(true)
                    } else if(data.final === 'true') {
                        dailyDoubleText.textContent = "FINAL JEOPARDY";
                        dailyDoubleText.style.display = 'block'
                        showWager(true)
                    } else {
                        dailyDoubleText.style.display = 'none'
                        showWager(false)
                    }

                    Array.from(document.querySelectorAll("button[data-manual]")).forEach(sb => {
                        sb.style.display = "inline"
                    })
                    setState(questionDiv)
                    boardDisplay.style.display = 'none'
                    const isTrue = v => ['true', true].includes(v)
                    
                    sendMessage("OPEN_QUESTION", params=[["dd", isTrue(data.dd) && settings.ddEnabled], ["final", data.final]])
                }
                break
            case "SET_ROUND":
                if(cid == data.cid) {
                    Array.from(document.querySelectorAll(".round_container")).forEach(t => t.style.display = 'none')
                    
                    roundDropdown.value = data.roundKey
                    const relevantRound = document.querySelector(`#${data.roundKey}`)
                    if(relevantRound) relevantRound.style.display = 'block'
                }
                break
            case "NEW_GAME":
                break
            case "CLIENT_CLOSE":
                if(cid == data.cid) {
                    window.close()
                    if(buzzerWindow) buzzerWindow.close()
                }
                break
            case "REQUEST_SCORES":
                if(cid == data.cid) {
                    if(Object.entries(players).length > 0) {
                        sendMessage("SHOW_SCORES")
                        scoresButton.textContent = "Show Board"
                    }
                }
                break;
            default:
                console.log("Invalid action at console: ", msg)
                break
        }
    }
}

function updateBoard() {
    clearChildren(boardDisplay)
    
    board.forEach(b => {
        const roundKey = Object.keys(b)[0]
        const roundData = Object.values(b)[0]

        const roundDiv = document.createElement("div")
        roundDiv.id = roundKey
        roundDiv.classList.add("round_container")

        const roundTable = document.createElement("table")

        roundTable.classList.add("game_table", "console")
        if(settings.ddEnabled) {
            roundTable.classList.add("dd_enabled")
        }
        
        const commentList = document.createElement("ul")
        commentList.classList.add("comments")

        const headerRow = document.createElement("tr")
        roundData[0].forEach(cat => {
            const { category, comment } = cat
            const headerCell = document.createElement("th")
            headerCell.textContent = category

            if(comment) {
                const commentItem = document.createElement("li")
                commentItem.textContent = `${category}: ${comment.replaceAll("\n", " ")}`
                commentList.appendChild(commentItem)
            }

            headerRow.appendChild(headerCell)
        })

        roundTable.appendChild(headerRow)
        roundData.slice(1).forEach(row => {
            const newRow = document.createElement("tr")
            row.forEach(cell => {
                const newCell = document.createElement('td')
                newCell.classList.add("question_cell", "console")

                if(!cell.question) newCell.setAttribute("disabled", true)
                else {
                    Object.entries(cell).forEach(([k, v]) => {
                        if(!k.startsWith("client")) newCell.dataset[k] = v
                    })   
                    
                    newCell.textContent = cell.label
                    if(cell.disabled) newCell.classList.add("seen")
                }

                newCell.addEventListener('click', ({target}) => {
                    if(!target.disabled) {
                        sendMessage("CELL_CLICKED", [['cell', target.dataset.cell]])
                        target.classList.add("seen")
                    }
                })
                newRow.appendChild(newCell)
            })
            roundTable.appendChild(newRow)
        })

        roundDiv.append(roundTable, commentList)
        document.getElementById("board_display").appendChild(roundDiv)
    })
}

function updatePlayerList(restart=false) {
    if(restart) {
        clearChildren(playerList)

        Object.entries(players).forEach(pe => {
            let pl = document.createElement('li')
            
            let playerSpan = document.createElement('span')
            playerSpan.textContent = `${pe[0]}: ${pe[1]}`

            let [subtractButton, addButton, addFromInputButton] = new Array(3).fill().map((_, idx) => {
                let scoreButton = document.createElement('button')
                scoreButton.textContent = ({
                    0:"- (Question)",
                    1:"+ (Question)",
                    2:"+ (Input)"
                })[idx] || ""
                
                scoreButton.setAttribute('data-player', pe[0])
                scoreButton.setAttribute('data-manual', idx == 2)

                let scoreCallback = ({
                    0: () => {
                        if(isQuestion()) players[scoreButton.getAttribute('data-player')] -= questionValue
                    },
                    1: () => {
                        if(isQuestion()) {
                            players[scoreButton.getAttribute('data-player')] += questionValue
                            closeQuestion()
                        }
                    },
                    2: () => {
                        if(scoreInput.value) players[scoreButton.getAttribute('data-player')] += parseInt(scoreInput.value)
                    }
                })[idx] || ""

                scoreButton.addEventListener('click', function() {
                    scoreCallback()
                    sendMessage("UPDATE_PLAYERS", [['players', players]])
                    updatePlayerList()
                })
                return scoreButton
            })
            
            pl.appendChild(addFromInputButton)
            pl.appendChild(addButton)
            pl.appendChild(subtractButton)
            pl.appendChild(playerSpan)
            playerList.appendChild(pl)
        })
    } else {
        const ps = Object.entries(players)
        Array.from(playerList.getElementsByTagName('span')).forEach((s, idx) => {
            s.textContent = `${ps[idx][0]}: ${ps[idx][1]}`
        })
    }
}

function showWager(shouldShow) {
    if(shouldShow) {
        wagerControls.style.display = 'block'
    } else {
        wagerControls.style.display = 'none'
    }
}
