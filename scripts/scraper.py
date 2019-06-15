#!/usr/bin/env python3.7

from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup, SoupStrainer

import os
import sys
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
def scrape_games(start_point=7):
    archive = BeautifulSoup(simple_get(site + "listseasons.php"), parse_only=SoupStrainer('a'), features="html.parser")

    # Account for links in header
    x = iter(archive)
    for i in range(start_point):  # 7 for S35, 10 for S32, 29 for S13
        x.__next__()

    for season in x:
        if season.has_attr('href'):
            lt = season.get("href")
            if lt.__contains__("showseason.php"):
                episode_list = BeautifulSoup(simple_get(site + lt[lt.find("showseason.php"):]), parse_only=SoupStrainer('a'), features="html.parser")
                season_name = str(lt[lt.find("showseason.php?")+15:]).replace("=", "_")
                read_season(episode_list, season_name)

def scrape_game(link, path, name, individual=False):
    questions = BeautifulSoup(simple_get(link), features="html.parser")
    questions.prettify()
    if len(questions.find_all('table', {'class': 'round'})) + len(
            questions.find_all('table', {'class': 'final_round'})) != 3:
        print("Questions from " + link + " cannot be read due to the game type! Skipping...")
    else:
        print("Grabbing questions from " + link + "!")
        categories = [q.text.strip() for q in questions.find_all('td', {'class': 'category'})]

        game_header = questions.find(attrs={'id': "game_title"}).text  ##Get title
        date = (game_header[game_header.find(",") + 2:]).split()  ##Get date of game
        timestamp = str(months[date[0]]) + "/" + str(date[1][:-1]) + "/" + str(date[2]) ##Format date as M/D/Y

        choices = questions.find_all('td', {'class': 'clue'})
        choices.append(questions.find_all('td', {'class': 'category'})[-1])

        clues = [c.text[2:-2].strip() for c in choices]
        answers = []

        for elem in choices:
            r = elem.find('div')
            if r is not None:
                ans = r["onmouseover"].replace("&gt", ">").replace("&lt", "<").replace("\&quot;",
                                                                                       '"').replace(
                    '\\"correct_response\\"', '"correct_response"')
                answers.append(
                    ans[ans.find('correct_response">') + 18:ans.find("</em")].replace("<i>", "").replace(
                        "</i>", "").strip()) #18 is the num of chars of the text
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
            if clues[a].find("\n\n\n\n\n\n\n") != -1 and len(
                    clues[a].strip()) > 0:  # Handles space between dollar amount/pick order and question
                qa_set.append(  # Single Jeopardy
                    {
                        "Question": clues[a][clues[a].find("\n\n\n\n\n\n\n") + 7:].strip(),
                        "Answer": answers[a].strip()
                    }
                )
            elif len(clues[a].strip()) > 0:
                qa_set.append(  # Final Jeopardy
                    {
                        "Question": clues[a],
                        "Answer": answers[a]
                    }
                )  # Final Jeopardy
            else:
                qa_set.append(  # Append blank for mod math but log index in order to replace it
                    {
                        "Question": "",
                        "Answer": ""
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
                    "Category": c,
                    "Clues": qa_set[i:30:6],
                    "Date": timestamp
                }
            )
            i += 1

        i = 0
        for c in double_jeopardy_categories:
            double_jeopardy.append(
                {
                    "Category": c,
                    "Clues": qa_set[30 + i:60:6],
                    "Date": timestamp
                }
            )
            i += 1

        final_jeopardy.append(
            {
                "Category": final_jeopardy_categories,
                "Clues": [qa_set[-1]],
                "Date": timestamp
            }
        )

        single_blank_unique = []
        double_blank_unique = []

        for removal in single_blank_index:
            if (removal % 6) not in single_blank_unique:
                single_blank_unique.append(removal % 6)

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
        print(timestamp)

        for index in single_blank_unique:
            single_jeopardy.pop(index)

        for index in double_blank_unique:
            double_jeopardy.pop(index)

        print(single_jeopardy)
        print(double_jeopardy)
        print(final_jeopardy)

        with open(os.path.join(path, "single_jeopardy_" + name + ".json"), 'a+' if not individual else 'w+') as sj:
            if individual:
                sj.write("[")
            for c in single_jeopardy:
                json.dump(c, sj)
                sj.write(",")

        with open(os.path.join(path, "double_jeopardy_" + name + ".json"), 'a+' if not individual else 'w+') as dj:
            if individual:
                dj.write("[")
            for c in double_jeopardy:
                json.dump(c, dj)
                dj.write(",")

        with open(os.path.join(path, "final_jeopardy_" + name + ".json"), 'a+' if not individual else 'w+') as fj:
            if individual:
                fj.write("[")
            for c in final_jeopardy:
                json.dump(c, fj)
                fj.write(",")
    if individual:
        add_end_bracket(path)

