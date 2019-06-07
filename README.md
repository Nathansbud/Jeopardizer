# Jeopardizer: Jeopardy, for the folks at home!

## What?

Jeopardy is awesome, and Jeopardy fans are even cooler! J-Archive has an archive of (nearly) every Jeopardy game to date, and thanks to a shoddily made scraper, so do I!

Jeopardizer random games of Jeopardy (Single, Double, and Final), and is designed 2 screens (one for host console, one for questions) and to be played by 3 players + 4th acting as host. Custom games/categories can be easily implemented, as categories/questions are simply read in by specifying JSON file, category count, and date filter.

## Categories

By default, rounds in Jeopardizer are loaded from the single, double, and final jeopardy files located in the data folder. However, the Round class can take any number of categories loaded in from custom folders, provided categories are loaded in using the following JSON structure:

```javascript
[
    {"Category":"CategoryName", 
     "Clues":[
        {
            "Question":"QuestionText", //Required
            "Answer":"AnswerText", //Required
            "Media":{ //Optional; Parameters required
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
     "Date":"MM/DD/YYYY" //Optional
    }, 
    ...
]
```

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
        Minim
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


