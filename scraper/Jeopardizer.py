#!/usr/bin/env python3.7
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
def scrape_games():
    archive = BeautifulSoup(simple_get(site + "listseasons.php"), parse_only=SoupStrainer('a'), features="html.parser")

    # Account for links in header
    x = iter(archive)
    for i in range(11):  # 7 for S35, 10 for S32, 29 for S13
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

                                is_last = (episode_list.index(episode) == len(episode_list) - 1)
                                is_first = (episode_list.index(episode) == 7) #Might not always succeed

                                with open(os.path.join(os.path.dirname(__file__), "..", "redata", "by_season", "single_jeopardy_" + season_name + ".json"),
                                          'a+') as sj:
                                    if is_first:
                                        sj.write("[")

                                    for c in single_jeopardy:
                                        json.dump(c, sj)

                                        if is_last and single_jeopardy.index(c) == len(single_jeopardy) - 1:
                                            sj.write("]")
                                        else:
                                            sj.write(",")

                                with open(os.path.join(os.path.dirname(__file__), "..", "redata", "by_season", "double_jeopardy_" + season_name + ".json"),
                                          'a+') as dj:
                                    if is_first:
                                        dj.write("[")

                                    for c in double_jeopardy:
                                        json.dump(c, dj)

                                        if is_last and double_jeopardy.index(c) == len(double_jeopardy) - 1:
                                            dj.write("]")
                                        else:
                                            dj.write(",")

                                with open(os.path.join(os.path.dirname(__file__), "..", "redata", "by_season", "final_jeopardy_" + season_name + ".json"),
                                          'a+') as fj:
                                    for c in final_jeopardy:
                                        if is_first:
                                            fj.write("[")

                                        json.dump(c, fj)

                                        if is_last and final_jeopardy.index(c) == len(final_jeopardy)-1:
                                            fj.write("]")
                                        else:
                                            fj.write(",")
                        except:
                            print("Something went wrong and an exception was thrown! Link was " + li[li.find("showgame.php"):])

def read_json(file):
    with open(file, "r") as f:
        data = json.load(f)
    return data

def add_end_bracket(end):
    path = "/Users/zackamiton/Code/Jeopardizer/redata/"+end

    files = os.listdir(path)

    for f in files:
        with open(path + f, 'rb+') as bfile:
            bfile.seek(-1, os.SEEK_END)
            bfile.truncate()
        with open(path + f, 'a') as bfile:
            bfile.write("]")

def combine_files():
    path = "/Users/zackamiton/Code/Jeopardizer/redata/"
    names = ["single_jeopardy", "double_jeopardy", "final_jeopardy"]

    for name in names:
        with open(path + "all/" + name + ".json", "a+") as cat:
            cat.truncate(0)
            cat.write("[")
            for file in os.listdir(path + "by_season"):
                if file.startswith(name):
                    with(open(path + "by_season/" + file, 'r')) as add:
                        questions = json.load(add)
                        for q in questions:
                            json.dump(q, cat)
                            cat.write(",")

    add_end_bracket("all/")







if __name__ == "__main__":
    # scrape_games()
    # add_end_bracket("by_season/")
    combine_files()
    pass


