# Jeopardizer: Jeopardy, for the folks at home!

## What?

Jeopardizer is a tool to create and play games of Jeopardy, randomly (with past categories from games throughout history), from a specific past game via J-Archive link, or by creating custom categories! Jeopardizer is designed for 2 screens in mind (one for host console, and one for questions), and is ideally played with with 3 players and 1 host.

## Categories

By default, rounds in Jeopardizer are loaded from the single, double, and final jeopardy files located in data/questions/all, which are created by scraping J-Archive. Categories are randomly selected from these past files to create a standard Jeopardy game (6 categories for Single Jeopardy, 6 categories for Double Jeopardy, 1 category for Final Jeopardy), with the option for user-specified category count and date range are provided. Content-based filters are unlikely to be implemented as J-Archive is untagged.

Specific games are require a J-Archive URL, which is then scraped to create files in data/questions/custom, rather than the random category selection. This requires an internet connection.

Custom games can be created by adding custom JSON files to data/questions/custom, based on the following structure:

```javascript
[
    {"Category":"CategoryName", 
     "Clues":[
        {
            "Question":"QuestionText", //Required
            "Answer":"AnswerText", //Required
            "Media":{ //Optional; parameters required
                "Name":"MediaName",
                "Type":"Audio | Video | Image", //Must be one of these
                "Path":"Filepath", 
            }
        }, 
        {
            "Question":"...",
            "Answer":"...",
            "Media":{
                ...
            }            
        }
        ...
     ], 
     "Date":"MM/DD/YYYY" //Optional, used for date filter
    }, 
    ...
]
```

Alternatively, simple categories can be created by adding plain text files to the process folder, with the following format:

```css
Category1|Q1|A1|Q2|A2|Q3|A3|Q4|A4|Q5|A5
Category2|Q1|A1|Q2|A2|Q3|A3|Q4|A4|Q5|A5
...
CategoryN|Q1|A1|Q2|A2|Q3|A3|Q4|A4|Q5|A5
```
Running either customs.py or Jeopardizer will move these files to data/questions/custom, where they can be loaded in as custom categories; this does not yet support media specifications, though those can be manually added to the generated JSON files. 

## Dependencies

<em>Game (Java)</em>

<ul>
    <li>
        Processing (Maven: org.processing:pdf:3.3.7)
        <ul>
            <li>All graphics-related code in this program is handled by Processing as the main graphics library.</li>
            <li>Java 1.7 or 1.8 must be used, as 1.9 is non-functional with Processing, and ThreadLocalRandom was only implemented in 1.8.</li>
        </ul>
    </li>
    <li>
        json-simple (Maven: com.googlecode.json-simple:json-simple:1.1.1)
        <ul>
            <li>json-simple is required used in order to parse the question json files and read them in as categories.</li>
        </ul>
    </li>
    <li>
        Minim (Maven: net.compartmental.code:minim:2.2.2)
        <ul>
            <li>Minim is used to play Jeopardy SFX—possibly overkill, but JavaSound felt like an ordeal</li>
        </ul>
    </li>
</ul>

<em>Scraper (Python)</em>

<ul> 
    <li>
        BeautifulSoup
        <ul><li>BeautifulSoup is used for to scrape J-Archive's game files, so install this in order to run the scraper</ul>
    </li>
</ul>


