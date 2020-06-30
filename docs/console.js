const bc = new BroadcastChannel('Jeopardizer');
const validActions = ["LOAD_GAME", "LOAD_QUESTION"]

const mainDiv = document.getElementById('main')
const questionDiv = document.getElementById('question')

const currentCategory = document.getElementById("question_category")
const currentQuestion = document.getElementById("question_text")
const currentAnswer = document.getElementById("question_answer")

const backButton = document.getElementById('back_button')

const divs = [mainDiv, questionDiv]
let players = {}

function setState(div) {
    divs.forEach(d => {
        if(d != div) d.style.display = 'none';
        else d.style.display = 'block';
    })
}


window.onload = function() {
    backButton.addEventListener('click', function() {
        bc.postMessage({action: "CLOSE_QUESTION"})
        setState(mainDiv)
    })
}

bc.onmessage = function(msg) {
    const action = msg.data.action
    const data = msg.data.response

    switch(action) {
        case "UPDATE_PLAYERS":
            players = data.players
            console.log(players)
            //Todo: have players display at the top
            break
        case "LOAD_QUESTION":
            currentQuestion.textContent = data.question
            currentCategory.textContent = data.category
            currentAnswer.textContent = data.answer
            setState(questionDiv)
            break
        case "POLL_STATE":
            //get current state
            break
        default:
            console.log("Invalid action: ", msg.data)
            break
    }
}