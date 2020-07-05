//Todo: Establish some sort of unique connection between client and console
const bc = new BroadcastChannel('Jeopardizer');
const corsUrl = "https://cors-anywhere.herokuapp.com"
const answerCapture = new RegExp(`(?<=<em class=\\\\?"correct_response\\\\?">)(.*)(?=</em>)`)
const lastSeason = [6699,6697,6695,6694,6691,6686,6684,6682,6680,6678,6672,6670,6667,6666,6664,6659,6657,6655,6653,6651,6623,6622,6620,6618,6616,6614,6612,6610,6608,6607,6605,6604,6603,6602,6601,6600,6599,6598,6597,6596,6593,6592,6591,6590,6589,6588,6587,6586,6585,6584,6583,6582,6581,6580,6579,6578,6577,6576,6575,6574,6571,6570,6569,6568,6567,6565,6564,6562,6561,6557,6556,6555,6554,6553,6552,6551,6550,6549,6548,6547,6545,6544,6543,6542,6541,6540,6539,6538,6537,6536,6535,6534,6533,6532,6531,6530,6529,6528,6525,6524,6523,6520,6517,6514,6513,6512,6511,6510,6509,6508,6507,6506,6505,6504,6503,6502,6501,6500,6499,6498,6497,6496,6495,6493,6491,6486,6485,6484,6483,6482,6481,6480,6479,6478,6477,6473,6472,6471,6470,6469,6468,6467,6466,6465,6464,6463,6462,6461,6460,6459,6456,6455,6454,6453,6452,6451,6450,6449,6448,6447,6446,6445,6444,6443,6442,6441,6440,6439,6438,6437,6434,6433,6432,6431,6429,6426,6425,6424,6423,6422,6420,6419,6418,6417,6416,6414,6413,6412,6411,6410]
const [dailyDoubleSFX, finalJeopardySFX, questionOpenSFX, timeOutSFX] = ["Daily Double", "Final Jeopardy", "Question Open", "Time Out"].map(sfx => new Audio(`./data/${sfx}.mp3`))

const randInt = (max, min, incl=false) => Math.floor(Math.random()*(max - min)) + min + incl 
//const moneyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD'})

const startDiv = document.getElementById("start")
const startForm = document.getElementById('start_form')
const gameId = document.querySelector("input[name='game_id']")
const playerInput = document.querySelector("input[name='player_names']")
const footnote = document.querySelector(".footnote")

let startButton = document.querySelector("input[name='start_button']")
const gameDiv = document.getElementById("game")
const questionDiv = document.getElementById("question")

let currentCell = null
let currentCategory = document.getElementById("question_category")
let currentQuestion = document.getElementById("question_text")

let backButton = document.getElementById('back_button')
const scoresDiv = document.getElementById("scores")

const endDiv = document.getElementById("end")
const pauseDiv = document.getElementById("pause")

let divs = [startDiv, gameDiv, questionDiv, scoresDiv, endDiv, pauseDiv]
let cid = Date.now() /* todo: localStorage this and link it to the console */
let coid = null

let players = {}

//let currentState = "START"

let roundTables = [
    document.getElementById('single_jeopardy'), 
    document.getElementById('double_jeopardy'),
    document.getElementById('final_jeopardy'),
    document.getElementById('tiebreaker')
]

const linkClient = function() {
    console.log("Sent linking message...")
    bc.postMessage({
        action:"LINK_CLIENT",
        response: {
            src: "CLIENT",
            players: players,
            cid: cid,
            game: gameId.value //not necessary but might as well broadcast it
        }        
    })
}

let heartbeat = null //setTimeout used to communicate data from client -> console
let heartbeatLast = null //Time since last heartbeat response (to know if client-console link should take place again)
let heartbeatCurrent = 0
let hasLoaded = false

