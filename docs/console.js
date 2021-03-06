const bc = new BroadcastChannel('Jeopardizer')
const validActions = ["LOAD_GAME", "LOAD_QUESTION", "LINK_CLIENT"]

const mainDiv = document.getElementById('main')
const questionDiv = document.getElementById('question')
const pauseDiv = document.getElementById('pause')

const playerList = document.getElementById('player_list')
const notesList = document.getElementById('notes')

const currentCategory = document.getElementById("question_category")
const currentQuestion = document.getElementById("question_text")
const currentValue = document.getElementById("question_value")
const currentAnswer = document.getElementById("question_answer")
let questionValue = 0
const scoreInput = document.getElementById("score_input")

const dailyDoubleText = document.getElementById('daily_double')
const wagerControls = document.getElementById('wager_controls')
const wagerButton = document.getElementById('wager_button')
const wagerInput = document.getElementById('wager_input')
const questionButton = document.getElementById('question_button')

const backButton = document.getElementById('back_button')
const progressButton = document.getElementById('progress_button')
const regressButton = document.getElementById('regress_button')
const scoresButton = document.getElementById('scores_button')
const resetButton = document.getElementById('reset_button')

const sfxDropdown = document.getElementById('sfx_dropdown')
const playButton = document.getElementById('play_sfx')
const pauseButton = document.getElementById('pause_sfx')

const timerControls = document.getElementById('timer')
const timerText = document.getElementById('round_timer')
const timerButton = document.getElementById('timer_button')
let timerCallback;

const divs = [mainDiv, questionDiv, pauseDiv]
const states = ["Main", "Question"]

let notes = null

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
    Array.from(document.querySelectorAll('button[data-manual]')).forEach(sb => {
        sb.style.display = sb.getAttribute('data-manual') == 'true' ? ('inline') : ('none')
    })
    sendMessage("CLOSE_QUESTION")
    notesList.style.display = 'block'
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
            sendMessage("SHOW_SCORES")
            scoresButton.textContent = "Show Board"
        } else {
            sendMessage("SHOW_BOARD")
            scoresButton.textContent = "Show Scores"
        }
    })

    resetButton.addEventListener('click', restart)
    playButton.addEventListener('click', () => sendMessage("PLAY_SFX", [['sfx', sfxDropdown.options[sfxDropdown.selectedIndex].value]]))
    pauseButton.addEventListener('click', () => sendMessage("PAUSE_SFX"))
    timerButton.addEventListener('click', () => {
        if(timerButton.textContent == 'Start Timer') {
            timerButton.textContent = 'Pause Timer'
            timerCallback = setInterval(countdown, 1000)
        } else {
            clearInterval(timerCallback)            
            timerButton.textContent = 'Start Timer'
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

function restart() {
    while(notesList.lastChild) {
        notesList.removeChild(notesList.lastChild)
    }
    while(playerList.lastChild) {
        playerList.removeChild(playerList.lastChild)
    }
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

bc.onmessage = function(msg) {
    const action = msg.data.action
    const data = msg.data.response
    if(data.src == "CLIENT") { 
        switch(action) {
            case "HEARTBEAT":            
                sendMessage("HEARTBEAT")
                break
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
                    notes = data.notes 
                    timeLimit = data.limit
                    if(timeLimit) {
                        timerControls.style.display = 'block'
                        currentTime = timeLimit
                        timerText.textContent = getTimeText(currentTime)
                    }

                    updatePlayerList(restart=true)
                    updateNotes()
                    setState(mainDiv)
                    mainDiv.style.display = 'block'
                    document.querySelector('nav').style.display = 'block'
                }
                break
            case "GET_PLAYERS":
                if(cid == data.cid) players = data.players
                break
            case "LOAD_QUESTION":
                if(data.cid == cid) {
                    currentAnswer.textContent = data.answer
                    currentQuestion.textContent = data.question
                    console.log(data.question)
                    currentCategory.textContent = data.category
                    currentValue.textContent = "$"+data.value
                    questionValue = parseInt(data.value)

                    if(data.dd || data.final) {
                        dailyDoubleText.textContent = (data.dd) ? ("DAILY DOUBLE") : ("FINAL JEOPARDY")
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
                    notesList.style.display = 'none'
                    sendMessage("OPEN_QUESTION", params=[["dd", data.dd], ["final", data.final]])
                }
                break
            case "NEW_GAME":
                break
            case "CLIENT_CLOSE":
                window.close()
                break
            default:
                console.log("Invalid action at console: ", msg)
                break
        }
    }
}

function updateNotes() {
    while(notesList.lastChild) {
        notesList.removeChild(notesList.lastChild)
    }

    Object.entries(notes).forEach(r => {
        const roundName = r[0].split("_").map(p => p[0].toUpperCase() + p.slice(1)).join(" ")
        const roundData = r[1]

        const hasComments = Object.entries(roundData.comments).length > 0
        const hasDailyDoubles = roundData.dd.length > 0
        
        if(hasComments || hasDailyDoubles) {
            const rList = document.createElement('li')
            rList.textContent = roundName

            if(hasComments) {
                const comList = document.createElement('ul')
                comList.textContent = "[Comments]"
                Object.entries(roundData.comments).forEach(([cat, com]) => {
                    const comElem = document.createElement('li')
                    comElem.textContent = `${cat}: ${com}`
                    comList.appendChild(comElem)
                })
                rList.appendChild(comList)
            }  
            if(hasDailyDoubles) {
                const doubleList = document.createElement('ul')
                doubleList.textContent = "[Daily Doubles]"
                roundData.dd.forEach(d => {
                    const doubleElem = document.createElement('li')
                    doubleElem.textContent = d
                    doubleList.appendChild(doubleElem)
                })
                rList.appendChild(doubleList)
            }
            notesList.appendChild(rList)
        }
    })
}

function updatePlayerList(restart=false) {
    if(restart) {
        while(playerList.lastChild) {
            playerList.removeChild(playerList.lastChild)
        }

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
                    0:function() {
                        if(isQuestion()) players[scoreButton.getAttribute('data-player')] -= questionValue
                    },
                    1:function() {
                        if(isQuestion()) {
                            players[scoreButton.getAttribute('data-player')] += questionValue
                            closeQuestion()
                        }
                    },
                    2:function() {
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
            
            pl.appendChild(playerSpan)
            pl.appendChild(subtractButton)
            pl.appendChild(addButton)
            pl.appendChild(addFromInputButton)
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