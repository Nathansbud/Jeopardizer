from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup, SoupStrainer

import os
import sys
import random
import json



def simple_get(url):
    try:
        with closing(get(url, stream=True)) as resp:
            if is_good_response(resp):
                return resp.content
            else:
                print(resp.status_code)
                return None
    except RequestException as e:
        return None

def is_good_response(resp):
    """
    Returns True if the response seems to be HTML, False otherwise.
    """
    content_type = resp.headers['Content-Type'].lower()
    return resp.status_code == 200 and content_type is not None and content_type.find('html') > -1

site = "http://www.j-archive.com/"

content = []
months = {
    "January":1,
    "February":2,
    "March":3,
    "April":4,
    "May":5,
    "June":6,
    "July":7,
    "August":8,
    "September":9,
    "October":10,
    "November":11,
    "December":12
}

#This function should scrape every Jeopardy game off the site, and add them to an array
def scrape_all():
    archive = BeautifulSoup(simple_get(site + "listseasons.php"), parse_only=SoupStrainer('a'), features="html.parser")

    #Account for links in header
    x = iter(archive)
    for i in range(7): #7 for S35, 10 for S32, 29 for S13
        x.__next__()

    for season in x:
        if season.has_attr('href'):
            lt = season.get("href")
            if lt.__contains__("showseason.php"):
                episode_list = BeautifulSoup(simple_get(site + lt[lt.find("showseason.php"):]), parse_only=SoupStrainer('a'), features="html.parser")
                for episode in episode_list:
                    try:
                        li = episode.get("href")
                        if li.__contains__("showgame.php"):
                            # try:
                            questions = BeautifulSoup(simple_get(site + li[li.find("showgame.php"):]), features="html.parser")
                            questions.prettify()
                            if len(questions.find_all('table', {'class':'round'})) + len(questions.find_all('table', {'class':'final_round'})) != 3:
                                print("Questions from " + site + li[li.find("showgame.php"):] + " cannot be read due to the game type! Skipping...")
                                continue
                            else:
                                print("Grabbing questions from " + site + li[li.find("showgame.php"):] + "!")
                                categories = [q.text.strip() for q in questions.find_all('td', {'class':'category'})]

                                game_header = questions.find(attrs={'id':"game_title"}).text ##Get title
                                date = (game_header[game_header.find(",")+2:]).split() ##Get date of game
                                timestamp = str(months[date[0]]) + "/" + str(date[1][:-1]) + "/" + str(date[2]) ##Format date as M/D/Y

                                choices = questions.find_all('td', {'class':'clue'})
                                choices.append(questions.find_all('td', {'class':'category'})[-1])



                                clues = [c.text[2:-2].strip() for c in choices]
                                answers = []

                                for elem in choices:
                                    r = elem.find('div')
                                    if r is not None:
                                        ans = r["onmouseover"].replace("&gt", ">").replace("&lt", "<").replace("\&quot;", '"').replace('\\"correct_response\\"', '"correct_response"')
                                        answers.append(ans[ans.find('correct_response">')+18:ans.find("</em")].replace("<i>", "").replace("</i>", ""))
                                    else:
                                        if answers.__len__() == 60:
                                            pass
                                        else:
                                            answers.append("")

                                single_jeopardy_categories = categories[:6]
                                double_jeopardy_categories = categories[6:12]
                                final_jeopardy = categories[-1][1:]

                                single_jeopardy = []
                                double_jeopardy = []

                                qa_set = []

                                for a in range(0, 61):
                                    if clues[a].find("\n\n\n\n\n\n\n") != -1: #Handles space between dollar amount/pick order and question
                                        qa_set.append({clues[a][clues[a].find("\n\n\n\n\n\n\n")+7:]:answers[a]}) #Normal Jeopardies
                                    elif len(clues[a]) > 0:
                                        qa_set.append({clues[a][1:]:answers[a]}) #Final Jeopardy
                                    else:
                                        qa_set.append({clues[a]:answers[a]})
                                i = 0
                                for c in single_jeopardy_categories:
                                    single_jeopardy.append({c:qa_set[i:30:6]})
                                    i += 1
                                i = 0
                                for c in double_jeopardy_categories:
                                    double_jeopardy.append({c:qa_set[30+i:60:6]})
                                    i += 1

                                final_jeopardy = {final_jeopardy:qa_set[-1]}

                                for c in single_jeopardy:
                                    for n in c.values():
                                        for r in n:
                                            if "" in r.keys() or "" in r.values():
                                                single_jeopardy.remove(c)
                                                break
                                            else:
                                                break

                                for c in double_jeopardy:
                                    for n in c.values():
                                        for r in n:
                                            if "" in r.keys() or "" in r.values() or " " in r.keys() or " " in r.values() or "\n" in r.keys() or "\n" in r.values():
                                                double_jeopardy.remove(c)
                                                break
                                            else:
                                                break

                                ##This JSON code is outputted fine, but requires array brackets before and after in order to function properly; make sure to add these
                                with open(os.path.join(os.path.dirname(__file__), "..", "redata", "sj.json"), 'a+') as sj:
                                    for c in single_jeopardy:
                                        json.dump(c, sj)
                                        sj.write(",")

                                with open(os.path.join(os.path.dirname(__file__), "..", "redata", "dj.json"), 'a+') as dj:
                                    for c in double_jeopardy:
                                        json.dump(c, dj)
                                        dj.write(",")

                                with open(os.path.join(os.path.dirname(__file__), "..", "redata", "fj.json"), 'a+') as fj:
                                    json.dump(final_jeopardy, fj)
                                    fj.write(",")
                    except:
                        print("Something went wrong and an exception was thrown! Link was " + li[li.find("showgame.php"):])