const validActions = ["CLOSE_QUESTION", "WRONG_ANSWER", "RIGHT_ANSWER"]
bc.onmessage = function(msg) {
    const action = msg.data.action
    const receivedAt = msg.timestamp
    const data = msg.data.response
    if(data.src == "CONSOLE" && data.cid == cid) { 
        switch(action) {
            case "HEARTBEAT":
                if(data.coid == coid) {
                    heartbeatLast = heartbeatCurrent
                    heartbeatCurrent = receivedAt
                }
                console.log("Heartbeat received...")
                break
            case "LINK_CONSOLE":
                console.log("Loading game...")
                coid = data.coid
                if(hasLoaded) setState(gameDiv)
                break
            case "CONSOLE_CLOSE":
                if(data.coid == coid) {
                    coid = null
                    setState(pauseDiv)
                }
                break
            case "OPEN_QUESTION":
                if(data.coid == coid) {
                    setState(questionDiv)
                    currentCell.setAttribute('disabled', true)
                    currentCell.textContent = ""
                }
                break
            case "WRONG_ANSWER":
                break
            case "RIGHT_ANSWER":
                break
            case "CLOSE_QUESTION":
                setState(gameDiv)
                break
            case "PROGRESS_ROUND":
                progressRound()
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
}

function progressRound() {
    if(roundTables[roundTables.length - 1].style.display != 'none') {
        
    }  else {
        for(let i = 0; i < roundTables.length - 1; i++) {
            if(roundTables[i].style.display != 'none') {
                roundTables[i].style.display = 'none'
                roundTables[i+1].style.display = 'block'
                console.log("Progressed to " + roundTables.getAttribute('id'))
                break
            } 
        }
    }
}

window.onload = function() {
    //gameId.value = randInt(parseInt(gameId.min), parseInt(gameId.max), true)
    gameId.value = lastSeason[randInt(0, lastSeason.length, false)]
    startForm.addEventListener('submit', function() {
        
        let consoleLoc = new String(window.location)
        let queryId = gameId.value
        let playerNames = (playerInput.value) ? (playerInput.value.split(",").map(pn => pn.trim())) : (playerInput.value)

        if(playerNames && queryId && queryId >= gameId.min && queryId <= gameId.max) {
            startButton.disabled = true
            playerNames.forEach(pn => players[pn] = 0)
            if(consoleLoc.includes('nathansbud.github.io')) {
                consoleLoc = 'https://nathansbud.github.io/Jeopardizer/console.html'
            } else {
                consoleLoc = 'file:///Users/zackamiton/Code/Jeopardizer/docs/console.html'   
            }
            window.open(consoleLoc,'_blank', 'toolbar=0,location=0,menubar=0')
            getGame(queryId).then((value) => {
                loadGame(value)
                if(coid) setState(gameDiv)           
                hasLoaded = true
            })

            heartbeat = setTimeout(() => {
                if(!coid) {
                    linkClient()
                } else if(heartbeatLast == null || heartbeatCurrent - heartbeatLast > 5) {
                    console.log("SKRT")
                } else {
                    bc.postMessage({
                        action: "HEARTBEAT",
                        response: {
                            src: "CLIENT",
                            cid: cid,
                            coid: coid
                        }
                    })
                }
            }, 1000);

            /*
            if(!document.fullscreenElement) {
                document.querySelector('#fullscreen').requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                })
            }*/
        }
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
    console.log(roundSet)
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
        //SJ -> 1DD, DJ -> 2DD
        let sjdd = randInt(0, 30)
        let djdd = shuffle(getRange(30)).slice(0, 2)

        let count = 0
        let newCells = Object.entries(questionSet).map(([ind, qs]) => qs.map((qa, indq) => {
            let newCell = document.createElement('td')
            newCell.setAttribute('data-dd', (i == 0 && count == sjdd || i == 1 && djdd.includes(count)))
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
            count++ 
            return newCell
        }))
        console.log(count)

        newCells.forEach(tr => {
            let newRow = document.createElement('tr')
            tr.forEach(t => newRow.appendChild(t))
            table.append(newRow)
        })
    }
}

function showQuestion(cell) {
    currentCell = cell
    currentCategory.textContent = cell.getAttribute('data-category')
    currentQuestion.textContent = cell.getAttribute('data-question')

    bc.postMessage({
        "action":"LOAD_QUESTION",
        "response":{
            src: "CLIENT",
            cid: cid,
            coid: coid,
            question: cell.getAttribute('data-question'),
            category: cell.getAttribute('data-category'), 
            answer: cell.getAttribute('data-answer'), 
            comment: cell.getAttribute('data-comments')
        }
    })
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

footnote.addEventListener('click', function() {
    if(gameId.value) {
        window.open(`http://www.j-archive.com/showgame.php?game_id=${gameId.value}`, "_blank")
    }
})

function playSFX(sf) {
    for(let s of [dailyDoubleSFX, finalJeopardySFX, questionOpenSFX, timeOutSFX]) {
        if(!s.paused) {
            s.pause()
            s.currentTime = 0
        }
    }
    sf.play()
}


function getRange(max, min=0) {
    if(min < 0) min = 0
    return [...Array(max).keys()].slice(min)
}

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr
}
