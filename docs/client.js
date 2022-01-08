/*Todo:

- Custom Games
    - Support media, multiplier (e.g. n -> 200n..1000n), DD #...
*/

const bc = new BroadcastChannel('Jeopardizer')
const corsUrl =  "https://dork.nathansbud-cors.workers.dev/?" //Credit to: https://github.com/Zibri/cloudflare-cors-anywhere/blob/master/index.js
const answerCapture = new RegExp(`(?<=<em class=\\\\?"correct_response\\\\?">)(.*)(?=</em>)`)
const lastSeason = [7123,7121,7119,7117,7116,7114,7113,7112,7111,7110,7108,7107,7106,7105,7104,7102,7100,7098,7096,7094,7091,7089,7087,7085,7083,7078,7076,7075,7074,7073,7068,7066,7064,7062,7060,7058,7057,7055,7054,7053,7049,7048,7047,7046,7045,7043,7042,7041,7040,7039,7038,7037,7036,7035,7034,7033,7032,7031,7030,7029,7028,7027,7026,7025,7024,7023,7022,7021,7020,7019,7018,7017,7016,7015,7014,7013,7012,7011,7010,7009,7008,7005,7004,7003,7002,6999,6997,6996,6995,6994,6993,6992,6991,6990,6989,6987,6986,6985,6984,6983,6981,6980,6979,6977,6976,6974,6972,6971,6969,6968,6967,6966,6964,6963,6962,6961,6960,6958,6957,6955,6953,6951,6950,6949,6948,6947,6945,6944,6943,6942,6938,6937,6935,6934,6933,6932,6931,6930,6928,6927,6924,6923,6922,6921,6920,6917,6916,6915,6913,6911,6906,6904,6903,6902,6901,6900,6899,6898,6897,6896,6895,6894,6893,6892,6891,6890,6889,6888,6887,6886,6885,6884,6883,6882,6881,6880,6879,6878,6877,6876,6872,6871,6870,6869,6868,6866,6865,6864,6863,6862,6861,6860,6859,6858,6857,6856,6855,6854,6853,6852,6851,6850,6849,6848,6847,6846,6845,6844,6843,6842,6841,6840,6839,6838,6837,6835,6834,6833,6832,6831,6830,6829,6828,6827,6826,6825,6824,6823,6822,6821,6699,6697,6695,6694,6691,6686,6684,6682,6680,6678,6672,6670,6667,6666,6664,6659,6657,6655,6653,6651,6623,6622,6620,6618,6616,6614,6612,6610,6608,6607,6605,6604,6603,6602,6601,6600,6599,6598,6597,6596,6593,6592,6591,6590,6589,6588,6587,6586,6585,6584,6583,6582,6581,6580,6579,6578,6577,6576,6575,6574,6571,6570,6569,6568,6567,6565,6564,6562,6561,6557,6556,6555,6554,6553,6552,6551,6550,6549,6548,6547,6545,6544,6543,6542,6541,6540,6539,6538,6537,6536,6535,6534,6533,6532,6531,6530,6529,6528,6525,6524,6523,6520,6517,6514,6513,6512,6511,6510,6509,6508,6507,6506,6505,6504,6503,6502,6501,6500,6499,6498,6497,6496,6495,6493,6491,6486,6485,6484,6483,6482,6481,6480,6479,6478,6477,6473,6472,6471,6470,6469,6468,6467,6466,6465,6464,6463,6462,6461,6460,6459,6456,6455,6454,6453,6452,6451,6450,6449,6448,6447,6446,6445,6444,6443,6442,6441,6440,6439,6438,6437,6434,6433,6432,6431,6429,6426,6425,6424,6423,6422,6420,6419,6418,6417,6416,6414,6413,6412,6411,6410]

const sfxNames = ["Time Out", "Daily Double", "Final Jeopardy", "Question Open", "Round Over"]
const SFX = sfxNames.map(n => new Audio(`./data/${n}.mp3`))

