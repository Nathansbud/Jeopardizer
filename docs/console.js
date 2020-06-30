const bc = new BroadcastChannel('Jeopardizer');
const validActions = ["LOAD_GAME", "LOAD_QUESTION"]

const mainDiv = document.getElementById('main')
const questionDiv = document.getElementById('question')

const currentCategory = document.getElementById("question_category")
const currentQuestion = document.getElementById("question_text")
const currentAnswer = document.getElementById("question_answer")

const divs = [mainDiv, questionDiv]


function setState(div) {
    divs.forEach(d => {
        if(d != div) d.style.display = 'none';
        else d.style.display = 'block';
    })
}

bc.onmessage = function(msg) {
    const action = msg.data.action
    const data = msg.data.response

    switch(action) {
        case "LOAD_QUESTION":
            currentQuestion.textContent = data.question
            currentCategory.textContent = data.category
            currentAnswer.textContent = data.answer
            setState(questionDiv)
            break
        default:
            console.log("Invalid action: ", msg.data)
            break
    }
}