const bc = new BroadcastChannel('Jeopardizer');
const validActions = ["LOAD_GAME", "LOAD_QUESTION", "LINK_CLIENT"]

const mainDiv = document.getElementById('main')
const questionDiv = document.getElementById('question')

const currentCategory = document.getElementById("question_category")
const currentQuestion = document.getElementById("question_text")
const currentAnswer = document.getElementById("question_answer")

const backButton = document.getElementById('back_button')
const progressButton = document.getElementById('progress_button')

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
    backButton.addEventListener('click', function() {
        bc.postMessage({
            action: "CLOSE_QUESTION",
            response: {
                src: "CONSOLE",
                cid: cid,
                coid: coid
            }
        })
        setState(mainDiv)
    })

    progressButton.addEventListener('click', function() {
        bc.postMessage({
            action: "PROGRESS_ROUND",
            response: {
                src: "CONSOLE",
                cid: cid, 
                coid: coid
            }
        })
    })
}

window.addEventListener('beforeunload', (event) => {
    bc.postMessage({
        action: "CONSOLE_CLOSE",
        response: {
            src: "CONSOLE",
            cid: cid, 
            coid: coid
        }
    })
    //event.preventDefault();
    //event.returnValue = '';
})

bc.onmessage = function(msg) {
    const action = msg.data.action
    const data = msg.data.response
    if(data.src == "CLIENT") { 
        switch(action) {
            case "HEARTBEAT":            
                bc.postMessage({
                    action: "HEARTBEAT",
                    response: {
                        src: "CONSOLE",
                        cid: cid,
                        coid: coid
                    }
                })
                break
            case "LINK_CLIENT":
                console.log("Received linking message...linking console...")
                if(!cid) {
                    cid = data.cid
                    bc.postMessage({
                        action: "LINK_CONSOLE",
                        response: {
                            src: "CONSOLE",
                            cid: cid,
                            coid: coid
                        }
                    })
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
                    setState(questionDiv)
                    bc.postMessage({
                        action: "OPEN_QUESTION",
                        response: {
                            src: "CONSOLE",
                            cid: cid,
                            coid: coid
                        }
                    })
                }
                break
            default:
                console.log("Invalid action at console: ", msg)
                break
        }
    }
}