const fullscreenDiv = document.getElementById('fullscreen')
const startDiv = document.getElementById("start")
const advancedDiv = document.getElementById('advanced')

const startForm = document.getElementById('start_form')
const gameId = document.getElementById('game_id')
const footnoteId = document.getElementById('id_footnote')
const playerInput = document.getElementById('player_names')
const errorText = document.getElementById('error_text')

const advancedButton = document.getElementById('advanced_button')
const customSelector = document.getElementById('game_file')
const footnoteCustom = document.getElementById('file_footnote')
const customLabel = document.getElementById('custom_label')
const dailyDoubleCheckbox = document.getElementById('dd_checkbox')
const timerCheckbox = document.getElementById('time_checkbox')
const timerInput = document.getElementById('time_limit')

const startButton = document.getElementById('start_button')
const relaunchButton = document.getElementById('relaunch_button')

const gameDiv = document.getElementById("game")
const questionDiv = document.getElementById("question")

let currentCell = null
const currentCategory = document.getElementById("question_category")
const currentQuestion = document.getElementById("question_text")
const currentValue = document.getElementById("question_value")

const dailyDoubleText = document.getElementById("daily_double")

const scoresDiv = document.getElementById("scores")
const scoreList = document.getElementById('player_scores')

let timeLimit = null
const pauseDiv = document.getElementById("pause")
let customGame = null

let divs = [startDiv, gameDiv, questionDiv, scoresDiv, pauseDiv]
let cid = Date.now() /* todo: localStorage this and link it to the console */
let coid = null

let roundKey = 'single_jeopardy'

let hasTiebreaker = false
let roundTables = document.getElementsByClassName("game_table")

let roundNotes = {}
const rounds = ['single_jeopardy', 'double_jeopardy', 'final_jeopardy', 'tiebreaker']

const initializeRoundNotes = () => JSON.parse(JSON.stringify({dd: [], categories: [], rows: []}))
rounds.forEach(r => roundNotes[r] = initializeRoundNotes())

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
const sendStartMessage = () => sendMessage("START_GAME", [
    ['players', players], 
    ['notes', roundNotes], 
    ['limit', timeLimit], 
    ["roundKey", roundKey],
    // on console relaunch, apply proper styling to seen questions
    ["seen", Array.from(document.querySelectorAll(".question_cell[disabled='true']")).filter(c => c.dataset.question != 'undefined').map(c => c.dataset.cell)]
])

let pulse = null //setTimeout used to communicate data from client -> console
let hasLoaded = false

let debug = true

window.addEventListener('beforeunload', (event) => {
    sendMessage("CLIENT_CLOSE")
})

function heartbeat() {
    if(!coid) sendMessage("LINK_CLIENT")
    return setInterval(() => {
        if(!coid) sendMessage("LINK_CLIENT")
        else clearInterval(pulse)
    }, 1000)
}

const randInt = (max, min, incl=false) => Math.floor(Math.random()*(max - min)) + min + incl 
const show = (elem, as='block') => elem.style.display = as
const hide = (elem, useNone=true) => elem.style.display = (useNone) ? ('none') : ('hidden')

