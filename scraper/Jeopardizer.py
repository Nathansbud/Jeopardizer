from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup, SoupStrainer
import json
import os

def simple_get(url):
    try:
        with closing(get(url, stream=True)) as resp:
            if is_good_response(resp):
                return resp.content
            else:
                return None
    except RequestException as e:
        return None

def is_good_response(resp):
    """
    Returns True if the response seems to be HTML, False otherwise.
    """
    content_type = resp.headers['Content-Type'].lower()
    return resp.status_code == 200 and content_type is not None and content_type.find('html') > -1
###ENDS HERE—THANK YOU TO https://realpython.com/python-web-scraping-practical-introduction/

site = "http://www.j-archive.com/"

content = []

#This function should scrape every Jeopardy game off the site, and add them to an array
def scrape_all():
    archive = BeautifulSoup(simple_get(site + "listseasons.php"), parse_only=SoupStrainer('a'), features="html.parser")
    for season in archive:
        if season.has_attr('href'):
            lt = season.get("href")
            if lt.__contains__("showseason.php"):
                episode_list = BeautifulSoup(simple_get(site + lt[lt.find("showseason.php"):]), parse_only=SoupStrainer('a'), features="html.parser")
                for episode in episode_list:
                    li = episode.get("href")
                    if li.__contains__("showgame.php"):
                        questions = BeautifulSoup(simple_get(site + li[li.find("showgame.php"):]), features="html.parser")
                        questions.prettify()

                        if len(questions.find_all('table', {'class':'round'})) + len(questions.find_all('table', {'class':'final_round'})) != 3:
                            print("Questions from " + site + li[li.find("showgame.php"):] + " cannot be read due to the game type! Skipping...")
                            continue
                        else:
                            print("Grabbing questions from " + site + li[li.find("showgame.php"):] + "!")
                            categories = [q.text[2:-2].rstrip("\n") for q in questions.find_all('td', {'class':'category'})]
                            choices = questions.find_all('td', {'class':'clue'})
                            choices.append(questions.find_all('td', {'class':'category'})[-1])

                            clues = [c.text[2:-2].rstrip("\n") for c in choices]
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
                                if clues[a].find("\n\n\n\n\n\n\n") != -1:
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
                                        if "" in r.keys() or "" in r.values():
                                            double_jeopardy.remove(c)
                                            break
                                        else:
                                            break

                            with open('/Users/zackamiton/Code/Jeopardizer/data/single_jeopardy.json', 'a+') as sj:
                                for c in single_jeopardy:
                                    json.dump(c, sj)
                                    sj.write(",")

                            with open('/Users/zackamiton/Code/Jeopardizer/data/double_jeopardy.json', 'a+') as dj:
                                for c in double_jeopardy:
                                    json.dump(c, dj)
                                    dj.write(",")

                            with open('/Users/zackamiton/Code/Jeopardizer/data/final_jeopardy.json', 'a+') as fj:
                                json.dump(final_jeopardy, fj)
                                fj.write(",")

def read_json():
    with open("/Users/zackamiton/Code/Jeopardizer/data/single_jeopardy.json", "r") as f:
        data = json.load(f)
    return data

if __name__ == "__main__":
    scrape_all()
    pass