def read_season(episode_list, season_name): #Episode list should be beautifulsoup, season_name is the name of the outputted file
    with open(os.path.join(os.path.dirname(__file__), "..", "process", "by_season", "single_jeopardy_" + season_name + ".json"), "w+") as sj: sj.write("[")
    with open(os.path.join(os.path.dirname(__file__), "..", "process", "by_season", "double_jeopardy_" + season_name + ".json"), "w+") as dj: dj.write("[")
    with open(os.path.join(os.path.dirname(__file__), "..", "process", "by_season", "final_jeopardy_" + season_name + ".json"), "w+") as fj: fj.write("[")

    for episode in episode_list:
        li = episode.get("href")
        if li.__contains__("showgame.php"):
            try:
                scrape_game(site + li[li.find("showgame.php"):], os.path.join(os.path.dirname(__file__), "..", "process", "by_season"), season_name)
            except:
                print("Something went wrong and an exception was thrown! Link was " + li[li.find("showgame.php"):])

    add_end_bracket(os.path.join(os.path.dirname(__file__), "..", "process", "by_season"))

def read_json(file):
    with open(file, "r") as f:
        data = json.load(f)
    return data

def add_end_bracket(path):
    files = os.listdir(path)

    for f in files:
        with open(os.path.join(path, f), 'rb+') as bfile:
            bfile.seek(-1, os.SEEK_END)
            bfile.truncate()
        with open(os.path.join(path, f), 'a') as bfile:
            bfile.write("]")

def combine_files(path=os.path.join(os.path.dirname(__file__), "..", "data", "questions")):
    names = ["single_jeopardy", "double_jeopardy", "final_jeopardy"]

    for name in names:
        with open(os.path.join(path, "all", name + ".json"), "w+") as cat:
            cat.write("[")
            for file in os.listdir(os.path.join(path, "by_season")):
                if file.startswith(name):
                    with(open(os.path.join(path, "by_season", file), 'r')) as add:
                        questions = json.load(add)
                        for q in questions:
                            json.dump(q, cat)
                            cat.write(",")

    add_end_bracket(os.path.join(path, "all"))


def make_customs(overwrite, question_count):
    path = os.path.join(os.path.dirname(__file__), "..", "process")
    custom_path = os.path.join(os.path.dirname(__file__), "..", "questions", "custom")

    for file in os.listdir(path):
        with open(path + file, "r") as custom:
            categories = custom.readlines()
            json_add = []
            for category in categories:
                cat = [qa.strip() for qa in category.split("|")]
                questions = cat[1::2]
                answers = cat[2::2]

                if len(questions) == len(answers) == question_count:
                    qa_set = []
                    for i in range(len(questions)):
                        qa_set.append(
                            {
                                "Question":questions[i],
                                "Answer":answers[i]
                            }
                        )

                    json_add.append(
                        {
                            "Category":cat[0],
                            "Clues":qa_set
                        }
                    )
                else:
                    print("Excluded category due to incorrect question count: ")
                    print(cat)

            exists = os.path.isfile(custom_path + file[:file.rfind(".")] + ".json")
            if not exists or overwrite:
                print("Made category file from " + file)
                with open(custom_path + file[:file.rfind(".")] + ".json", "w+") as custom_json:
                    json.dump(json_add, custom_json)
            else:
                print("File already exists, did not overwrite!")

if __name__ == "__main__":
    # make_customs(True, 5)
    # read_season(BeautifulSoup(simple_get("http://www.j-archive.com/showseason.php?season=superjeopardy"), parse_only=SoupStrainer('a'),features="html.parser"), "superjeopardy")
    # scrape_game("http://wwreaw.j-archive.com/showgame.php?game_id=6302", "/Users/zackamiton/Code/Jeopardizer/data/questions/scrape", "scraped", True)
    if len(sys.argv) == 3:
        if str(sys.argv[1]).lower() == "-s":
            scrape_game(sys.argv[2], os.path.join(os.path.dirname(__file__), "..", "data", "questions", "scrape"), "scraped", True)
    else:
        # read_season(BeautifulSoup(simple_get("http://www.j-archive.com/showseason.php?season=35"), parse_only=SoupStrainer('a'), features="html.parser"), "35")
        pass
    pass



