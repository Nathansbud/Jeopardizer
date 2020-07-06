/*Todo:
- "Heartbeat"  
    - If the console does not receive the link client message, things go south; could...
        - Send link messages until a console responds
        - Have a timeout until console loads (right now custom games load too fast)
- Custom Games
    - Support media, multiplier (e.g. n -> 200n..1000n), DD #...
*/

const bc = new BroadcastChannel('Jeopardizer');
const corsUrl =  "https://dork.nathansbud-cors.workers.dev/?" //Credit to: https://github.com/Zibri/cloudflare-cors-anywhere/blob/master/index.js
const answerCapture = new RegExp(`(?<=<em class=\\\\?"correct_response\\\\?">)(.*)(?=</em>)`)
const lastSeason = [6699,6697,6695,6694,6691,6686,6684,6682,6680,6678,6672,6670,6667,6666,6664,6659,6657,6655,6653,6651,6623,6622,6620,6618,6616,6614,6612,6610,6608,6607,6605,6604,6603,6602,6601,6600,6599,6598,6597,6596,6593,6592,6591,6590,6589,6588,6587,6586,6585,6584,6583,6582,6581,6580,6579,6578,6577,6576,6575,6574,6571,6570,6569,6568,6567,6565,6564,6562,6561,6557,6556,6555,6554,6553,6552,6551,6550,6549,6548,6547,6545,6544,6543,6542,6541,6540,6539,6538,6537,6536,6535,6534,6533,6532,6531,6530,6529,6528,6525,6524,6523,6520,6517,6514,6513,6512,6511,6510,6509,6508,6507,6506,6505,6504,6503,6502,6501,6500,6499,6498,6497,6496,6495,6493,6491,6486,6485,6484,6483,6482,6481,6480,6479,6478,6477,6473,6472,6471,6470,6469,6468,6467,6466,6465,6464,6463,6462,6461,6460,6459,6456,6455,6454,6453,6452,6451,6450,6449,6448,6447,6446,6445,6444,6443,6442,6441,6440,6439,6438,6437,6434,6433,6432,6431,6429,6426,6425,6424,6423,6422,6420,6419,6418,6417,6416,6414,6413,6412,6411,6410]
const [dailyDoubleSFX, finalJeopardySFX, questionOpenSFX, timeOutSFX] = ["Daily Double", "Final Jeopardy", "Question Open", "Time Out"].map(sfx => new Audio(`./data/${sfx}.mp3`))

const randInt = (max, min, incl=false) => Math.floor(Math.random()*(max - min)) + min + incl 
const show = (elem, as='block') => elem.style.display = as
const hide = (elem, useNone=true) => elem.style.display = (useNone) ? ('none') : ('hidden')

const startDiv = document.getElementById("start")
const advancedDiv = document.getElementById('advanced')

const startForm = document.getElementById('start_form')
const gameId = document.getElementById('game_id')
const footnoteId = document.getElementById('id_footnote')
const playerInput = document.getElementById('player_names')

const advancedButton = document.getElementById('advanced_button')

const customSelector = document.getElementById('game_file')
const footnoteCustom = document.getElementById('file_footnote')
const customLabel = document.getElementById('custom_label')

const startButton = document.getElementById('start_button')

const gameDiv = document.getElementById("game")
const questionDiv = document.getElementById("question")

let currentCell = null
const currentCategory = document.getElementById("question_category")
const currentQuestion = document.getElementById("question_text")
const currentValue = document.getElementById("question_value")


let dailyDoubleText = document.getElementById("daily_double")

const scoresDiv = document.getElementById("scores")
const scoreList = document.getElementById('player_scores')
const endSectionDiv = document.getElementById("end")

const pauseDiv = document.getElementById("pause")
let customGame = null

let divs = [startDiv, gameDiv, questionDiv, scoresDiv, pauseDiv]
let cid = Date.now() /* todo: localStorage this and link it to the console */
let coid = null

