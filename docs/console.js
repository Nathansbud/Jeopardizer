const bc = new BroadcastChannel('Jeopardizer');
const validActions = ["LOAD_GAME", "LOAD_QUESTION", "LINK_CLIENT"]

const mainDiv = document.getElementById('main')
const questionDiv = document.getElementById('question')

const playerList = document.getElementById('player_list')

const currentCategory = document.getElementById("question_category")
const currentQuestion = document.getElementById("question_text")
const currentValue = document.getElementById("question_text")
const currentAnswer = document.getElementById("question_answer")

const scoreInput = document.getElementById("score_input")
const questionValue = 0

const dailyDoubleText = document.getElementById('daily_double')
const wagerControls = document.getElementById('wager_controls')

const wagerButton = document.getElementById('wager_button')
const questionButton = document.getElementById('question_button')
const backButton = document.getElementById('back_button')
const progressButton = document.getElementById('progress_button')
const scoresButton = document.getElementById('scores_button')



const divs = [mainDiv, questionDiv]

let cid = null
let coid = Date.now()

let players = {}

function setState(div) {
    divs.forEach(d => {
        if(d != div) d.style.display = 'none';
        else d.style.display = 'block';
    })
}

window.onload = function() {
    backButton.addEventListener('click', () => {
        sendMessage("CLOSE_QUESTION")
        setState(mainDiv)
    })

    progressButton.addEventListener('click', () => sendMessage("PROGRESS_ROUND"))
    wagerButton.addEventListener('click', () => sendMesssage('SHOW_QUESTION'))
    scoresButton.addEventListener('click', () => {
        if(scoresButton.textContent == "Show Scores") {
            sendMessage("SHOW_SCORES")
            scoresButton.textContent = "Show Board"
        } else {
            sendMessage("SHOW_BOARD")
            scoresButton.textContent = "Show Scores"
        }
    })
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
                    setState(mainDiv)
                    players = data.players   
                    updatePlayerList()
                }
                break
            case "GET_PLAYERS":
                if(cid == data.cid) players = data.players
                break
            case "LOAD_QUESTION":
                if(data.cid == cid) {
                    currentQuestion.textContent = data.question
                    currentCategory.textContent = data.category
                    currentAnswer.textContent = data.answer
                    if(data.dd) {
                        dailyDoubleText.style.display = 'block'
                        showWager(true)
                    } else {
                        dailyDoubleText.style.display = 'none'
                        showWager(false)
                    }
                    setState(questionDiv)
                    sendMessage("OPEN_QUESTION", params=[["dd", data.dd]])
                }
                break
            case "NEW_GAME":
                break
            default:
                console.log("Invalid action at console: ", msg)
                break
        }
    }
}

function updatePlayerList() {
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
                0:"-",
                1:"+",
                2:"+ (Input)"
            })[idx] || ""
            
            scoreButton.setAttribute('data-player', pe[0])
            let scoreCallback = ({
                0:function() {
                    players[scoreButton.getAttribute('data-player')] += questionValue
                },
                1:function() {
                    players[scoreButton.getAttribute('data-player')] -= questionValue
                },
                2:function() {
                    if(scoreInput.value) players[scoreButton.getAttribute('data-player')] += parseInt(scoreInput.value)
                }
            })[idx] || ""

            scoreButton.addEventListener('click', function() {
                scoreCallback()
                sendMessage("UPDATE_PLAYERS", [['players', players]])
            })
            return scoreButton
        })
        
        pl.appendChild(playerSpan)
        pl.appendChild(subtractButton)
        pl.appendChild(addButton)
        pl.appendChild(addFromInputButton)
        playerList.appendChild(pl)
    })
}

function showWager(shouldShow) {
    if(shouldShow) {
        wagerControls.style.display = 'block'
    } else {
        wagerControls.style.display = 'none'
    }
}