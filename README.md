# Jeopardizer: Jeopardy, for the folks at home!

## What?

Jeopardy is awesome, and Jeopardy fans are even cooler! J-Archive has an archive of (nearly) every Jeopardy game to date, and thanks to a shoddily made scraper, so do I!

This generates random games of Jeopardy (Single, Double, and Final), for 3 players, with a 4th acting as the game's host and controlling selection and score awarding via keyboard as the "dev console." Core game loop is finished, though timers and buzzers are not implemented programmatically as of yet, and occasionally unfinished categories or categories that require external media which is unpresent can show up on the board. Overall, largely functional though!

## External Dependencies

<em>Game (Java)</em>

<ul>
    <li>
        Processing (Maven: org.processing:pdf:3.3.7)
        <ul>
            <li>All graphics-related code in this program is handled by Processing as the main graphics library.</li>
        </ul>
    </li>
    <li>
        json-simple (Maven: com.googlecode.json-simple:json-simple:1.1.1)
        <ul>
            <li>json-simple is required used in order to parse the question json files and read them in as categories.</li>
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