let hasTiebreaker = false
let roundTables = document.getElementsByClassName("game_table")

let roundNotes = {}
const rounds = ['single_jeopardy', 'double_jeopardy', 'final_jeopardy', 'tiebreaker']
rounds.forEach(r => roundNotes[r] = {dd: [], comments:{}})

let players = {}
function sendMessage(action, params=[]) {
    let messageResponse = {
        src: "CLIENT",
        cid: cid,
        coid: coid
    }
    params.forEach(p => messageResponse[p[0]] = p[1])
    bc.postMessage({
        action: action,
        response: messageResponse
    })
}

let heartbeat = null //setTimeout used to communicate data from client -> console
let heartbeatLast = null //Time since last heartbeat response (to know if client-console link should take place again)
let heartbeatCurrent = 0
let hasLoaded = false

let debug = true

let useStacked = false


const validActions = ["CLOSE_QUESTION", "WRONG_ANSWER", "RIGHT_ANSWER"]
bc.onmessage = function(msg) {
    const action = msg.data.action
    const receivedAt = msg.timestamp
    const data = msg.data.response
    if(data.src === "CONSOLE" && data.cid === cid) { 
        switch(action) {
            case "HEARTBEAT":
                if(data.coid === coid) {
                    heartbeatLast = heartbeatCurrent
                    heartbeatCurrent = receivedAt
                }
                console.log("Heartbeat received...")
                break
            case "LINK_CONSOLE":
                console.log("Loading game...")
                coid = data.coid
                if(hasLoaded) setState(gameDiv)
                sendMessage("START_GAME", [['players', players], ['notes', roundNotes]])
                break
            case "CONSOLE_CLOSE":
                if(data.coid === coid) {
                    coid = null
                    setState(pauseDiv)
                }
                break
            case "SHOW_SCORES":
                if(data.coid === coid) {
                    updateScoreList()
                    setState(scoresDiv)
                }
                break
            case "SHOW_BOARD":
                if(data.coid === coid) setState(gameDiv)
                break
            case "UPDATE_PLAYERS":
            //unused
            case "WRONG_ANSWER": 
            case "RIGHT_ANSWER":
                if(data.coid === coid) {
                    players = data.players
                    updateScoreList()
                }
                break
            case "OPEN_QUESTION":
                if(data.coid === coid) {
                    if(data.dd) {
                        dailyDoubleText.style.display = 'block'
                        currentQuestion.style.display = 'none'
                        currentValue.style.display = 'none'
                    } else {
                        dailyDoubleText.style.display = 'none'
                        currentQuestion.style.display = 'block'
                        currentValue.style.display = 'block'
                    }
                    setState(questionDiv)
                    currentCell.setAttribute('disabled', true)
                    currentCell.textContent = ""
                }
                break
            case "SET_VALUE":
                if(data.coid === coid) currentValue.textContent = `$${data.value}`
                break
            case "SHOW_QUESTION":
                if(data.coid === coid) {
                    currentQuestion.style.display = 'block'
                    currentValue.style.display = 'block'
                }
                break
            case "CLOSE_QUESTION":
                if(data.coid === coid) setState(gameDiv)
                break
            case "PROGRESS_ROUND":
                if(data.coid === coid) {
                    progressRound()
                }
                break
            case "RESTART":
                if(data.coid === coid) setup()
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

function shouldTiebreaker() {
    let pv = Object.values(players)
    return hasTiebreaker && !pv.map(ps => pv.indexOf(ps) === pv.lastIndexOf(ps)).every(s => s)
}

function progressRound() {
    let shouldEnd = true
    const hasClues = Array.from(roundTables).map(rt => rt.children.length > 0)

    for(let i = 0; i < roundTables.length - 1; i++) {
        if(roundTables[i].style.display != 'none') {
            if(i === roundTables.length - 2 && !shouldTiebreaker()) {
                shouldEnd = true
                break
            }
            roundTables[i].style.display = 'none'
            roundTables[i+1].style.display = 'table'
            console.log("Progressed to " + roundTables[i+1].getAttribute('id'))
            shouldEnd = false
            break
        } 
    }
    if(shouldEnd) {
        show(endSectionDiv)
        show(document.getElementById('final_text'), 'inline')
        updateScoreList()
        setState(scoresDiv)
    }
}

function updateScoreList() {
    while(scoreList.lastChild) {
        scoreList.removeChild(scoreList.lastChild);
    }
    Object.entries(players).sort((a, b) => b[1] - a[1]).forEach(pe => {
        let pl = document.createElement('li')
        pl.textContent = `${pe[0]}: ${pe[1]}`
        scoreList.appendChild(pl)
    })
}

function setup() {
    hasLoaded = false
    if(localStorage.getItem('showAdvanced') === 'true') {
        advancedButton.textContent = 'Hide Advanced'
        advancedDiv.style.display = 'block'
    }
    
    let playedList = localStorage.getItem('playedList')
    let unusedIds;

    if(playedList) {
        unusedIds = lastSeason.filter(lsid => !JSON.parse(playedList).map(gid => parseInt(gid)).includes(lsid))
    }
    else unusedIds = lastSeason
    
    gameId.value = unusedIds[randInt(0, unusedIds.length, false)]
    footnoteId.setAttribute('href', `http://www.j-archive.com/showgame.php?game_id=${gameId.value}`)

    if(startButton.getAttribute('disabled')) startButton.removeAttribute('disabled')
    if(customSelector.files.length > 0) customSelector.files = []
    if(!useStacked) {
        Array.from(roundTables).forEach(rt => {
            while(rt.lastChild) {
                rt.removeChild(rt.lastChild);
            }
        })
    }

    setState(startDiv)
}

window.onload = function() {
    setup()
    startForm.addEventListener('submit', function() {
        players = {}
        let consoleLoc = new String(window.location)
        let queryId = gameId.value
        let playerNames = (playerInput.value) ? (playerInput.value.split(",").map(pn => pn.trim())) : (playerInput.value)
        if(playerNames) {
            startButton.setAttribute('disabled', true)
            playerNames.forEach(pn => players[pn] = 0)
            if(customSelector.files.length > 0) {
                startGame(customGame)
            } else if(queryId && queryId >= gameId.min && queryId <= gameId.max) {
                getGame(queryId).then((value) => {
                    startGame(value)
                    if(localStorage.getItem('playedList')) {
                        let pl = JSON.parse(localStorage.getItem('playedList'))
                        pl.push(queryId)
                        localStorage.setItem('playedList', JSON.stringify(pl))
                    } else {
                        localStorage.setItem('playedList', JSON.stringify([queryId]))
                    }
                })
            } else {
                startButton.disabled = false
                return 
            }
            if(!coid) {
                if(consoleLoc.includes('nathansbud.github.io')) {
                    consoleLoc = 'https://nathansbud.github.io/Jeopardizer/console.html'
                } else {
                    consoleLoc = 'file:///Users/zackamiton/Code/Jeopardizer/docs/console.html'   
                }
                window.open(consoleLoc,'_blank', 'toolbar=0,location=0,menubar=0')
            }
        }
    })
}

function startGame(gameObj) {
    loadGame(gameObj)
    if(!coid) sendMessage("LINK_CLIENT")
    else sendMessage("START_GAME", [['players', players], ['notes', roundNotes]])

    console.log("Sent linking message...")
    
    Array.from(roundTables).forEach(rt => {
        if(rt != document.getElementById('single_jeopardy')) rt.style.display = 'none'
        else rt.style.display = 'table'
    })
    if(coid) setState(gameDiv)           
    hasLoaded = true
}

function setState(div) {
    divs.forEach(d => {
        if(d != div) d.style.display = 'none';
        else d.style.display = 'block';
    })
}


customSelector.addEventListener('change', loadCustom)
advancedButton.addEventListener('click', () => {
    if(advancedDiv.style.display === 'block') {
        advancedDiv.style.display = 'none'
        advancedButton.textContent = 'Show Advanced'
        localStorage.setItem('showAdvanced', false)
    } else {
        advancedDiv.style.display = 'block'
        advancedButton.textContent = 'Hide Advanced'
        localStorage.setItem('showAdvanced', true)
    }
})

function loadCustom() {
    const JSONReader = new FileReader()
    JSONReader.onload = function(e) {
        try {
            customGame = Object.values(JSON.parse(e.target.result))
            customLabel.textContent = customSelector.files[0].name
        } catch(e) {
            customGame = null
            customLabel.textContent = 'Invalid file!'
        }
    }
    JSONReader.readAsText(customSelector.files[0])
}

function loadGame(roundSet) {
    let ids = ['single_jeopardy', 'double_jeopardy', 'final_jeopardy', 'tiebreaker']
    let rse = roundSet.entries()
    if(rse.length > 3) hasTiebreaker = true
    
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
    
        //Gonna need to rewrite this to interface with custom categories
        let sjdd = randInt(0, 30)
        let djdd = shuffle(getRange(30)).slice(0, 2)

        let count = 0
        let newCells = Object.entries(questionSet).map(([ind, qs]) => qs.map((qa, indq) => {
            let newCell = document.createElement('td')
            newCell.setAttribute('data-dd', (i === 0 && count === sjdd || i === 1 && djdd.includes(count)))
            newCell.setAttribute('data-value', 200*(i+1)*(parseInt(ind)+1))
            newCell.setAttribute('data-question', qa.question)
            newCell.setAttribute('data-answer', qa.answer)
            newCell.setAttribute('class', 'question_cell')
            newCell.setAttribute('data-category', round[indq].category)
            newCell.setAttribute('data-comments', round[indq].comments)
            
            
            if(round[indq].comments) {
                roundNotes[rounds[i]].comments[round[indq].category] = round[indq].comments
            }

            if(newCell.getAttribute('data-dd') === 'true') {
                roundNotes[rounds[i]].dd.push(`${round[indq].category} (${200*(i+1)*(parseInt(ind)+1)})`) 
            }
            
            if(qa.question) newCell.textContent = "$"+newCell.getAttribute('data-value')
            else {
                newCell.setAttribute('disabled', true)
            }

            newCell.addEventListener('click', function() {
                if(!this.getAttribute('disabled')) {
                    showQuestion(newCell)
                }
            })   
            count++ 
            
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
    currentCell = cell
    
    currentCategory.textContent = cell.getAttribute('data-category')
    currentQuestion.textContent = cell.getAttribute('data-question')
    currentValue.textContent = `$${cell.getAttribute('data-value')}`

    sendMessage("LOAD_QUESTION", [["question", cell.getAttribute('data-question')], 
                                  ["category", cell.getAttribute('data-category')],
                                  ["answer", cell.getAttribute('data-answer')],
                                  ["comment", cell.getAttribute('data-comments')],
                                  ["dd", cell.getAttribute('data-dd') === 'true'],
                                  ['value', cell.getAttribute('data-dd') != 'true' ? parseInt(cell.getAttribute('data-value')) : 0]
                                ])
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
    const response = await fetch(`${corsUrl}https://www.j-archive.com/showgame.php?game_id=${gid}`)
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
            if(i < 2) cat['clues'] = questions[i].filter((elem, idx) => ((idx - j) % 6) === 0)
            else cat['clues'] = [{question: questions[i][0]['question'], answer: cat['answer']}]
            delete cat['answer']
        }             
        roundSet.push(r)
    }
        
    return roundSet
}

footnoteId.addEventListener('change', function() {
    footnoteId.setAttribute('href', `http://www.j-archive.com/showgame.php?game_id=${gameId.value}`)
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
