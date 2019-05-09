from requests import get
from requests.exceptions import RequestException
from contextlib import closing
from bs4 import BeautifulSoup, SoupStrainer

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
                        first_round = questions.find('div', {'id':'jeopardy_round'}).findChildren("table", {'class':'round'}, recursive=False)
                        second_round = questions.find('div', {'id':'double_jeopardy_round'}).findChildren("table", {'class':'round'}, recursive=False)
                        final_round = questions.find('table', {'class':'final_round'})

                        #Right now this is in raw html mode
                        content.append([{"Single Jeopardy":first_round, "Double Jeopardy":second_round, "Final Jeopardy":final_round}])
                        print(content)

if __name__ == "__main__":
    scrape_all()
    pass