const validActions = ["CLOSE_QUESTION", "WRONG_ANSWER", "RIGHT_ANSWER", "CELL_CLICKED"]
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
                sendStartMessage()
                break
            case "CONSOLE_CLOSE":
                if(data.coid === coid) {
                    coid = null
                    setState(pauseDiv)
                    playSFX(null)
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
                if(data.coid === coid) {
                    players = data.players
                    updateScoreList()
                }
                break
            case "OPEN_QUESTION":
                if(data.coid === coid) {
                    if([data.dd, data.final].includes('true')) {
                        dailyDoubleText.textContent = (data.dd) ? ("DAILY DOUBLE") : ("FINAL JEOPARDY")
                        dailyDoubleText.style.display = 'block'
                        currentQuestion.style.display = 'none'
                        currentValue.style.display = 'none'
                    } else {
                        dailyDoubleText.style.display = 'none'
                        currentQuestion.style.display = 'block'
                        currentValue.style.display = 'block'
                    }
                    setState(questionDiv)
                    if(data.final === 'false') {
                        currentCell.setAttribute('disabled', true)
                    } else {
                        currentCell.style.color = 'grey'
                    }
                }
                break
            case "SET_VALUE":
                if(data.coid === coid) currentValue.textContent = `$${data.value}`
                break
            case "CELL_CLICKED": 
                if(data.coid == coid) {
                    console.log(data)
                    const relevantQuestion = document.querySelector(`.question_cell[data-cell='${data.cell}']`)
                    if(relevantQuestion) showQuestion(relevantQuestion)
                }
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
                if(data.coid === coid) progressRound()
                break
            case "REGRESS_ROUND":
                if(data.coid === coid) regressRound()
                break
            case "PLAY_SFX":
            case "PAUSE_SFX":
                if(data.coid === coid) playSFX(data.sfx) //null if pause
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

            roundKey = roundTables[i+1].getAttribute('id')

            console.log(`Progressed to ${roundKey}`)
            sendMessage("SET_ROUND", [["roundKey", roundKey]])

            shouldEnd = false
            break
        } 
    }

    if(shouldEnd) {
        show(document.getElementById('final_text'), 'inline')
        updateScoreList()
        setState(scoresDiv)
    }
}

function regressRound() {
    for(let i = roundTables.length - 1; i > 0; i--) {
        if(roundTables[i].style.display != 'none') {
            roundTables[i].style.display = 'none'
            roundTables[i - 1].style.display = 'table'

            roundKey = roundTables[i - 1].getAttribute('id')

            console.log(`Regresed to ${roundKey}`)
            sendMessage("SET_ROUND", [["roundKey", roundKey]])
            break
        }
    }
}

function updateScoreList() {
    while(scoreList.lastChild) {
        scoreList.removeChild(scoreList.lastChild)
    }
    Object.entries(players).sort((a, b) => b[1] - a[1]).forEach(pe => {
        let pl = document.createElement('li')
        pl.textContent = `${pe[0]}: ${pe[1]}`
        scoreList.appendChild(pl)
    })
}

function setup() {
    hasLoaded = false
    roundNotes = {}
    roundKey = 'single_jeopardy'
    rounds.forEach(r => roundNotes[r] = initializeRoundNotes())

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

    customSelector.value = null
    customLabel.textContent = "Select File..."

    if(startButton.getAttribute('disabled')) startButton.removeAttribute('disabled')
    Array.from(roundTables).forEach(rt => {
        while(rt.lastChild) {
            rt.removeChild(rt.lastChild)
        }
    })
    
    setState(startDiv)
}

function launchConsole() {
    let consoleLoc = new String(window.location)
    if(consoleLoc.includes('jeo.zamiton.com')) {
        consoleLoc = 'https://jeo.zamiton.com/console'
    } else if(consoleLoc.includes('nathansbud.github.io/Jeopardizer')) {
        consoleLoc = 'https://nathansbud.github.io/Jeopardizer/console.html'
    } else {
        consoleLoc = 'file:///Users/zackamiton/Code/Jeopardizer/docs/console.html'   
    }
    window.open(consoleLoc, '_blank', 'toolbar=0,location=0,menubar=0')
    self.focus()
}

window.onload = function() {
    setup()
    relaunchButton.addEventListener('click', () => {
        pulse = heartbeat()
        launchConsole()
    })
    startButton.addEventListener('click', function() {
        players = {}
        timeLimit = (timerCheckbox.checked && timerInput.value >= timerInput.min) ? (timerInput.value) : (null)
        let queryId = gameId.value
        let playerNames = (playerInput.value) ? (playerInput.value.split(",").map(pn => pn.trim())) : (playerInput.value)
        if(playerNames) {
            startButton.setAttribute('disabled', true)
            playerNames.forEach(pn => players[pn] = 0)
            if(customSelector.files.length > 0) {
                startGame(customGame)
                // fullscreenDiv.requestFullscreen().catch(() => console.log("SKRT"))
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
                }).catch((error) => {
                    console.log(error)
                    setup()
                    errorText.style.display = 'block'
                    const storedId = queryId
                    gameId.value = storedId
                })
            
            } else {
                startButton.disabled = false
                return 
            }
        }
    })
}

