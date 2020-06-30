//Todo: Establish some sort of unique connection between client and console
const bc = new BroadcastChannel('Jeopardizer');
const corsUrl = "https://cors-anywhere.herokuapp.com"
const answerCapture = new RegExp(`(?<=<em class=\\\\?"correct_response\\\\?">)(.*)(?=</em>)`)

const randInt = (max, min, incl=false) => Math.floor(Math.random()*(max - min)) + min + incl 
//const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD'})

const startDiv = document.getElementById("start")
const startForm = document.getElementById('start_form')
const gameId = document.querySelector("input[name='game_id']")
const startButton = document.querySelector("input[name='start_button']")
const gameDiv = document.getElementById("game")
const questionDiv = document.getElementById("question")

let currentCategory = document.getElementById("question_category")
let currentQuestion = document.getElementById("question_text")

let backButton = document.getElementById('back_button')

let scoresDiv = document.getElementById("scores")
let divs = [startDiv, gameDiv, questionDiv, scoresDiv]

const validActions = ["CLOSE_QUESTION", "WRONG_ANSWER", "RIGHT_ANSWER"]
bc.onmessage = function(msg) {
    const action = msg.data.action
    const data = msg.data.response

    switch(action) {
        case "WRONG_ANSWER":
            break
        case "RIGHT_ANSWER":
            break
        case "CLOSE_QUESTION":
            setState(gameDiv)
            break
        default:
            if(action in validActions) {
                console.log("Received unimplemented action: ", msg.data)
            } else {
                console.log("Invalid action: ", msg.data)
            }
            break
    }
}

window.onload = function() {
    gameId.value = randInt(parseInt(gameId.min), parseInt(gameId.max), true)
    startForm.addEventListener('submit', function() {
        let queryId = gameId.value
        if(queryId && queryId >= gameId.min && queryId <= gameId.max) {
            startButton.disabled = true
            getGame(queryId).then((value) => {
                loadGame(value)           
                setState(gameDiv)
            })
            /*
            if(!document.fullscreenElement) {
                document.querySelector('#fullscreen').requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                })
            }*/
        }
    })
    backButton.addEventListener('click', function(){
        setState(gameDiv)
    })
}

function setState(div) {
    divs.forEach(d => {
        if(d != div) d.style.display = 'none';
        else d.style.display = 'block';
    })
}



function loadGame(roundSet) {
    let ids = ['single_jeopardy', 'double_jeopardy', 'final_jeopardy', 'tiebreaker']
    for(let [i, round] of roundSet.entries()) {
        let table = document.getElementById(ids[i])
        let headerRow = document.createElement('tr')
        let questionSet = {}
        
        round.forEach(r => {
            let catName = document.createElement('th')
            catName.textContent = r['category']
            headerRow.appendChild(catName)
            r.clues.forEach((qa, idx) => {
                if(questionSet[idx]) questionSet[idx].push(qa)
                else {
                    questionSet[idx] = [qa]
                }
            })
        })
        
        table.appendChild(headerRow)
        let newCells = Object.entries(questionSet).map(([ind, qs]) => qs.map((qa, indq) => {
            let newCell = document.createElement('td')
            
            newCell.setAttribute('data-value', 200*(i+1)*(parseInt(ind)+1))
            newCell.setAttribute('data-question', qa.question)
            newCell.setAttribute('data-answer', qa.answer)
            newCell.setAttribute('class', 'question_cell')
            newCell.setAttribute('data-category', round[indq].category)
            newCell.setAttribute('data-comments', round[indq].comments)

            newCell.textContent = "$"+newCell.getAttribute('data-value')
            newCell.addEventListener('click', function() {
                if(!this.getAttribute('disabled')) {
                    showQuestion(newCell)
                }
            })    
            return newCell
        }))

        newCells.forEach(tr => {
            let newRow = document.createElement('tr')
            tr.forEach(t => newRow.appendChild(t))
            table.append(newRow)
        })
    }
}

function showQuestion(cell) {
    cell.setAttribute('disabled', true)
    cell.textContent = ""
    
    currentCategory.textContent = cell.getAttribute('data-category')
    currentQuestion.textContent = cell.getAttribute('data-question')

    bc.postMessage({
        "action":"LOAD_QUESTION",
        "response":{
            question: cell.getAttribute('data-question'),
            category: cell.getAttribute('data-category'), 
            answer: cell.getAttribute('data-answer'), 
            comment: cell.getAttribute('data-comments')
        }
    })
    
    setState(questionDiv)
}

function extractAnswer(clue) {
    let aa = clue?.querySelector('div')?.getAttribute('onmouseover')
    if(aa) {
        return aa.match(answerCapture)[0].trim().replace(/<\/?i>/g, "")
    } else {
        return ""
    }
}

function getCategories(tables) {
    return tables.map(r => Array.from(r.getElementsByClassName("category")))
                 .map(c => c.map(function(cn) {
                     return {
                         "category":cn.querySelector(".category_name").textContent.trim(),
                         "comments":cn.querySelector('.category_comments').textContent.trim(),
                         "answer":extractAnswer(cn) //only for final round; is null otherwise!
                        }
                    }))
}

async function getGame(gid) {
    const response = await fetch(`${corsUrl}/https://www.j-archive.com/showgame.php?game_id=${gid}`)
    const pageContent = new DOMParser().parseFromString(await response.text(), 'text/html')
    const header = pageContent.getElementById("game_title").textContent
    const gameDate = new Date(header.split("-")[1]) //something like "Friday, October 18, 2019"
    const categorySet = {}
    

    let rounds = Array.from(pageContent.getElementsByClassName("round")).concat(Array.from(pageContent.getElementsByClassName("final_round")))
    let categories = getCategories(rounds)
    let questions = rounds.map(r => Array.from(r.getElementsByClassName("clue")))
                          .map(c => c.map(function(cn) {
                            return {
                                "question": cn.querySelector('.clue_text')?.textContent.trim(),
                                "answer": extractAnswer(cn) 
                            }
                          }))
    
    let roundSet = []
    for(let [i, r] of categories.entries()) {
        for(let [j, cat] of Array.from(r).entries()) {
            if(i < 2) cat['clues'] = questions[i].filter((elem, idx) => ((idx - j) % 6) == 0)
            else cat['clues'] = [{question: questions[i][0]['question'], answer: cat['answer']}]
            delete cat['answer']
        }             
        roundSet.push(r)
    }
    
    return roundSet
}

