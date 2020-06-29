var corsUrl = "https://cors-anywhere.herokuapp.com"
var answerCapture = new RegExp(`(?<=<em class=\\\\?"correct_response\\\\?">)(.*)(?=</em>)`)

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
            else cat['clues'] = {question: questions[i][0]['question'], answer: cat['answer']}
            delete cat['answer']
        }             
        roundSet.push(r)
    }
    
    return roundSet
}

getGame(6000).then(console.log)