function startGame(gameObj) {
    loadGame(gameObj)
    if(!coid) {
        launchConsole()
        pulse = heartbeat()
    }
    else sendStartMessage()

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
        if(d != div) d.style.display = 'none'
        else d.style.display = 'block'
    })
}


customSelector.addEventListener('change', () => {
    console.log("ma'am")
    loadCustom()
})
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
            catName.textContent = r.category 

            headerRow.appendChild(catName)
            r.clues.forEach((qa, idx) => {
                if(questionSet[idx]) questionSet[idx].push(qa)
                else {
                    questionSet[idx] = [qa]
                }
            })
            
            table.appendChild(headerRow)
            roundNotes[rounds[i]].categories.push({'name': r.category, 'comment': r.comments})
        })
            
        //Gonna need to rewrite this to interface with custom categories
        let sjdd = randInt(0, 30)
        let djdd = shuffle(getRange(30)).slice(0, 2)

        let count = 0
        let newCells = Object.entries(questionSet).map(([ind, qs]) => qs.map(({question, answer}, indq) => {
            let newCell = document.createElement('td')
            
            const cellAttributes = {
                cell: `${rounds[i]}-${count}`,
                dd: dailyDoubleCheckbox.checked && (i === 0 && count === sjdd || i === 1 && djdd.includes(count)),
                final: i >= 2,
                value: 200*(i+1)*(parseInt(ind)+1)*(i < 2),
                question: question,
                answer: answer,
                category: round[indq].category,
                comments: round[indq].comments
            }

            Object.entries(cellAttributes).forEach(([k, v]) => newCell.dataset[k] = v)
            newCell.classList.add("question_cell")

            if(question && i < 2) newCell.textContent = "$"+newCell.getAttribute('data-value') 
            else if(i >= 2) newCell.textContent = "Final Jeopardy"
            else {
                newCell.setAttribute('disabled', true)
            }

            newCell.addEventListener('click', function() {
                if(!this.getAttribute('disabled')) {
                    showQuestion(newCell)
                }
            })   
            count++ 
            
            return {cell: newCell, attrs: cellAttributes}
        }))


        if(dailyDoubleCheckbox.checked) {
            if(i === 0) roundNotes[rounds[i]].dd.push(sjdd)
            else if(i === 1) roundNotes[rounds[i]].dd.push(...djdd)
        }

        newCells.forEach((tr, ridx) => {
            let newRow = document.createElement('tr')
            roundNotes[rounds[i]].rows.push([])
            tr.forEach((t, cidx) => {
                roundNotes[rounds[i]].rows[ridx].push(t.attrs)
                newRow.appendChild(t.cell)
            })
            

            table.append(newRow)
        })
    }
}

function showQuestion(cell) {
    currentCell = cell
    
    currentCategory.textContent = cell.getAttribute('data-category')
    currentQuestion.textContent = cell.getAttribute('data-question')
    currentValue.textContent = `$${cell.getAttribute('data-value')}`

    sendMessage("LOAD_QUESTION", Object.entries(cell.dataset))
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
    
    if(pageContent.querySelector('.error')) throw Error("J-Archive error, game could not be loaded")

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
    for(let s of SFX) {
        if(!s.paused) {
            s.pause()
            s.currentTime = 0
        }
    }
    if(sf) SFX[sfxNames.indexOf(sf)].play()
}


function getRange(max, min=0) {
    if(min < 0) min = 0
    return [...Array(max).keys()].slice(min)
}

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]] 
    }
    return arr
}