def scrape_games():
    archive = BeautifulSoup(simple_get(site + "listseasons.php"), parse_only=SoupStrainer('a'), features="html.parser")

    # Account for links in header
    x = iter(archive)
    for i in range(7):  # 7 for S35, 10 for S32, 29 for S13
        x.__next__()

    for season in x:
        if season.has_attr('href'):
            lt = season.get("href")
            if lt.__contains__("showseason.php"):
                episode_list = BeautifulSoup(simple_get(site + lt[lt.find("showseason.php"):]), parse_only=SoupStrainer('a'), features="html.parser")
                season_name = str(lt[lt.find("showseason.php?")+15:]).replace("=", "_")

                for episode in episode_list:
                        li = episode.get("href")
                        if li.__contains__("showgame.php"):
                            try:
                                questions = BeautifulSoup(simple_get(site + li[li.find("showgame.php"):]), features="html.parser")
                                questions.prettify()
                                if len(questions.find_all('table', {'class': 'round'})) + len(questions.find_all('table', {'class': 'final_round'})) != 3:
                                    print("Questions from " + site + li[li.find("showgame.php"):] + " cannot be read due to the game type! Skipping...")
                                    continue
                                else:
                                    print("Grabbing questions from " + site + li[li.find("showgame.php"):] + "!")
                                    categories = [q.text.strip() for q in questions.find_all('td', {'class': 'category'})]

                                    game_header = questions.find(attrs={'id': "game_title"}).text  ##Get title
                                    date = (game_header[game_header.find(",") + 2:]).split()  ##Get date of game
                                    timestamp = str(months[date[0]]) + "/" + str(date[1][:-1]) + "/" + str(date[2])  ##Format date as M/D/Y
                                    # print(timestamp)

                                    choices = questions.find_all('td', {'class': 'clue'})
                                    choices.append(questions.find_all('td', {'class': 'category'})[-1])

                                    clues = [c.text[2:-2].strip() for c in choices]
                                    answers = []

                                    for elem in choices:
                                        r = elem.find('div')
                                        if r is not None:
                                            ans = r["onmouseover"].replace("&gt", ">").replace("&lt", "<").replace("\&quot;", '"').replace('\\"correct_response\\"', '"correct_response"')
                                            answers.append(ans[ans.find('correct_response">') + 18:ans.find("</em")].replace("<i>","").replace("</i>", "").strip())
                                        else:
                                            if answers.__len__() == 60:
                                                pass
                                            else:
                                                answers.append("")

                                    single_jeopardy_categories = categories[:6]
                                    double_jeopardy_categories = categories[6:12]
                                    final_jeopardy_categories = categories[-1]

                                    single_jeopardy = []
                                    double_jeopardy = []
                                    final_jeopardy = []

                                    qa_set = []

                                    single_blank_index = []
                                    double_blank_index = []


                                    for a in range(0, 61):
                                        if clues[a].find("\n\n\n\n\n\n\n") != -1 and len(clues[a].strip()) > 0:  # Handles space between dollar amount/pick order and question
                                            qa_set.append( #Single Jeopardy
                                                {
                                                    "Question":clues[a][clues[a].find("\n\n\n\n\n\n\n") + 7:].strip(),
                                                    "Answer":answers[a].strip()
                                                }
                                            )
                                        elif len(clues[a].strip()) > 0:
                                            qa_set.append( #Final Jeopardy
                                                {
                                                    "Question":clues[a],
                                                    "Answer":answers[a]
                                                }
                                            )  # Final Jeopardy
                                        else:
                                            qa_set.append( #Append blank for mod math but log index in order to replace it
                                                {
                                                    "Question":"",
                                                    "Answer":""
                                                }
                                            )
                                            if a < 30:
                                                single_blank_index.append(a)
                                            else:
                                                double_blank_index.append(a)

                                    i = 0
                                    for c in single_jeopardy_categories:
                                        single_jeopardy.append(
                                            {
                                                "Category":c,
                                                "Clues":qa_set[i:30:6],
                                                "Date":timestamp
                                            }
                                        )
                                        i += 1

                                    i = 0
                                    for c in double_jeopardy_categories:
                                        double_jeopardy.append(
                                            {
                                                "Category":c,
                                                "Clues":qa_set[30+i:60:6],
                                                "Date":timestamp
                                            }
                                        )
                                        i += 1

                                    final_jeopardy.append(
                                        {
                                            "Category":final_jeopardy_categories,
                                            "Clues":[qa_set[-1]],
                                            "Date":timestamp
                                        }
                                    )

                                    single_blank_unique = []
                                    double_blank_unique = []

                                    for removal in single_blank_index:
                                        if (removal % 6) not in single_blank_unique:
                                            single_blank_unique.append(removal%6)

                                    for removal in double_blank_index:
                                        if (removal % 6) not in double_blank_unique:
                                            double_blank_unique.append(removal % 6)

                                    if single_blank_unique.__len__() > 0:
                                        single_blank_unique.sort()
                                        single_blank_unique.reverse()

                                    if double_blank_unique.__len__() > 0:
                                        double_blank_unique.sort()
                                        double_blank_unique.reverse()

                                    print(single_blank_unique)
                                    print(double_blank_unique)

                                    for index in single_blank_unique:
                                        single_jeopardy.pop(index)

                                    for index in double_blank_unique:
                                        double_jeopardy.pop(index)

                                    print(single_jeopardy)
                                    print(double_jeopardy)
                                    print(final_jeopardy)

                                    with open(os.path.join(os.path.dirname(__file__), "..", "redata", "single_jeopardy_" + season_name + ".json"),
                                              'a+') as sj:
                                        for c in single_jeopardy:
                                            json.dump(c, sj)
                                            sj.write(",")

                                    with open(os.path.join(os.path.dirname(__file__), "..", "redata", "double_jeopardy_" + season_name + ".json"),
                                              'a+') as dj:
                                        for c in double_jeopardy:
                                            json.dump(c, dj)
                                            dj.write(",")

                                    with open(os.path.join(os.path.dirname(__file__), "..", "redata", "final_jeopardy_" + season_name + ".json"),
                                              'a+') as fj:
                                        for c in final_jeopardy:
                                            json.dump(c, fj)
                                            fj.write(",")
                            except:
                                print("Something went wrong and an exception was thrown! Link was " + li[li.find("showgame.php"):])

def read_json(file):
    with open(file, "r") as f:
        data = json.load(f)
    return data

if __name__ == "__main__":
    scrape_games()
    pass

