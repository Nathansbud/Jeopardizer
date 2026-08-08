const bc = new BroadcastChannel2('Jeopardizer')
const rootElement = document.querySelector(':root')

const corsUrl =  "https://dork.nathansbud-cors.workers.dev/?" //Credit to: https://github.com/Zibri/cloudflare-cors-anywhere/blob/master/index.js
const buzzUrl = "https://buzzin.live/host"
const answerCapture = new RegExp(`<em class=\\\\?"correct_response\\\\?">(.*)</em>`)

// Season 41, up to 2025-07-05
const lastSeason = [9262,9261,9260,9259,9258,9257,9256,9255,9254,9253,9252,9251,9250,9249,9248,9247,9246,9245,9244,9243,9242,9241,9240,9239,9238,9237,9236,9235,9234,9233,9232,9231,9230,9229,9228,9227,9222,9221,9220,9219,9218,9215,9214,9211,9210,9209,9208,9205,9202,9201,9200,9199,9196,9195,9192,9191,9190,9189,9188,9187,9186,9183,9182,9180,9179,9178,9177,9176,9175,9174,9173,9171,9170,9169,9168,9167,9166,9164,9163,9162,9158,9157,9156,9155,9154,9153,9152,9151,9150,9149,9148,9147,9146,9145,9144,9143,9142,9141,9140,9139,9138,9137,9136,9135,9134,9133,9132,9130,9129,9128,9127,9126,9125,9124,9123,9108,9121,9120,9119,9118,9117,9115,9114,9113,9112,9111,9110,9107,9106,9105,9104,9102,9101,9100,9099,9097,9096,9095,9094,9093,9092,9090,9089,9088,9086,9085,9084,9083,9082,9080,9079,9078,9077,9076,9075,9074,9073,9072,9071,9070,9069,9068,9067,9066,9065,9064,9063,9062,9061,9060,9059,9058,9057,9056,9055,9054,9053,9052,9051,9050,9049,9048,9047,9046,9045,9044,9043,9042,9041,9040,9039,9038,9037,9036,9035,9034,9033,9032,9031,9030,9029,9028,9027,9026,9025,9024,9023,9022,9021,9020,9019,9018,9017,9016,9015,9014,9013,9012,9011,9010,9009,9008,9007,9006,9004,9003,9002,9001,9000,8999]

const sfxNames = ["Time Out", "Daily Double", "Final Jeopardy", "Question Open", "Round Over"]
const SFX = sfxNames.map(n => new Audio(`./data/${n}.mp3`))

let mediaMap = {}

const fullscreenDiv = document.getElementById('fullscreen')
const startDiv = document.getElementById("start")
const advancedDiv = document.getElementById('advanced')
const incompatibleDiv = document.getElementById('incompatible')

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
const buzzerCheckbox = document.getElementById('buzzer_checkbox')
const timerCheckbox = document.getElementById('time_checkbox')
const playerCheckbox = document.getElementById('player_checkbox')
const timerInput = document.getElementById('time_limit')

const startButton = document.getElementById('start_button')
const relaunchButton = document.getElementById('relaunch_button')

const gameDiv = document.getElementById("game")
const questionDiv = document.getElementById("question")
const mediaDiv = document.getElementById("media")

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

let divs = [startDiv, gameDiv, questionDiv, mediaDiv, scoresDiv, pauseDiv, incompatibleDiv]
let cid = Date.now() /* todo: localStorage this and link it to the console */
let coid = null

let consoleWindow = null
let buzzerWindow = null

let roundKey = null
let hasTiebreaker = false

let players = {}
let roundData = {}
let roundSettings = {}
let roundNames = []

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
    ['board', Object.entries(roundData).map(([k, v]) => {return {[k]: v.board}})],
    ['limit', timeLimit], 
    ["roundKey", roundKey],
    ["settings", roundSettings],
    // on console relaunch, apply proper styling to seen questions
    ["seen", Array.from(document.querySelectorAll(".question_cell[data-seen='true']")).filter(c => c.dataset.question != 'undefined').map(c => c.dataset.cell)]
])

let pulse = null //setTimeout used to communicate data from client -> console
let hasLoaded = false

let debug = true

