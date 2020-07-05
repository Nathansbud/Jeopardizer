const bc = new BroadcastChannel('Jeopardizer');
const validActions = ["LOAD_GAME", "LOAD_QUESTION", "LINK_CLIENT"]

const mainDiv = document.getElementById('main')
const questionDiv = document.getElementById('question')

const currentCategory = document.getElementById("question_category")
const currentQuestion = document.getElementById("question_text")
const currentAnswer = document.getElementById("question_answer")

const backButton = document.getElementById('back_button')
const progressButton = document.getElementById('progress_button')

const dailyDoubleText = document.getElementById('daily_double')
const wagerControls = document.getElementById('wager_controls')

const wagerButton = document.getElementById('wager_button')
const questionButton = document.getElementById('question_button')

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

function showWager(shouldShow) {
    if(shouldShow) {
        wagerControls.style.display = 'block'
    } else {
        wagerControls.style.display = 'none'
    }
}