window.addEventListener('beforeunload', (event) => {
    if(buzzerWindow) buzzerWindow.close()
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

bc.onmessage = function(msg) {
    const action = msg.action
    const data = msg.response
    if(data.src === "CONSOLE" && data.cid === cid) { 
        switch(action) {
            case "LINK_CONSOLE":
                console.log("Loading game...")
                coid = data.coid
                if(hasLoaded) setState(gameDiv)
                sendStartMessage()
                break
            case "CONSOLE_CLOSE":
                if(data.coid === coid) {
                    coid = null;
                    if(activeState() != startDiv) {
                        hideMedia();
                        setState(pauseDiv)
                    }
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
                    const isTrue = v => ['true', true].includes(v)
                    if([data.dd, data.final].some(isTrue)) {
                        dailyDoubleText.textContent = isTrue(data.dd) ? ("DAILY DOUBLE") : ("FINAL JEOPARDY")
                        dailyDoubleText.style.display = 'block'
                        currentQuestion.style.display = 'none'
                        currentValue.style.display = 'none'
                    } else {
                        dailyDoubleText.style.display = 'none'
                        currentQuestion.style.display = 'block'
                        currentValue.style.display = 'block'
                    }
                    setState(questionDiv)
                    currentCell.style.color = getComputedStyle(rootElement).getPropertyValue("--jeopardy-blue")
                    currentCell.dataset.seen = 'true'
                }
                break
            case "SET_VALUE":
                if(data.coid === coid) {
                    currentValue.textContent = data.label;
                }
                break
            case "CELL_CLICKED": 
                if(data.coid == coid) {
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
                if(data.coid === coid) {
                    hideMedia();
                    setState(gameDiv)
                }
                break
            case "PROGRESS_ROUND":
                if(data.coid === coid) progressRound()
                break
            case "SET_ROUND":
                if(data.coid === coid) setRound(data.roundKey);
                break;
            case "REGRESS_ROUND":
                if(data.coid === coid) regressRound()
                break
            case "PLAY_SFX":
            case "PAUSE_SFX":
                if(data.coid === coid) playSFX(data.sfx) //null if pause
                break
            
            case "PLAY_MEDIA":
                if(data.coid === coid) {
                    showMedia();
                }
                break;
            case "PAUSE_MEDIA":
                if(data.coid === coid) {
                    hideMedia();
                }
                break;
            case "RESTART":
                if(data.coid === coid) setup()
                break
            case "OPEN_BUZZERS": 
                if(data.coid === coid) {
                    if(!buzzerWindow.closed) {
                        if(buzzerWindow.location === buzzUrl) buzzerWindow.location.reload()
                        else {
                            buzzerWindow.location.replace(buzzUrl)
                        }
                    } else {
                        buzzerWindow = window.open(buzzUrl, `${cid}_BUZZERS`, 'toolbar=0,location=0,menubar=0')
                    }
                }
                break;
            default:
                console.log("Received unimplemented action: ", msg.data)
                break
        }
    }
}

function shouldTiebreaker() {
    let pv = Object.values(players)
    return hasTiebreaker && !pv.map(ps => pv.indexOf(ps) === pv.lastIndexOf(ps)).every(s => s)
}

function setRound(rk) {
    for(let round of roundNames) {
        if(round !== rk) document.querySelector(`.game_table.${round}`).style.display = 'none';
        else {
            document.querySelector(`.game_table.${rk}`).style.display = 'table';
            roundKey = round;
            sendMessage("SET_ROUND", [["roundKey", roundKey]])            
        }
    }
}

function progressRound() {
    for(let i = 0; i < roundNames.length; i++) {
        if(roundNames[i] === roundKey) {
            if(roundData[roundKey].settings.mode === 'final' || i === roundNames.length - 1) {
                show(document.getElementById('final_text'), 'inline')
                updateScoreList()
                // PROGRESS_ROUND message is send with SHOW_BOARD, so circumvent by requesting score view
                sendMessage("REQUEST_SCORES")
                break;
            } else {
                document.querySelector(`.game_table.${roundKey}`).style.display = 'none';
                roundKey = roundNames[i+1];
                document.querySelector(`.game_table.${roundKey}`).style.display = 'table';
                console.log(`Progressed to ${roundKey}`)
                sendMessage("SET_ROUND", [["roundKey", roundKey]])
                break;
            }
        }
    }
}

function regressRound() {
    for(let i = roundNames.length - 1; i > 0; i--) {
        if(roundNames[i] === roundKey) {
            document.querySelector(`.game_table.${roundKey}`).style.display = 'none';
            roundKey = roundNames[i - 1];
            document.querySelector(`.game_table.${roundKey}`).style.display = 'table';

            console.log(`Regresed to ${roundKey}`)
            sendMessage("SET_ROUND", [["roundKey", roundKey]])
            break
        }
    }
}

function cleanup(elem) {
    while(elem.lastChild) elem.removeChild(elem.lastChild);
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
    roundData = {}
    customGame = null

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
    if(bc) {
        setState(startDiv)
    } else {
        setState(incompatibleDiv)
    }
}

function launchConsole() {
    let consoleLoc = new String(window.location)
    if(consoleLoc.includes('jeo.zamiton.com')) {
        consoleLoc = 'https://jeo.zamiton.com/console'
    } else if(consoleLoc.includes('nathansbud.github.io/Jeopardizer')) {
        consoleLoc = 'https://nathansbud.github.io/Jeopardizer/console.html'
    } else {
        consoleLoc = './console.html'   
    }
    
    consoleWindow = window.open(consoleLoc, `${cid}_CONSOLE`, 'toolbar=0,location=0,menubar=0')
    if(buzzerCheckbox.checked && (!buzzerWindow || buzzerWindow.closed)) {
        buzzerWindow = window.open(buzzUrl, `${cid}_BUZZERS`, 'toolbar=0,location=0,menubar=0')
    }

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
        
        let playerNames = (playerInput.value) ? 
            (playerInput.value.split(",").map(pn => pn.trim())) : 
            (!playerCheckbox.checked ? [] : playerInput.value);

        if(playerNames || !playerCheckbox.checked) {
            startButton.setAttribute('disabled', true)
            playerNames.forEach(pn => players[pn] = 0)
            if(customGame) {
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
                }).catch((e) => {
                    setup()                    
                    errorText.style.display = 'block'
                    errorText.textContent = "J-Archive is offline! Try again later, or choose a custom game instead.";

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
    const loadGameContainer = () => {
        try {
            return loadGame(gameObj)
        } catch(e) {
            return {passed: false, reason: "Unknown reason; if custom, try editing your game, otherwise try again later!"}
        }
    }

    const {
        data, passed, reason, settings
    } = loadGameContainer()
    
    if(!passed) {
        const errorMsg = `Failed to load game: ${reason ?? 'unknown reason'}`
        errorText.textContent = errorMsg;
        errorText.style.display = 'block';
        return;
    } else {
        errorText.style.display = 'none';
    }
    
    roundData = data;
    roundNames = Object.keys(data);

    Object.entries(data).forEach(([roundName, roundInfo]) => {
        const { table } = roundInfo;
        gameDiv.appendChild(table);
        table.style.display = (roundName != roundKey) ? 'none' : 'table';
    })
    
    roundSettings = settings;

    if(!coid) {
        launchConsole()
        pulse = heartbeat()
    }
    else sendStartMessage()

    console.log("Sent linking message...")

    if(coid) setState(gameDiv)        
    hasLoaded = true
}

function setState(div) {
    divs.forEach(d => {
        if(d != div) d.style.display = 'none'
        else d.style.display = 'block'
    })
}

function activeState() {
    for(let d of divs) {
        if(d.style.display === 'block') return d;
    }
}

customSelector.addEventListener('change', () => {
    console.log("Attempting to load custom game...")
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
            customGame = JSON.parse(e.target.result)
            customLabel.textContent = customSelector.files[0].name
        } catch(e) {
            console.log(e)
            customGame = null
            customLabel.textContent = 'Invalid file!'
        }
    }
    JSONReader.readAsText(customSelector.files[0])
}

function loadGame(config) { 
    while(gameDiv.lastChild) {
        gameDiv.removeChild(gameDiv.lastChild)
    }

    const parsedData = {}
    const parsedRounds = config.rounds;

    if(!parsedRounds) {
        return {passed: false, reason: "Custom games must have at least 1 round!"};
    }
    
    let firstRound = true;
    for(let [roundNum, round] of parsedRounds.entries()) {
        const {
            name, 
            multiplier, 
            categories, 
            mode
        } = round;

        const roundName = ("" + (name ?? `round-${roundNum + 1}`)).trim().toLowerCase()
        if(roundName.match(/[^A-Za-z0-9\-_]/)) {
            return {passed: false, reason: "Custom rounds may only contain characters: alphanumeric characters, hyphens (-), and underscores (_)!"}
        }

        if(firstRound) {
            roundKey = roundName;
            firstRound = false;
        }
        
        if(!categories) return {passed: false, reason: "Custom rounds must have at least 1 category!"}
        const numCategories = categories.length;
        const requiredRows = categories.reduce((acc, curr) => {
            const catLength = curr.clues.length;
            if(catLength >= acc) {
                return catLength;
            }
            return acc;
        }, 0)        
        const roundBoard = [...Array(requiredRows + 1)].map(_ => Array(numCategories))        
        for(let [column, cat] of categories.entries()) {
            const { clues, comment, category } = cat;   
            
            roundBoard[0][column] = {category: category, comment: comment}
            for(let row = 0; row < requiredRows; row++) {
                const ques = clues[row] ?? {};
                const { question, answer, value, dd, media, label } = ques;
                const baseValue = 200 * (row + 1);
                const questionKey = `${roundName}-${row}-${column}`;
                
                if(media) {
                    const { type, path, metadata } = media;
                    let mediaItem;
                    switch(type) {
                        case "audio":
                            mediaItem = new Audio(path);    
                            mediaItem.currentTime = metadata.start ?? 0;
                            if(metadata.end) {
                                mediaItem.addEventListener('timeupdate', () => {
                                    if(mediaItem.currentTime >= metadata.end) {
                                        mediaItem.pause();
                                        mediaItem.currentTime = metadata.start ?? 0;
                                    }
                                })
                            }
                            break;
                        case "image":
                            mediaItem = new Image();
                            if(metadata.width) mediaItem.width = metadata.width;
                            if(metadata.height) mediaItem.height = metadata.height;
                            mediaItem.src = path;
                            break;
                        case "video":
                            mediaItem = document.createElement("video");
                            mediaItem.currentTime = metadata.start ?? 0;
                            mediaItem.src = path;
                            mediaItem.controls = false;

                            if(metadata.width) mediaItem.width = metadata.width;
                            if(metadata.height) mediaItem.height = metadata.height;

                            if(metadata.end) {
                                mediaItem.addEventListener('timeupdate', () => {
                                    if(mediaItem.currentTime >= metadata.end) {
                                        mediaItem.pause();
                                        mediaItem.currentTime = metadata.start ?? 0;
                                    }
                                })
                            }
                            break;
                        default: 
                            console.log(`Attempted to load unsupported media type: ${type}`)
                            break;
                    }
                    
                    if(mediaItem) {
                        mediaMap[questionKey] = {
                            media: mediaItem,
                            metadata: metadata,
                            type: type,
                        }
                    }
                }
                
                const computedValue = value ?? (baseValue * (multiplier ?? 1));

                roundBoard[row + 1][column] = {
                    cell: `${roundName}-${row}-${column}`,
                    idx: row * numCategories + column,  
                    question: question ?? "",
                    answer: answer ?? "",
                    value: computedValue,
                    label: label ?? `$${computedValue}`,
                    category: category,
                    comment: comment,
                    dd: Boolean(dd ?? false),
                    final: ques.final ?? cat.final ?? round.final,
                    client: true,
                    media: !!media
                }
            }
        }

        const roundTable = document.createElement('table');
        roundTable.classList.add("game_table", roundName);

        const tableHeader = document.createElement('tr');
        roundBoard[0].forEach(c => {
            const header = document.createElement('th');
            header.textContent = c.category;
            header.dataset['comment'] = c.comment;
            tableHeader.appendChild(header);
        })

        roundTable.appendChild(tableHeader);
        roundBoard.slice(1).forEach(row => {
            const newRow = document.createElement('tr');
            row.forEach(q => {
                const cell = document.createElement("td");
                cell.classList.add('question_cell');
                cell.textContent = q.label;  
                cell.setAttribute('disabled', !!!q.answer);
                cell.addEventListener('click', function() {
                    if(this.getAttribute('disabled').includes('false')) {
                        showQuestion(this)
                        this.dataset.seen = "true"
                    }
                })
                
                Object.entries(q).forEach(([k, v]) => {cell.dataset[k] = v});
                newRow.appendChild(cell);
            })
            roundTable.appendChild(newRow);
        })
        
        parsedData[roundName] = {
            board: roundBoard,
            table: roundTable,
            settings: {
                mode: mode
            }
        };
    }
    
    return {    
        passed: true,
        data: parsedData,
        settings: {
            "ddEnabled": config.ddEnabled ?? dailyDoubleCheckbox.checked,
        }
    }
}

function showQuestion(cell) {
    currentCell = cell
    
    currentCategory.textContent = cell.getAttribute('data-category')
    currentQuestion.textContent = cell.getAttribute('data-question')
    currentValue.textContent = cell.getAttribute('data-label')

    sendMessage("LOAD_QUESTION", Object.entries(cell.dataset))
}

function extractAnswer(clue) {
    return clue?.querySelector('.correct_response')?.textContent;   
}

function getCategories(tables) {
    return tables.map(r => Array.from(r.getElementsByClassName("category")))
                 .map(c => c.map(function(cn) {
                     return {
                         "category":cn.querySelector(".category_name").textContent.trim(),
                         "comment":cn.querySelector('.category_comments').textContent.trim()
                        }
                    }))
}

async function getGame(gid) {
    const response = await fetch(`${corsUrl}https://www.j-archive.com/showgame.php?game_id=${gid}`)
    const pageContent = new DOMParser().parseFromString(await response.text(), 'text/html')
    
    if(pageContent.querySelector('.error')) throw Error("J-Archive error, game could not be loaded")

    const header = pageContent.getElementById("game_title").textContent
    const gameDate = new Date(header.split("-")[1]) //something like "Friday, October 18, 2019"
    
    let rounds = Array.from(pageContent.getElementsByClassName("round")).concat(Array.from(pageContent.getElementsByClassName("final_round")))
    let categories = getCategories(rounds)
    let questions = rounds.map(r => Array.from(r.getElementsByClassName("clue")))
                          .map(c => c.map(function(cn) {
                            return {
                                "question": cn.querySelector('.clue_text')?.textContent.trim(),
                                "answer": extractAnswer(cn),
                                "dd": !!cn.querySelector('.clue_value_daily_double'),
                            }
                          }))
    
    let roundSet = []
    for(let [i, r] of categories.entries()) {
        for(let [j, cat] of Array.from(r).entries()) {
            if(i < 2) cat['clues'] = questions[i].filter((_, idx) => ((idx - j) % 6) === 0)
            else cat['clues'] = [{question: questions[i][0]['question'], answer: questions[i][0]['answer']}]
        }             
        roundSet.push(r)
    }
    
    return {
        "rounds": [
            {
                "name": "single_jeopardy",
                "categories": roundSet[0]
            },
            {
                "name": "double_jeopardy",
                "multiplier": 2,
                "categories": roundSet[1]
            },
            {
                "name": "final_jeopardy",
                "categories": roundSet[2],
                "final": true
            }
        ]
    }
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

function showMedia() {
    const mediaEntry = mediaMap[currentCell?.dataset.cell];
    if(mediaEntry) {
        const { media, metadata, type } = mediaEntry;
        switch(type) {
            case "audio":
                media.play();
                break;
            case "image":
                cleanup(mediaDiv); 
                mediaDiv.appendChild(media);
                setState(mediaDiv);
                break;
            case "video":
                cleanup(mediaDiv);
                mediaDiv.appendChild(media);
                setTimeout(() => media.play(), 500);
                setState(mediaDiv);
                break;
            default:
                console.log("Tried to display unsupported media type!")
                break;
        }
    }
}

function hideMedia() {
    const mediaEntry = mediaMap[currentCell?.dataset.cell];
    if(mediaEntry) {
        const { media, metadata, type } = mediaEntry;
        switch(type) {
            case "audio":
                media.pause();
                media.currentTime = metadata.start ?? 0;
                break;
            case "image":
                setState(questionDiv);
                break;
            case "video":
                media.pause();
                media.currentTime = metadata.start ?? 0;
                setState(questionDiv);
                break;
            default:
                console.log("Tried to display unsupported media type!")
                break;
        }
    }
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
